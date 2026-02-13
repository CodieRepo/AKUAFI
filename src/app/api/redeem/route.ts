import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { otpService } from '@/services/otp';

export async function POST(req: NextRequest) {
  try {
    const { phone, otp, qr_token, name } = await req.json();

    console.log("--- API REDEEM V4 (FINAL ATOMIC) ---");
    
    // STEP 1: Log Supabase Environment
    console.log("SUPABASE URL BEING USED:", process.env.NEXT_PUBLIC_SUPABASE_URL);

    if (!phone || !otp || !qr_token) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Token Normalization
    const normalizedToken = qr_token ? qr_token.trim() : "";
    
    // Phone Normalization (must match OTP Service)
    const normalizePhone = (p: string) => {
        let n = p.replace(/\D/g, '');
        if (n.length === 10) n = '91' + n;
        return n;
    };
    const normalizedPhone = normalizePhone(phone);

    console.log(`[Redeem API] Received Phone: ${phone}, Normalized: ${normalizedPhone}, Token: ${normalizedToken}`);

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

    // 1. VERIFY OTP
    const otpResult = await otpService.validateOTP(normalizedPhone, otp);
    
    if (!otpResult.valid) {
        return NextResponse.json({ error: otpResult.message || 'Invalid OTP' }, { status: 400 });
    }

    // 2. CALL FINAL RPC: redeem_coupon
    // Atomically handles: existence, status check, campaign logic, coupon generation, insertion, and update
    const { data, error: rpcError } = await supabaseAdmin
        .rpc('redeem_coupon', {
            p_qr_token: normalizedToken,
            p_phone: normalizedPhone,
            p_name: name || 'Anonymous'
        });

    if (rpcError) {
        console.error("Redeem RPC Error:", rpcError);
        // Map common RPC errors to user-friendly messages if possible, or pass through
        return NextResponse.json({ error: rpcError.message || 'Redemption failed' }, { status: 400 });
    }

    // Helper to safely extract coupon code from various potential RPC return shapes
    // RPC returns TABLE (coupon_code TEXT) -> typically an array of objects
    const couponCode = data?.[0]?.coupon_code || (data as any)?.coupon_code;

    if (!couponCode) {
        console.error("RPC Success but No Coupon Code returned:", data);
        return NextResponse.json(
            { error: "Coupon generation failed" },
            { status: 500 }
        );
    }

    console.log(`Redemption Success: ${normalizedPhone} got ${couponCode}`);

    return NextResponse.json({ 
        success: true,
        coupon_code: couponCode 
    });

  } catch (err) {
    console.error('Unexpected error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
