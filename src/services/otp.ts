import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const otpService = {
  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  },

  async storeOTP(phone: string, otp: string) {
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes
    
    // Optional: Invalidate previous unverified OTPs to keep table clean, 
    // but not strictly required if we always select latest.
    
    const { error } = await supabaseAdmin
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

  async validateOTP(phone: string, otp: string) {
     // Fetch latest unverified OTP that is not expired
     const { data, error } = await supabaseAdmin
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
     const { data: updatedData, error: updateError } = await supabaseAdmin
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
