import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { verifyAdmin } from '@/lib/adminAuth';
import { randomUUID } from 'crypto';
import QRCode from 'qrcode';
import JSZip from 'jszip';

export async function POST(request: Request) {
  try {
    // 1. Auth & Admin Verification using @supabase/ssr
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll()
            },
            setAll(cookiesToSet) {
                try {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        cookieStore.set(name, value, options)
                    )
                } catch {
                    // Ignored
                }
            },
          },
        }
    );

    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
        return NextResponse.json({ error: 'Unauthorized: No session' }, { status: 401 });
    }

    await verifyAdmin();

    const body = await request.json();
    const { campaign_id, quantity } = body;

    // 2. Validation
    if (!campaign_id || !quantity || quantity <= 0) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    // STRICT SERVER-SIDE ENFORCEMENT
    // Increased max limit for Async Jobs, but keep a reasonable cap if needed.
    // Let's allow up to 50,000 for async.
    const MAX_SYNC_QR = 200;
    const MAX_ASYNC_QR = 50000;

    if (quantity > MAX_ASYNC_QR) {
      return NextResponse.json({ error: `Max quantity is ${MAX_ASYNC_QR}.` }, { status: 400 });
    }

    console.log(`[QR-GEN] Starting generation. Campaign: ${campaign_id}, Qty: ${quantity}, User: ${user.id}`);

    // 3. Generate Codes & Rows
    const rows = [];
    for (let i = 0; i < quantity; i++) {
        rows.push({
            campaign_id,
            qr_token: randomUUID(),
            is_used: false,
            created_at: new Date().toISOString()
        });
    }

    // 4. DB Insert (Chunked) using Service Role (getSupabaseAdmin)
    const supabaseAdmin = getSupabaseAdmin();
    const dbChunkSize = 1000;
    for (let i = 0; i < rows.length; i += dbChunkSize) {
        const chunk = rows.slice(i, i + dbChunkSize);
        const { error } = await supabaseAdmin.from('bottles').insert(chunk);
        
        if (error) {
            console.error("[QR-GEN] DB Insert Error:", error);
            throw new Error(`Database error: ${error.message}`);
        }
    }

    // --- CONDITIONAL LOGIC START ---
    
    // IF LARGE BATCH: Create Job & Return
    if (quantity > MAX_SYNC_QR) {
        console.log(`[QR-GEN] Large batch detected (${quantity}). Creating background job.`);
        
        const { data: job, error: jobError } = await supabaseAdmin
            .from('qr_jobs')
            .insert({
                campaign_id,
                total: quantity,
                processed: 0,
                status: 'pending'
            })
            .select()
            .single();

        if (jobError) {
             console.error("[QR-GEN] Job Creation Error:", jobError);
             throw new Error(`Failed to create generation job: ${jobError.message}`);
        }

        return NextResponse.json({
            success: true,
            job_id: job.id,
            status: 'processing', // Client sees this and starts polling
            message: `Started background generation for ${quantity} QR codes.`
        });
    }

    // IF SMALL BATCH: Continue with Synchronous Generation (Original Logic)
    console.log(`[QR-GEN] Small batch detected (${quantity}). Generating synchronously.`);

    // 5. Generate ZIP
    const zip = new JSZip();
    const folder = zip.folder("qr_codes");
    let csvContent = "qr_token,url,campaign_id,created_at\n";

    const imagePromises = rows.map(async (row, index) => {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://akuafi.com';
        const url = `${baseUrl}/scan/${row.qr_token}`;
        csvContent += `${row.qr_token},${url},${row.campaign_id},${row.created_at}\n`;

        const buffer = await QRCode.toBuffer(url, {
            errorCorrectionLevel: 'H',
            width: 512,
            margin: 2,
            type: 'png'
        });

        const fileName = `QR_${String(index + 1).padStart(4, '0')}_${row.qr_token.slice(0, 4)}.png`;
        folder?.file(fileName, buffer);
    });

    await Promise.all(imagePromises);
    zip.file("campaign_codes.csv", csvContent);
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

    // 6. Return Response
    return new NextResponse(new Uint8Array(zipBuffer), {
        status: 200,
        headers: {
            'Content-Type': 'application/zip',
            'Content-Disposition': `attachment; filename="qr_campaign_${campaign_id}_batch_${Date.now()}.zip"`
        }
    });

  } catch (error: any) {
    console.error("[QR-GEN] Fatal Error:", error);
    const status = error.message.includes('Unauthorized') ? 401 : 500;
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status });
  }
}
