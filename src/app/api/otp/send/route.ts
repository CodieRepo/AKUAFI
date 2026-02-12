import { NextResponse } from 'next/server';
import { otpService } from '@/services/otp';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic'; // Ensure no static caching

export async function POST(request: Request) {
  try {
    const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'UNKNOWN';
    console.log(`SCAN OTP FLOW → VALIDATING REQUEST [ENV: ${sbUrl.substring(0, 15)}...]`);
    
    // Parse Body Safely
    let body;
    try {
        body = await request.json();
    } catch (e) {
        console.error("JSON PARSE ERROR:", e);
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { phone, qr_token } = body;

    // Log Exact QR Token Received (Diagnostic)
    console.log("QR TOKEN RECEIVED:", `"${qr_token}"`);

    if (!phone || !qr_token) {
      console.warn("MISSING PARAMS: phone or qr_token");
      return NextResponse.json({ error: 'Phone and QR Token are required' }, { status: 400 });
    }

    // Defensive Normalization
    const cleanQrToken = qr_token.trim();
    if (cleanQrToken !== qr_token) {
        console.warn("QR TOKEN TRIMMED: Whitespace removed.");
    }

    // 0. Normalize Phone Number
    const normalizedPhone = phone.startsWith('+') ? phone : `+91${phone}`;

    // 1. PRE-FLIGHT CHECKS (Must happen BEFORE sending OTP)
    
    // A. Check Bottle Status
    console.log(`Querying bottles for token: "${cleanQrToken}"`);
    
    const { data: bottle, error: bottleError } = await getSupabaseAdmin()
        .from('bottles')
        .select(`
            id, 
            is_used, 
            campaign_id,
            campaigns (
                id,
                status,
                start_date,
                end_date
            )
        `)
        .eq('qr_token', cleanQrToken)
        .single();

    if (bottleError) {
        console.error("DB QUERY ERROR (bottles):", bottleError);
    }

    if (!bottle) {
        console.warn(`BOTTLE NOT FOUND for token: "${cleanQrToken}"`);
        return NextResponse.json({ error: 'Invalid QR code' }, { status: 404 });
    }

    console.log("BOTTLE FOUND:", bottle.id, "USED:", bottle.is_used);

    if (bottle.is_used) {
        console.warn("BOTTLE ALREADY USED");
        return NextResponse.json({ error: 'Coupon redeemed from this QR' }, { status: 409 });
    }

    // B. Check Campaign Validity
    const campaign = Array.isArray(bottle.campaigns) ? bottle.campaigns[0] : bottle.campaigns;

    if (!campaign) {
        console.error("CAMPAIGN NOT FOUND or LINK BROKEN for bottle:", bottle.id);
        return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Updated Logic: Check status instead of is_active
    if (campaign.status !== 'active') {
        return NextResponse.json(
            { error: 'Campaign is inactive' },
            { status: 400 }
        );
    }

    const now = new Date();
    if (now < new Date(campaign.start_date)) {
        return NextResponse.json({ error: 'Campaign has not started' }, { status: 400 });
    }
    if (now > new Date(campaign.end_date)) {
        return NextResponse.json({ error: 'Campaign has expired' }, { status: 400 });
    }

    // C. Check User Eligibility (Phone-based Lock)
    const { data: user } = await getSupabaseAdmin()
        .from('users')
        .select('id')
        .eq('phone', normalizedPhone)
        .maybeSingle();

    if (user) {
        // Check coupons
        const { data: existingCoupon } = await getSupabaseAdmin()
            .from('coupons')
            .select('id')
            .eq('user_id', user.id)
            .eq('campaign_id', campaign.id)
            .maybeSingle();
            
        if (existingCoupon) {
            console.warn(`MOBILE ALREADY REGISTERED: ${normalizedPhone} for campaign ${campaign.id}`);
            return NextResponse.json({ error: 'Mobile already registered' }, { status: 409 });
        }
    }

    // 2. SEND OTP (If all checks pass)
    const result = await otpService.sendOTP(normalizedPhone);

    if (result.success) {
         return NextResponse.json({ 
             success: true, 
             message: result.message,
             session_id: result.session_id,
             sms_sent: true 
         });
    } else {
        return NextResponse.json({ error: result.message || 'Failed to send OTP' }, { status: 500 });
    }

  } catch (error) {
    console.error('CRITICAL ERROR sending OTP:', error);
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 });
  }
}
