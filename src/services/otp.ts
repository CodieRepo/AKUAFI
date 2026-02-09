import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

const TWOFACTOR_API_KEY = process.env.TWOFACTOR_API_KEY;

export const otpService = {
  // Robust OTP Service for 2Factor (Autogen)
  
  async sendOTP(phone: string) {
    console.log(`[2Factor] Processing OTP request for ${phone}`);

    if (!TWOFACTOR_API_KEY) {
        console.error("Scanning OTP Flow: Missing TWOFACTOR_API_KEY");
        return { success: false, message: 'SMS Configuration Error' };
    }

    // 1. THROTTLING CHECK (Rate Limit: 1 OTP per 60s)
    const { data: recentSession } = await getSupabaseAdmin()
        .from('otp_sessions')
        .select('created_at')
        .eq('phone', phone)
        .gt('created_at', new Date(Date.now() - 60 * 1000).toISOString()) // Last 60s
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (recentSession) {
        console.warn(`[OTP Throttled] Request for ${phone} blocked (too soon)`);
        return { success: false, message: 'Please wait 60 seconds before requesting a new OTP.' };
    }

    // 2. RETRY WRAPPER for Upstream API
    const callProvider = async (retryCount = 0): Promise<any> => {
        try {
            // Using AUTOGEN endpoint
            // Template Name should ideally be passed if you have a specific DLT template
            // const url = `https://2factor.in/API/V1/${TWOFACTOR_API_KEY}/SMS/${phone}/AUTOGEN/TemplateName`;
            const url = `https://2factor.in/API/V1/${TWOFACTOR_API_KEY}/SMS/${phone}/AUTOGEN`;
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s Timeout

            const response = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);

            return await response.json();
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
        // 3. CALL PROVIDER
        const data = await callProvider();
        console.log("2FACTOR AUTOGEN RESPONSE:", data);

        if (data.Status !== 'Success') {
             console.error('2Factor API Failed:', data);
             // Handle specific 2Factor errors if needed
             return { success: false, message: 'Failed to send OTP via SMS provider.' };
        }

        const sessionId = data.Details;
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 mins

        // 4. DB INSERT (Robust)
        // Store session. 'otp' column MUST be nullable in DB as we don't have it.
        const { error } = await getSupabaseAdmin()
            .from('otp_sessions')
            .insert({
              phone,
              session_id: sessionId,
              expires_at: expiresAt,
              verified: false,
              attempts: 0
            });

        if (error) {
            console.error('DB Session Store Error:', error);
            return { success: false, message: 'System error: OTP sent but session storage failed.' };
        }

        return { 
            success: true, 
            message: 'OTP sent successfully', 
            session_id: sessionId 
        };

    } catch (error) {
        console.error('Critical OTP Failure:', error);
        return { success: false, message: 'Service temporarily unavailable. Please try again later.' };
    }
  },

  async validateOTP(phone: string, otp: string) {
    // 1. Retrieve the latest active session for this phone
    const { data: session, error } = await getSupabaseAdmin()
        .from('otp_sessions')
        .select('*')
        .eq('phone', phone)
        .eq('verified', false)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (error || !session) {
        console.log("No active OTP session found for", phone);
        return { valid: false, message: 'OTP expired or session invalid' };
    }

    // 2. Check Attempts
    if (session.attempts >= 3) {
        return { valid: false, message: 'Too many failed attempts. Please request a new OTP.' };
    }

    // 3. STRICT 2FACTOR VERIFY
    let isValid = false;
    
    if (!TWOFACTOR_API_KEY) {
        return { valid: false, message: 'Server configuration error (Missing API Key)' };
    }

    try {
       // https://2factor.in/API/V1/{api_key}/SMS/VERIFY/{session_id}/{otp_input}
       const verifyUrl = `https://2factor.in/API/V1/${TWOFACTOR_API_KEY}/SMS/VERIFY/${session.session_id}/${otp}`;
       const response = await fetch(verifyUrl);
       const data = await response.json();

       console.log("2FACTOR VERIFY RESPONSE:", data);

       if (data.Status === 'Success') {
           isValid = true;
       } else {
           isValid = false;
           // If 2Factor says "OTP Mismatch", it's invalid
           // If "Session Expired", it's invalid
       }
    } catch (err) {
       console.error('2Factor Verify Exception:', err);
       return { valid: false, message: 'Error verifying OTP with provider' };
    }

    // 4. Update Session Response
    if (isValid) {
        // Mark verified
        await getSupabaseAdmin()
            .from('otp_sessions')
            .update({ 
                verified: true, 
                verified_at: new Date().toISOString() 
            })
            .eq('id', session.id);
            
        return { valid: true, session_id: session.session_id };
    } else {
        // Increment attempts
        await getSupabaseAdmin()
            .from('otp_sessions')
            .update({ attempts: session.attempts + 1 })
            .eq('id', session.id);
            
        return { valid: false, message: 'Invalid OTP' };
    }
  }
}
