import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { otpService } from '@/services/otp';

export async function POST(req: NextRequest) {
  try {
    const { phone, otp, qr_token, name } = await req.json();

    console.log("--- API REDEEM V3 (DEBUG MODE) ---");
    
    // STEP 1: Log Supabase Environment
    console.log("SUPABASE URL BEING USED:", process.env.NEXT_PUBLIC_SUPABASE_URL);

    if (!phone || !otp || !qr_token) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // STEP 2: Token Normalization & Logging
    console.log("QR TOKEN RECEIVED RAW:", qr_token);
    console.log("TOKEN LENGTH:", qr_token ? qr_token.length : 0);

    const normalizedToken = qr_token ? qr_token.trim() : "";
    
    console.log("QR TOKEN NORMALIZED:", normalizedToken);
    console.log("NORMALIZED LENGTH:", normalizedToken.length);

    // 0. Normalize Phone
    const normalizedPhone = phone.startsWith('+') ? phone : `+91${phone}`;

    // --- INITIALIZE SERVICE ROLE CLIENT ---
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error("CRITICAL: Missing Supabase Admin Keys");
        return NextResponse.json({ error: 'Server Configuration Error' }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // STEP 3: Remove .single() and Debug Query
    // We use authorized client but select ANY match to debug
    // FIX: Removed 'status' column as it does not exist in the schema
    const { data: rawBottleData, error: bottleError } = await supabaseAdmin
        .from('bottles')
        .select('id, campaign_id, qr_token')
        .eq('qr_token', normalizedToken);

    console.log("Raw Bottle Query Result:", rawBottleData);
    console.log("Bottle Query Error:", bottleError);

    // Handle results for flow continuity
    if (bottleError) {
        console.error("Bottle Query Error:", bottleError);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }

    if (!rawBottleData || rawBottleData.length === 0) {
        console.error("Bottle Lookup Failed: Token not found");
        return NextResponse.json({ error: 'Invalid QR Token' }, { status: 400 });
    }

    // Take the first match if multiple (should be unique though)
    const bottleData = rawBottleData[0];

    // Status check removed as column does not exist on bottles table.
    // The RPC 'redeem_coupon' handles the used status check atomically.


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
    const { data: result, error: rpcError } = await supabaseAdmin
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
