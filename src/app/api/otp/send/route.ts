import { NextResponse } from 'next/server';
import { otpService } from '@/services/otp';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic'; // Ensure no static caching

export async function POST(request: Request) {
  try {
    console.log("SCAN OTP FLOW → VALIDATING REQUEST");
    
    // Parse Body Safely
    let body;
    try {
        body = await request.json();
    } catch (e) {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { phone, qr_token } = body;

    if (!phone || !qr_token) {
      return NextResponse.json({ error: 'Phone and QR Token are required' }, { status: 400 });
    }

    // 0. Normalize Phone Number
    const normalizedPhone = phone.startsWith('+') ? phone : `+91${phone}`;

    // 1. PRE-FLIGHT CHECKS (Must happen BEFORE sending OTP)
    
    // A. Check Bottle Status
    const { data: bottle, error: bottleError } = await getSupabaseAdmin()
        .from('bottles')
        .select(`
            id, 
            is_used, 
            campaign_id,
            campaigns (
                id,
                is_active,
                start_date,
                end_date
            )
        `)
        .eq('qr_token', qr_token)
        .single();

    if (bottleError || !bottle) {
        return NextResponse.json({ error: 'Invalid QR code' }, { status: 404 });
    }

    if (bottle.is_used) {
        return NextResponse.json({ error: 'Coupon redeemed from this QR' }, { status: 409 });
    }

    // B. Check Campaign Validity
    const campaign = Array.isArray(bottle.campaigns) ? bottle.campaigns[0] : bottle.campaigns;

    if (!campaign) {
        return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    if (!campaign.is_active) {
        return NextResponse.json({ error: 'Campaign is inactive' }, { status: 400 });
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
    console.error('Error sending OTP:', error);
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 });
  }
}
