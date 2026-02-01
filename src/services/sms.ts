export const smsService = {
  async sendSMS(phone: string, message: string) {
    // START: MOCK SMS PROVIDER
    console.log(`[Slient Mock SMS] To: ${phone}, Message: ${message}`);
    // END: MOCK SMS PROVIDER
    
    // TODO: Plug in real provider here later (e.g. Twilio, MSG91)
    return { success: true };
  }
};
