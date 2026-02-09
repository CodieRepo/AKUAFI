import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

const TWOFACTOR_API_KEY = process.env.TWOFACTOR_API_KEY;

export const otpService = {
  // We no longer generate OTP locally for production
  
  async sendOTP(phone: string) {
    const isProduction = process.env.VERCEL_ENV === 'production';
    
    // 1. Check if we have a valid API Key
    if (!TWOFACTOR_API_KEY) {
      console.error('Missing TWOFACTOR_API_KEY');
      if (isProduction) {
        return { success: false, message: 'SMS service not configured' };
      }
    }

    // 2. Production Flow (or if Key exists and we want to test)
    if (isProduction || TWOFACTOR_API_KEY) {
      try {
        // 2Factor AUTOGEN API
        // https://2factor.in/API/V1/{api_key}/SMS/{phone_number}/AUTOGEN
        const response = await fetch(`https://2factor.in/API/V1/${TWOFACTOR_API_KEY}/SMS/${phone}/AUTOGEN`);
        const data = await response.json();

        if (data.Status === 'Success') {
          const sessionId = data.Details;
          const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes expiry

          // Store session_id in DB
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
            console.error('Error storing OTP session:', error);
            // We successfully sent OTP but failed to store session. 
            // The user will receive OTP but verify will fail if we rely on DB session_id.
            // However, 2Factor Verify API needs session_id. 
            // We can return success but log the error. Ideally, this should not happen.
            return { success: false, message: 'System error initializing login' };
          }

          return { success: true, message: 'OTP sent successfully', session_id: sessionId };
        } else {
          console.error('2Factor API Error:', data);
          return { success: false, message: 'Failed to send OTP via SMS/Call' };
        }
      } catch (error) {
        console.error('2Factor Network Error:', error);
        return { success: false, message: 'Network error sending OTP' };
      }
    }

    // 3. Fallback / Dev Flow (No API Key or Local Dev)
    // We simulate sending an OTP.
    console.log(`[Dev] Simulating OTP for ${phone}. Use '123456'.`);
    
    // We still need a "session" for the Verify step consistency
    const mockSessionId = `mock-session-${Date.now()}`;
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await getSupabaseAdmin()
      .from('otp_sessions')
      .insert({
        phone,
        session_id: mockSessionId,
        expires_at: expiresAt,
        verified: false, 
        otp: '123456', // Storing for local verify check
        attempts: 0
      });

    return { 
        success: true, 
        message: 'OTP sent (Dev: 123456)', 
        session_id: mockSessionId,
        is_dev: true 
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
