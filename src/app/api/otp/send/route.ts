import { NextResponse } from 'next/server';
import { otpService } from '@/services/otp';

export async function POST(request: Request) {
  try {
    const { phone } = await request.json();

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    // 0. Normalize Phone Number
    // If phone starts with "+", keep it. Else prefix "+91".
    const normalizedPhone = phone.startsWith('+') ? phone : `+91${phone}`;

    // 1-3. Generate, Store, Send OTP (Orchestrated by Service)
    const result = await otpService.sendOTP(normalizedPhone);

    if (result.success) {
         return NextResponse.json({ 
             success: true, 
             message: result.message,
             session_id: result.session_id,
             // sms_sent is no longer returned explicitly by new service, but success implies it was initiated
             sms_sent: true 
         });
    } else {
        return NextResponse.json({ error: result.message || 'Failed to send OTP' }, { status: 500 });
    }

  } catch (error) {
    console.error('Error sending OTP:', error);
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 });
  }
}
