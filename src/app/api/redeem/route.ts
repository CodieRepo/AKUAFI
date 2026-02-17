import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { otpService } from '@/services/otp';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { phone, otp, qr_token, name } = await req.json();

    console.log("--- API REDEEM V7 (HARDENED PRODUCTION) ---");
    
    if (!phone || !otp || !qr_token) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Normalize Inputs
    const normalizedToken = qr_token.trim();
    const normalizePhone = (p: string) => {
        let n = p.replace(/\D/g, '');
        if (n.length === 10) n = '91' + n;
        return n;
    };
    const normalizedPhone = normalizePhone(phone);

    console.log(`[Redeem API] Phone: ${normalizedPhone}, Token: ${normalizedToken}`);

    // 2. Initialize Supabase Admin Client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error("CRITICAL: Missing Supabase Admin Keys");
        return NextResponse.json({ error: 'Server Configuration Error' }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // -------------------------------------------------------
    // STEP 1: VERIFY OTP
    // -------------------------------------------------------
    const otpResult = await otpService.validateOTP(normalizedPhone, otp);
    if (!otpResult.valid) {
        return NextResponse.json({ error: otpResult.message || 'Invalid OTP' }, { status: 400 });
    }

    // -------------------------------------------------------
    // STEP 2: FETCH BOTTLE
    // -------------------------------------------------------
    // Use .limit(1) as requested (NOT .single())
    const { data: bottles, error: bottleError } = await supabaseAdmin
        .from('bottles')
        .select('id, campaign_id')
        .eq('qr_token', normalizedToken)
        .limit(1);

    if (bottleError) {
        console.error("Bottle Lookup Error:", bottleError);
        return NextResponse.json({ error: 'Database Error' }, { status: 500 });
    }

    if (!bottles || bottles.length === 0) {
        return NextResponse.json({ error: 'Invalid QR Code' }, { status: 404 });
    }
    
    const bottle = bottles[0];

    // -------------------------------------------------------
    // STEP 3: HARD CHECK - QR ALREADY REDEEMED (Redemptions Table)
    // -------------------------------------------------------
    const { data: existingBottleRedemptions, error: qrCheckError } = await supabaseAdmin
        .from('redemptions')
        .select('id')
        .eq('bottle_id', bottle.id)
        .limit(1);

    if (qrCheckError) {
        console.error("QR Check Error:", qrCheckError);
        return NextResponse.json({ error: 'Database Error' }, { status: 500 });
    }

    if (existingBottleRedemptions && existingBottleRedemptions.length > 0) {
        return NextResponse.json({ error: "Coupon redeemed from this QR" }, { status: 400 });
    }

    // -------------------------------------------------------
    // STEP 4: UPSERT USER
    // -------------------------------------------------------
    const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .upsert(
            { phone: normalizedPhone, name: name || 'Anonymous' },
            { onConflict: 'phone' }
        )
        .select('id')
        .single();

    if (userError || !userData) {
        console.error("User Upsert Failed:", userError);
        return NextResponse.json({ error: 'Failed to register user' }, { status: 500 });
    }
    const userId = userData.id;

    // -------------------------------------------------------
    // STEP 5: HARD CHECK - SAME USER IN SAME CAMPAIGN
    // -------------------------------------------------------
    const { data: existingUserRedemptions, error: userCheckError } = await supabaseAdmin
        .from('redemptions')
        .select('id')
        .eq('user_id', userId)
        .eq('campaign_id', bottle.campaign_id)
        .limit(1);

    if (userCheckError) {
        console.error("User Campaign Check Error:", userCheckError);
        return NextResponse.json({ error: 'Database Error' }, { status: 500 });
    }

    if (existingUserRedemptions && existingUserRedemptions.length > 0) {
        return NextResponse.json({ error: "Mobile already registered for this campaign" }, { status: 400 });
    }

    // -------------------------------------------------------
    // STEP 6: ATOMIC REDEMPTION & COUPON GENERATION (RPC)
    // -------------------------------------------------------
    
    // Fetch Campaign Details (client_id & rules)
    const { data: campaign, error: campaignError } = await supabaseAdmin
        .from('campaigns')
        .select('id, client_id, coupon_prefix, coupon_min_value')
        .eq('id', bottle.campaign_id)
        .single();

    if (campaignError || !campaign || !campaign.client_id) {
        console.error("Campaign Fetch Error or Missing Client ID:", campaignError);
        throw new Error("Campaign missing client_id. Cannot generate coupon.");
    }
        
    const prefix = campaign.coupon_prefix || 'OFFER';
    const discountValue = campaign.coupon_min_value || 0;
    
    // Generate Coupon Code inside a Loop for Collision Safety
    const MAX_ATTEMPTS = 5;
    let attempts = 0;
    let couponCode = '';
    let rpcError = null;

    while (attempts < MAX_ATTEMPTS) {
        attempts++;
        couponCode = `${prefix}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

        // Execute Atomic RPC
        const { error } = await supabaseAdmin.rpc('redeem_coupon_atomic', {
            p_user_id: userId,
            p_campaign_id: bottle.campaign_id,
            p_bottle_id: bottle.id,
            p_client_id: campaign.client_id,
            p_phone: normalizedPhone,
            p_coupon_code: couponCode,
            p_discount: discountValue
        });

        if (!error) {
            rpcError = null;
            break; // Success!
        }

        rpcError = error;

        // If error is UNIQUE constraint violation (23505), retry.
        // Otherwise, break and return 500.
        if (error.code === '23505') {
            console.warn(`[Redeem API] Coupon collision for ${couponCode}, retrying (${attempts}/${MAX_ATTEMPTS})...`);
        } else {
            console.error("Atomic Redemption RPC Error (Non-Retriable):", error);
            break;
        }
    }

    if (rpcError) {
        console.error("Failed to redeem token after max attempts or critical error:", rpcError);
        return NextResponse.json({ error: "System busy, please try again" }, { status: 500 });
    }

    console.log(`[Redeem API] Atomic redeem success for coupon: ${couponCode}`);

    return NextResponse.json({
        success: true,
        coupon_code: couponCode
    });

  } catch (err) {
    console.error('Unexpected error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
