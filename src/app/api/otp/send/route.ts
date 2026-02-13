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
    // Handled inside otpService for consistency, but good to be explicit for logs if needed.
    // We pass raw phone to service, service normalizes it.
    // But for the RPC check below, we should also normalize consistent with the service.
    
    // Helper to match service logic:
    const normalizePhone = (p: string) => {
        let n = p.replace(/\D/g, '');
        if (n.length === 10) n = '91' + n;
        return n;
    };

    const normalizedPhone = normalizePhone(phone);

    // 1. PRE-FLIGHT CHECKS (Must happen BEFORE sending OTP)
    // Validate via RPC (Atomic Time & Logic Check)
    // This handles: Bottle Check, Campaign Status, Timezone-Safe Dates, User Eligibility
    
    console.log(`Validating via RPC for token: "${cleanQrToken}"`);

    const { data: validation, error: rpcError } = await getSupabaseAdmin()
        .rpc('validate_bottle_for_otp', { 
            p_qr_token: cleanQrToken, 
            p_phone: normalizedPhone 
        });

    if (rpcError) {
        console.error("[RPC Error] Validation failed:", rpcError);
        return NextResponse.json({ error: 'System error during validation' }, { status: 500 });
    }
    
    // Log for debugging
    console.log("[Validation RPC Result]", validation);

    if (validation && !validation.valid) {
         return NextResponse.json({ error: validation.error }, { status: validation.code || 400 });
    }

    // If valid, proceed to send OTP
    // Note: RPC passed all checks.
    
    // 2. SEND OTP
    const result = await otpService.sendOTP(normalizedPhone);

    if (result.success) {
         return NextResponse.json({ 
             success: true, 
             message: result.message,
             session_id: result.session_id, // Note: This might be null for DLT, which is fine
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
