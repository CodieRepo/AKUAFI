import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

const TWOFACTOR_API_KEY = process.env.TWOFACTOR_API_KEY;

export const otpService = {
  // We no longer generate OTP locally for production
  
  async sendOTP(phone: string) {
    console.log("HARD TEST: sendOTP called with", phone);
    // Temporary hard isolation test
    return {
      success: true,
      message: "OTP mock success",
      session_id: "debug-session-id"
    };
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
        return { valid: false, message: 'OTP expired or invalid session' };
    }

    // 2. Check Attempts to prevent brute force (e.g. max 3 attempts)
    if (session.attempts >= 3) {
        return { valid: false, message: 'Too many failed attempts. Please request a new OTP.' };
    }

    let isValid = false;
    const isProduction = process.env.VERCEL_ENV === 'production';

    // 3. Verify Logic
    if (isProduction || (TWOFACTOR_API_KEY && !session.otp)) { // Real API Verify
       try {
           // https://2factor.in/API/V1/{api_key}/SMS/VERIFY/{session_id}/{otp_input}
           const verifyUrl = `https://2factor.in/API/V1/${TWOFACTOR_API_KEY}/SMS/VERIFY/${session.session_id}/${otp}`;
           const response = await fetch(verifyUrl);
           const data = await response.json();

           if (data.Status === 'Success') {
               isValid = true;
           } else {
               isValid = false;
           }
       } catch (err) {
           console.error('2Factor Verify Error:', err);
           return { valid: false, message: 'Error verifying OTP with provider' };
       }
    } else {
        // Dev Fallback
        isValid = otp === '123456' || otp === session.otp;
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
