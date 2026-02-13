import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { otpService } from '@/services/otp';

export async function POST(req: NextRequest) {
  try {
    const { phone, otp, qr_token, name } = await req.json();

    console.log("--- API REDEEM V2 (RPC) ---");
    console.log("Phone:", phone, "QR:", qr_token);

    if (!phone || !otp || !qr_token) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 0. Normalize Phone
    const normalizedPhone = phone.startsWith('+') ? phone : `+91${phone}`;

    // --- CAMPAIGN ACTIVE CHECK (STRICT UTC) ---
    const supabaseAdmin = getSupabaseAdmin();

    // Fetch bottle -> campaign_id
    const { data: bottleData, error: bottleError } = await supabaseAdmin
        .from('bottles')
        .select('campaign_id, status')
        .eq('qr_token', qr_token)
        .single();

    if (bottleError || !bottleData) {
        return NextResponse.json({ error: 'Invalid QR Token' }, { status: 400 });
    }

    if (bottleData.status === 'used') {
         return NextResponse.json({ error: 'This QR code has already been used.' }, { status: 400 });
    }

    // Fetch campaign details
    const { data: campaign, error: campaignError } = await supabaseAdmin
        .from('campaigns')
        .select('start_date, end_date, status')
        .eq('id', bottleData.campaign_id)
        .single();

    if (campaignError || !campaign) {
        return NextResponse.json({ error: 'Campaign not found' }, { status: 400 });
    }

    const nowUTC = new Date();
    const startDate = new Date(campaign.start_date);
    const endDate = new Date(campaign.end_date);

    // Hardening: Check for invalid dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
         console.error(`[Redeem] Invalid Campaign Dates: Start=${campaign.start_date}, End=${campaign.end_date}`);
         return NextResponse.json({ error: 'Campaign configuration error (Invalid Date)' }, { status: 500 });
    }

    // Explicit UTC Comparison
    const isActive = startDate <= nowUTC && endDate >= nowUTC;

    console.log(`[Redeem] QC: Now=${nowUTC.toISOString()}, Start=${startDate.toISOString()}, End=${endDate.toISOString()}, Active=${isActive}`);

    if (!isActive) {
        if (nowUTC < startDate) {
             return NextResponse.json({ error: 'Campaign has not started yet' }, { status: 400 });
        }
        return NextResponse.json({ error: 'Campaign has expired' }, { status: 400 });
    }

    if (campaign.status !== 'active') {
         return NextResponse.json({ error: `Campaign is ${campaign.status}` }, { status: 400 });
    }
    // ------------------------------------------

    // 1. VERIFY OTP
    const otpResult = await otpService.validateOTP(normalizedPhone, otp);
    
    if (!otpResult.valid) {
        return NextResponse.json({ error: otpResult.message || 'Invalid OTP' }, { status: 400 });
    }

    // 2. CALL RPC: redeem_coupon
    // This handles all atomic checks and locking
    const { data: result, error: rpcError } = await getSupabaseAdmin()
        .rpc('redeem_coupon', {
            p_phone: normalizedPhone,
            p_qr_token: qr_token,
            p_name: name || 'Anonymous'
        });

    if (rpcError) {
        console.error('RPC Error:', rpcError);
        return NextResponse.json({ error: 'Redemption failed (System Error)' }, { status: 500 });
    }

    // RPC returns a JSON object with success/error fields
    // Structure: { success: boolean, coupon?: string, value?: number, error?: string, code?: number }
    
    if (result.error) {
        return NextResponse.json({ error: result.error }, { status: result.code || 400 });
    }

    return NextResponse.json({ 
        success: true,
        coupon: result.coupon,
        value: result.value 
    });

  } catch (err) {
    console.error('Unexpected error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
