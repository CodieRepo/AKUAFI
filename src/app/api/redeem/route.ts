import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { otpService } from '@/services/otp';

export async function POST(req: NextRequest) {
  try {
    const { phone, otp, qr_token, name } = await req.json();

    console.log("--- API REDEEM V6 (HARDENED PRODUCTION) ---");
    // NOTE: This route runs in the Node.js runtime environment.
    // The SUPABASE_SERVICE_ROLE_KEY is used here to perform backend-only admin tasks.
    // This key is NEVER exposed to the client.
    
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

    // 3. STEP 1: VERIFY OTP
    const otpResult = await otpService.validateOTP(normalizedPhone, otp);
    if (!otpResult.valid) {
        return NextResponse.json({ error: otpResult.message || 'Invalid OTP' }, { status: 400 });
    }

    // 4. STEP 2: FETCH BOTTLE
    //    Using .limit(1) and .maybeSingle() equivalent checks to avoid 0-row errors
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

    // Check if bottle is already redeemed
    const { data: existingBottleRedemption, error: checkError } = await supabaseAdmin
        .from('redemptions')
        .select('id')
        .eq('bottle_id', bottle.id)
        .limit(1);
    
    if (checkError) {
         console.error("Bottle Check Error:", checkError);
         return NextResponse.json({ error: 'Database Error' }, { status: 500 });
    }

    if (existingBottleRedemption && existingBottleRedemption.length > 0) {
        return NextResponse.json({ error: 'This QR code has already been redeemed.' }, { status: 400 });
    }

    // 5. STEP 3: UPSERT USER
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

    // 6. STEP 4: INSERT REDEMPTION
    const { error: redemptionError } = await supabaseAdmin
        .from('redemptions')
        .insert({
            user_id: userId,
            campaign_id: bottle.campaign_id,
            bottle_id: bottle.id,
            redeemed_at: new Date().toISOString()
        });

    if (redemptionError) {
        console.error("Redemption Insert Error:", redemptionError);
        
        // Handle Unique Constraint Violation (duplicate redemption for same campaign)
        if (redemptionError.code === '23505') {
             return NextResponse.json({ error: "Mobile already registered for this campaign" }, { status: 400 });
        }
        
        return NextResponse.json({ error: 'Redemption failed' }, { status: 500 });
    }

    // 7. STEP 5: SAFE COUPON GENERATION (Retry Loop)
    // Fetch campaign prefix
    const { data: campaign } = await supabaseAdmin
        .from('campaigns')
        .select('coupon_prefix')
        .eq('id', bottle.campaign_id)
        .single();
        
    const prefix = campaign?.coupon_prefix || 'OFFER';
    
    let couponCode = '';
    let inserted = false;
    let attempts = 0;
    const MAX_ATTEMPTS = 5;

    while (!inserted && attempts < MAX_ATTEMPTS) {
        attempts++;
        couponCode = `${prefix}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

        // FIX: Insert into 'coupon_code' logic and status 'claimed' logic
        const { error: couponError } = await supabaseAdmin.from('coupons').insert({
            coupon_code: couponCode,
            campaign_id: bottle.campaign_id,
            user_id: userId,
            status: 'claimed',
            discount_value: 10 // Mock or fetch actual value
        });

        if (!couponError) {
            inserted = true;
        } else {
            // If error is NOT uniqueness violation, abort
            if (couponError.code !== '23505') {
                console.error("Coupon Insert Error:", couponError);
                // We don't fail the whole request since redemption was recorded, 
                // but we should probably alert or handle.
                // For now, break and return error or partial success?
                // Returning error now is safer.
                return NextResponse.json({ error: "Coupon generation error" }, { status: 500 });
            }
            // If code '23505' (Duplicate), loop continues to retry
            console.warn(`Coupon collision for ${couponCode}, retrying... (${attempts}/${MAX_ATTEMPTS})`);
        }
    }

    if (!inserted) {
        console.error("Failed to generate unique coupon after max attempts");
        return NextResponse.json({ error: "System busy, please try again" }, { status: 500 });
    }

    return NextResponse.json({
        success: true,
        coupon_code: couponCode
    });

  } catch (err) {
    console.error('Unexpected error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
