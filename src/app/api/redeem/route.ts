import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { otpService } from '@/services/otp';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { phone, otp, qr_token, name, address } = await req.json();

    console.log("--- API REDEEM V8 (ADDRESS SUPPORT) ---");
    
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

        // If error is UNIQUE constraint violation (23505) OR custom code from RPC
        // The RPC now returns { success: false, error: '...', code: '...' } in the data, 
        // BUT supabase.rpc might return it as 'data' or 'error' depending on how it's called.
        // Wait, if RPC returns JSON, 'error' is null, and 'data' contains the success/error flag.
        // Let's check how the previous code was expecting it.
        // The previous code expected `const { error } = await supabaseAdmin.rpc(...)`
        // If the function returns a table or json, `data` likely holds the return value.
        // However, if the function RAISES an exception, `error` will be populated.
        // My new RPC implementation uses `RETURN json_build_object...` for "soft errors" inside EXCEPTION block? 
        // NO, the RPC catches exception and RETURNS a JSON object with success:false.
        // So `error` from supabase client will be NULL, but `data` will have success:false.
        
        // Let's ADJUST the call to get data.
        
    // Log the payload for debugging
    const rpcPayload = {
        p_user_id: userId,
        p_campaign_id: bottle.campaign_id,
        p_bottle_id: bottle.id,
        p_client_id: campaign.client_id,
        p_phone: normalizedPhone,
        p_coupon_code: couponCode,
        p_discount: discountValue,
        p_address: address || null
    };

    console.log("[Redeem API] RPC Call Payload:", JSON.stringify(rpcPayload));

    const { data: rpcResponse, error: transportError } = await supabaseAdmin.rpc('redeem_coupon_atomic', rpcPayload);

    if (transportError) {
         console.error("RPC Transport Error:", transportError);
         break;
    }

    console.log("[Redeem API] RPC Response:", JSON.stringify(rpcResponse));

    if (rpcResponse && !rpcResponse.success) {
         // Logic Error from inside RPC (Duplicate, Collision, etc)
         rpcError = { message: rpcResponse.error, code: rpcResponse.code };
         
         if (rpcResponse.code === 'COUPON_COLLISION') {
             console.warn(`[Redeem API] Coupon collision for ${couponCode}, retrying...`);
             continue; // Retry loop
         } else {
             // Non-retriable error (Already Redeemed, etc)
             break; 
         }
    }
    
    // Success
    rpcError = null;
    break; 

    } // End While

    if (rpcError) {
        console.error("Redemption Failed:", rpcError);
        // Map codes to user-friendly status
        const status = (rpcError.code === 'ALREADY_REDEEMED' || rpcError.code === 'USER_ALREADY_REDEEMED') ? 400 : 500;
        return NextResponse.json({ error: rpcError.message, code: rpcError.code }, { status });
    }

    if (attempts >= MAX_ATTEMPTS) {
         console.error("Redemption Failed: Max attempts reached for coupon generation");
         return NextResponse.json({ error: "System busy, please try again (Max Attempts)" }, { status: 500 });
    }

    console.log(`[Redeem API] Atomic redeem success for coupon: ${couponCode}`);

    return NextResponse.json({
        success: true,
        coupon_code: couponCode
    });

  } catch (error: any) {
    console.error("REDEEM ERROR FULL:", error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
