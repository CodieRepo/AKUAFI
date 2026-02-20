import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { verifyAdmin } from '@/lib/adminAuth';
import { randomUUID } from 'crypto';
import QRCode from 'qrcode';
import JSZip from 'jszip';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
// Async QR generation is FROZEN. All generation is strictly synchronous.
// Maximum allowed QRs per request.
const MAX_QR_PER_BATCH = 200;

// ─── POST /api/admin/qr/generate ─────────────────────────────────────────────
export async function POST(request: Request) {
  try {
    // 1. Auth & Admin Verification
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Ignored in middleware context
            }
          },
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized: No session' }, { status: 401 });
    }

    await verifyAdmin();

    // 2. Parse & Validate Input
    const body = await request.json();
    const { campaign_id, quantity } = body;

    if (!campaign_id || !quantity || quantity <= 0) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    // Hard cap — async generation is frozen
    if (quantity > MAX_QR_PER_BATCH) {
      return NextResponse.json(
        { error: `Max ${MAX_QR_PER_BATCH} QRs per batch. Async generation is currently disabled.` },
        { status: 400 }
      );
    }

    console.log(`[QR-GEN] Starting synchronous generation. Campaign: ${campaign_id}, Qty: ${quantity}`);

    // 3. Build bottle rows
    const rows = Array.from({ length: quantity }, () => ({
      campaign_id,
      qr_token: randomUUID(),
      is_used: false,
      created_at: new Date().toISOString(),
      // job_id intentionally omitted — async system is frozen
    }));

    // 4. Insert into DB (chunked to stay within Supabase row limits)
    const supabaseAdmin = getSupabaseAdmin();
    const DB_CHUNK = 500;

    for (let i = 0; i < rows.length; i += DB_CHUNK) {
      const chunk = rows.slice(i, i + DB_CHUNK);
      const { error: dbErr } = await supabaseAdmin.from('bottles').insert(chunk);
      if (dbErr) {
        console.error('[QR-GEN] DB insert error:', dbErr);
        throw new Error(`Database error: ${dbErr.message}`);
      }
    }

    console.log(`[QR-GEN] DB insert complete. Generating QR images sequentially...`);

    // 5. Generate QR images SEQUENTIALLY (no Promise.all — stable for up to 200)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://akuafi.com';
    const zip = new JSZip();
    const folder = zip.folder('qr_codes');
    let csvContent = 'qr_token,url,campaign_id,created_at\n';

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const url = `${baseUrl}/scan/${row.qr_token}`;
      csvContent += `${row.qr_token},${url},${row.campaign_id},${row.created_at}\n`;

      const buffer = await QRCode.toBuffer(url, {
        errorCorrectionLevel: 'H',
        width: 512,
        margin: 2,
        type: 'png',
      });

      const fileName = `QR_${String(i + 1).padStart(4, '0')}_${row.qr_token.slice(0, 4)}.png`;
      folder?.file(fileName, buffer);
    }

    zip.file('campaign_codes.csv', csvContent);

    console.log(`[QR-GEN] All ${quantity} QR images generated. Building ZIP...`);

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

    console.log(`[QR-GEN] ZIP ready. Size: ${zipBuffer.length} bytes.`);

    // 6. Stream ZIP response
    return new NextResponse(new Uint8Array(zipBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="qr_campaign_${campaign_id}_${Date.now()}.zip"`,
      },
    });

  } catch (error: any) {
    console.error('[QR-GEN] Fatal error:', error);
    const status = error.message?.includes('Unauthorized') ? 401 : 500;
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status }
    );
  }
}
