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
