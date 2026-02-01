import { NextResponse } from 'next/server';
import { otpService } from '@/services/otp';
import { smsService } from '@/services/sms';

export async function POST(request: Request) {
  try {
    const { phone } = await request.json();

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    // 0. Normalize Phone Number
    // If phone starts with "+", keep it. Else prefix "+91".
    const normalizedPhone = phone.startsWith('+') ? phone : `+91${phone}`;

    // 1. Generate OTP
    const otp = otpService.generateOTP();

    // 2. Store OTP
    await otpService.storeOTP(normalizedPhone, otp);

    // 3. Send SMS
    await smsService.sendSMS(normalizedPhone, `Your OTP is: ${otp}`);

    return NextResponse.json({ success: true, message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Error sending OTP:', error);
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 });
  }
}
