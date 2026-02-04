import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'; // Use service role for inserts
import { verifyAdmin } from '@/lib/adminAuth';
import { randomUUID } from 'crypto';
import QRCode from 'qrcode';
import JSZip from 'jszip';

export async function POST(request: Request) {
  try {
    // 1. Auth & Admin Verification
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized: No session' }, { status: 401 });
    }

    // Verify admin privileges using the helper (which likely checks the 'admins' table or metadata)
    // Re-implementing basic check here for robustness if verifyAdmin is complex, 
    // but usually we trust the shared library. I'll rely on verifyAdmin logic but ensure it accepts the request object.
    // If verifyAdmin throws, we catch it.
    await verifyAdmin(request); 

    const body = await request.json();
    const { campaign_id, quantity } = body;

    // 2. Validation
    if (!campaign_id || !quantity || quantity <= 0) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    const MAX_QR_PER_REQUEST = 2000;
    if (quantity > MAX_QR_PER_REQUEST) {
      return NextResponse.json({ error: `Max quantity per request is ${MAX_QR_PER_REQUEST}. Please batch your requests.` }, { status: 400 });
    }

    console.log(`[QR-GEN] Starting generation. Campaign: ${campaign_id}, Qty: ${quantity}`);

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

    // 4. DB Insert (using Admin Client for bypass RLS on insert if needed, or ensuring RLS allows insert)
    // Using service role key is safest for bulk admin operations.
    const supabaseAdmin = getSupabaseAdmin();
    
    // Chunk inserts to be safe with Supabase limits (though 2000 might fit, 1000 is safer)
    const dbChunkSize = 1000;
    for (let i = 0; i < rows.length; i += dbChunkSize) {
        const chunk = rows.slice(i, i + dbChunkSize);
        const { error } = await supabaseAdmin
            .from('bottles')
            .insert(chunk);
        
        if (error) {
            console.error("[QR-GEN] DB Insert Error:", error);
            throw new Error(`Database error: ${error.message}`);
        }
    }
    console.log(`[QR-GEN] DB Insertion complete.`);

    // 5. Generate ZIP
    const zip = new JSZip();
    const folder = zip.folder("qr_codes");

    // CSV Header
    let csvContent = "qr_token,url,campaign_id,created_at\n";

    // Generate QR Images and CSV Rows
    // Mapping matches the 'rows' array
    const imagePromises = rows.map(async (row, index) => {
        const url = `https://akuafi.com/scan/${row.qr_token}`;
        
        // Append to CSV
        csvContent += `${row.qr_token},${url},${row.campaign_id},${row.created_at}\n`;

        // Generate QR Buffer
        // width: 512, margin: 2
        const buffer = await QRCode.toBuffer(url, {
            errorCorrectionLevel: 'H',
            width: 512,
            margin: 2,
            type: 'png'
        });

        // Add to Zip
        const fileName = `QR_${String(index + 1).padStart(4, '0')}_${row.qr_token.slice(0, 4)}.png`;
        folder?.file(fileName, buffer);
    });

    await Promise.all(imagePromises);

    // Add CSV to Zip
    zip.file("campaign_codes.csv", csvContent);

    // Generate Zip Buffer
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

    // 6. Return Response
    // Return appropriate headers for file download
    return new NextResponse(zipBuffer, {
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
