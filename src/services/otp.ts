import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

const TWOFACTOR_API_KEY = process.env.TWOFACTOR_API_KEY;
// const TWOFACTOR_SENDER_ID = process.env.TWOFACTOR_SENDER_ID; // Not used in this implementation (using Template ID instead)
const TWOFACTOR_TEMPLATE_ID = process.env.TWOFACTOR_TEMPLATE_ID;

export const otpService = {
  generateOTP() {
    // Determine environment
    const isProduction = process.env.VERCEL_ENV === 'production';
    
    if (isProduction) {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }
    
    // Non-production (local/preview): Return static OTP
    return "1234";
  },

  async storeOTP(phone: string, otp: string) {
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes
    
    // Optional: Invalidate previous unverified OTPs to keep table clean, 
    // but not strictly required if we always select latest.
    
    const { error } = await getSupabaseAdmin()
      .from('otp_sessions')
      .insert({
        phone,
        otp,
        expires_at: expiresAt,
        verified: false
      });
      
    if (error) {
        console.error('Error storing OTP:', error);
        throw new Error('Failed to store OTP');
    }
    
    return { otp, expiresAt };
  },

  async sendOTP(phone: string) {
      const otp = this.generateOTP();
      const { expiresAt } = await this.storeOTP(phone, otp);
      
      const isProduction = process.env.VERCEL_ENV === 'production';
      
      if (!isProduction) {
          console.log(`[Non-Production] OTP for ${phone}: ${otp}`);
          // Return simulated success
          return { success: true, sms_sent: true, message: 'OTP sent (simulated)' };
      }
      
      // Production Logic
      if (!TWOFACTOR_TEMPLATE_ID) {
          console.warn(`[Production] Missing TWOFACTOR_TEMPLATE_ID. OTP generated but SMS NOT sent.`);
          // Graceful degradation: Return success: true (to not block user flow) but sms_sent: false
          return { success: true, sms_sent: false, message: 'SMS configuration pending' };
      }
      
      // Call 2Factor API
      try {
          const url = `https://2factor.in/API/V1/${TWOFACTOR_API_KEY}/SMS/${phone}/${otp}/${TWOFACTOR_TEMPLATE_ID}`;
          const response = await fetch(url);
          const data = await response.json();
          
          if (data.Status === 'Success') {
              return { success: true, sms_sent: true, message: 'OTP sent successfully' };
          } else {
              console.error('2Factor API Error:', data);
              return { success: false, sms_sent: false, message: 'Failed to send SMS' };
          }
      } catch (error) {
          console.error('2Factor API Network Error:', error);
          return { success: false, sms_sent: false, message: 'Network error sending SMS' };
      }
  },

  async validateOTP(phone: string, otp: string) {
     // Fetch latest unverified OTP that is not expired
     const { data, error } = await getSupabaseAdmin()
        .from('otp_sessions')
        .select('*')
        .eq('phone', phone)
        .eq('verified', false)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

     if (error || !data) {
         return { valid: false, message: 'Invalid or expired OTP' };
     }

     if (data.otp !== otp) {
         return { valid: false, message: 'Invalid OTP' };
     }

     // Mark OTP as verified atomically. 
     // We enforce 'verified' is still false at the moment of update.
     const { data: updatedData, error: updateError } = await getSupabaseAdmin()
        .from('otp_sessions')
        .update({ verified: true })
        .eq('id', data.id)
        .eq('verified', false) // Atomic check
        .select();

     if (updateError) {
        console.error('Error updating OTP status:', updateError);
        return { valid: false, message: 'System error verifying OTP' };
     }

     // If no rows were updated, it means it was already verified in a race condition
     if (!updatedData || updatedData.length === 0) {
         return { valid: false, message: 'OTP already verified' };
     }
        
     return { valid: true };
  }
}
