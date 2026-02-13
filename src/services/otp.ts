import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

// Corrected Env Var Name
const TWOFACTOR_API_KEY = process.env.TWO_FACTOR_API_KEY;

// Robust OTP Service for 2Factor (DLT Approved)

export const otpService = {
  
  // Helper for consistent normalization
  normalizePhone(phone: string): string {
    // 1. Remove all non-digits
    let normalized = phone.replace(/\D/g, ''); 
    // 2. Ensure 91 prefix if length is 10 (India specific assumption safe for this project)
    if (normalized.length === 10) {
        normalized = '91' + normalized;
    }
    return normalized;
  },

  async sendOTP(phone: string) {
    const normalizedPhone = this.normalizePhone(phone); // Strict normalization
    console.log(`[2Factor] Processing OTP request for ${normalizedPhone} (Original: ${phone})`);

    if (!TWOFACTOR_API_KEY) {
        console.error("Scanning OTP Flow: Missing TWOFACTOR_API_KEY");
        return { success: false, message: 'SMS Configuration Error' };
    }

    // 1. GENERATE OTP (6 Digits)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 mins

    // 2. THROTTLING CHECK (Rate Limit: 1 OTP per 60s)
    // We check against normalized phone
    const { data: recentSession } = await getSupabaseAdmin()
        .from('otp_sessions')
        .select('created_at')
        .eq('phone', normalizedPhone)
        .gt('created_at', new Date(Date.now() - 60 * 1000).toISOString()) // Last 60s
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (recentSession) {
        console.warn(`[OTP Throttled] Request for ${normalizedPhone} blocked (too soon)`);
        return { success: false, message: 'Please wait 60 seconds before requesting a new OTP.' };
    }

    // 3. RETRY WRAPPER for Upstream API
    const callProvider = async (retryCount = 0): Promise<any> => {
        try {
            // Using DLT OTP Endpoint (GET)
            // https://2factor.in/API/V1/{API_KEY}/SMS/{PHONE}/{OTP}/{TEMPLATE_NAME}
            
            // 2Factor expects just digits, usually with country code. normalizedPhone has 91 prefix.
            const cleanPhone = normalizedPhone; 
            const templateName = encodeURIComponent("AKUAFI COUPON OTP");

            // Use process.env directly to avoid any stale variable reference issues, though const above is fine.
            const url = `https://2factor.in/API/V1/${process.env.TWO_FACTOR_API_KEY}/SMS/${cleanPhone}/${otp}/${templateName}`;
            
            console.log("[2Factor] Calling URL:", url.replace(process.env.TWO_FACTOR_API_KEY!, "API_KEY_HIDDEN"));

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s Timeout

            const response = await fetch(url, { 
                method: "GET",
                signal: controller.signal 
            });
            clearTimeout(timeoutId);

            const data = await response.json();
            console.log("2FACTOR RESPONSE:", data);
            return data;

        } catch (e) {
            console.error(`[2Factor] Attempt ${retryCount + 1} failed:`, e);
            if (retryCount < 2) { // Max 3 attempts (0, 1, 2)
                await new Promise(r => setTimeout(r, 1000 * (retryCount + 1))); // Backoff 1s, 2s
                return callProvider(retryCount + 1);
            }
            throw e;
        }
    };

    try {
        // 4. CALL PROVIDER
        const data = await callProvider();

        // 2Factor GET OTP Status is usually "Success" or "Status":"Success"
        if (data.Status !== 'Success') {
             console.error('2Factor API Failed:', JSON.stringify(data));
             return { success: false, message: 'Failed to send OTP via SMS provider.' };
        }

        const sessionId = data.Details; 

        // 5. STORE SESSION
        const { error } = await getSupabaseAdmin()
            .from('otp_sessions')
            .insert({
              phone: normalizedPhone, // Store normalized
              session_id: sessionId || 'DLT-SESSION', 
              otp: otp, 
              expires_at: expiresAt,
              verified: false,
              attempts: 0
            });

        if (error) {
            console.error('DB Session Store Error:', error);
            // Limit failure impact if SMS sent
            return { success: false, message: 'System error: OTP sent but session storage failed.' };
        }

        return { 
            success: true, 
            message: 'OTP Sent', 
            session_id: null 
        };

    } catch (error) {
        console.error('Critical OTP Failure:', error);
        return { success: false, message: 'Service temporarily unavailable. Please try again later.' };
    }
  },

  async validateOTP(phone: string, otp: string) {
    const normalizedPhone = this.normalizePhone(phone);
    console.log(`[OTP Validate] Request for ${normalizedPhone} (Original: ${phone}) with OTP: ${otp}`);

    // 1. Retrieve the LATEST session for this phone, regardless of verified status
    //    This helps us differentiate between "Expired", "Already Used", and "Invalid"
    const { data: session, error } = await getSupabaseAdmin()
        .from('otp_sessions')
        .select('*')
        .eq('phone', normalizedPhone)
        .order('created_at', { ascending: false }) // Get NEWEST
        .limit(1)
        .single();

    if (error || !session) {
        console.log(`[OTP Validate] No session found for ${normalizedPhone}`);
        return { valid: false, message: 'No OTP found for this number' };
    }

    console.log(`[OTP Validate] Fetched Session: ID=${session.id}, OTP=${session.otp}, Exp=${session.expires_at}, Verified=${session.verified}, Attempts=${session.attempts}`);

    // 2. CHECK EXPIRED
    // Ensure strict UTC comparison
    const now = new Date();
    const expiresAt = new Date(session.expires_at);
    
    if (now > expiresAt) {
        console.warn(`[OTP Validate] Session expired. Now: ${now.toISOString()}, Exp: ${expiresAt.toISOString()}`);
        return { valid: false, message: 'OTP has expired. Please request a new one.' };
    }

    // 3. CHECK IF ALREADY USED
    if (session.verified) {
        console.warn(`[OTP Validate] Session already verified at ${session.verified_at}`);
        return { valid: false, message: 'This OTP has already been used.' };
    }

    // 4. CHECK ATTEMPTS
    if (session.attempts >= 3) {
         console.warn(`[OTP Validate] Too many attempts: ${session.attempts}`);
         return { valid: false, message: 'Too many failed attempts. Please request a new OTP.' };
    }

    // 5. CHECK OTP MATCH
    if (String(session.otp).trim() !== String(otp).trim()) {
        console.warn(`[OTP Validate] Mismatch. Input: ${otp}, Stored: ${session.otp}`);
        
        // Increment attempts
        await getSupabaseAdmin()
            .from('otp_sessions')
            .update({ attempts: session.attempts + 1 })
            .eq('id', session.id);
            
        return { valid: false, message: 'Invalid OTP' };
    }

    // 6. SUCCESS
    console.log(`[OTP Validate] Success! Marking session ${session.id} as verified.`);
    
    // Mark verified
    await getSupabaseAdmin()
        .from('otp_sessions')
        .update({ 
            verified: true, 
            verified_at: new Date().toISOString() 
        })
        .eq('id', session.id);
            
    return { valid: true, session_id: session.session_id };
  }
}
