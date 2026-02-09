import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

const TWOFACTOR_API_KEY = process.env.TWOFACTOR_API_KEY;

export const otpService = {
  // We no longer generate OTP locally for production
  
  async sendOTP(phone: string) {
    console.log(`[2Factor] Sending OTP to ${phone} via AUTOGEN`);

    if (!TWOFACTOR_API_KEY) {
        console.error("Scanning OTP Flow: Missing TWOFACTOR_API_KEY");
        return { success: false, message: 'SMS Configuration Error' };
    }

    try {
        // 1. Call 2Factor AUTOGEN API
        const url = `https://2factor.in/API/V1/${TWOFACTOR_API_KEY}/SMS/${phone}/AUTOGEN`;
        const response = await fetch(url);
        const data = await response.json();

        console.log("2FACTOR AUTOGEN RESPONSE:", data);

        if (data.Status !== 'Success') {
             console.error('2Factor API Failed:', data);
             return { success: false, message: 'Failed to send OTP' };
        }

        const sessionId = data.Details;
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 mins

        // 2. Store Session in DB (Required for Validation lookup)
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
            return { success: false, message: 'System error initializing login' };
        }

        return { 
            success: true, 
            message: 'OTP sent successfully', 
            session_id: sessionId 
        };

    } catch (error) {
        console.error('2Factor Network Error:', error);
        return { success: false, message: 'Network error sending OTP' };
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
        // Critical Configuration Error
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
