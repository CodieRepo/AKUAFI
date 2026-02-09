import { NextResponse } from 'next/server';
import { otpService } from '@/services/otp';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request: Request) {
  try {
    const { phone, otp, qr_token } = await request.json();

    if (!phone || !otp) {
      return NextResponse.json({ error: 'Phone and OTP are required' }, { status: 400 });
    }

    if (!qr_token) {
        return NextResponse.json({ error: 'QR Token is required' }, { status: 400 });
    }

    // 0. Normalize Phone Number
    const normalizedPhone = phone.startsWith('+') ? phone : `+91${phone}`;

    // 1. Validate OTP
    const validation = await otpService.validateOTP(normalizedPhone, otp);
    
    if (!validation.valid) {
      return NextResponse.json({ error: validation.message }, { status: 400 });
    }

    // 2. Fetch Bottle Details
    // Schema: bottles (id, campaign_id, qr_token, status)
    const { data: bottle, error: bottleError } = await getSupabaseAdmin()
        .from('bottles')
        .select('id, campaign_id, status, qr_token')
        .eq('qr_token', qr_token) 
        .single();
        
    if (bottleError || !bottle) {
        console.error('Bottle fetch error:', bottleError);
        return NextResponse.json({ error: 'Invalid QR Code' }, { status: 400 });
    }
    
    // Check if already used
    // Schema: status is text ('unused' | 'used')
    if (bottle.status === 'used') {
        return NextResponse.json({ error: 'QR Code already used' }, { status: 400 });
    }
    // We do NOT return error here if status is something else (e.g. 'pending').
    // The atomic update below requires 'unused' so it will fail there if not valid.

    // 3. User & Redemption Eligibility Check
    
    // A. Find or Create User
    const adminClient = getSupabaseAdmin();
    let userId: string | null = null;
    
    // Check if user exists
    const { data: existingUser, error: userFetchError } = await adminClient
        .from('users')
        .select('id')
        .eq('phone', normalizedPhone)
        .single();
        
    if (existingUser) {
        userId = existingUser.id;
    } else {
        // Create new user (using name if provided, or just phone)
        // Ideally we should receive name from frontend too, let's assume it might be in body
        const { name } = await request.json().catch(() => ({ name: '' }));
        
        const { data: newUser, error: createUserError } = await adminClient
            .from('users')
            .insert({ phone: normalizedPhone, name: name || 'Anonymous' })
            .select('id')
            .single();
            
        if (createUserError || !newUser) {
            console.error('Error creating user:', createUserError);
            return NextResponse.json({ error: 'Failed to register user' }, { status: 500 });
        }
        userId = newUser.id;
    }

    // B. Check if User has already redeemed for this Campaign
    const { data: existingCoupon, error: redemptionCheckError } = await adminClient
        .from('coupons')
        .select('id')
        .eq('user_id', userId)
        .eq('campaign_id', bottle.campaign_id)
        .single(); // Should return null if no redemption

    // If we found a coupon, reject
    if (existingCoupon) {
        return NextResponse.json({ error: 'You have already redeemed a coupon for this campaign' }, { status: 400 });
    }
    
    // 4. Generate Coupon Code
    const couponCode = `AKUAFI-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const now = new Date().toISOString();

    // 5. Update Database (Atomic - Update Bottle First)
    
    // A. Update Bottle Status atomically
    // Attempt to mark as used only if current status is 'unused'.
    const { data: bottleUpdated, error: bottleUpdateError } = await adminClient
        .from('bottles')
        .update({ 
            status: 'used',
            scanned_at: now
        })
        .eq('id', bottle.id)
        .eq('status', 'unused') // Atomic check
        .select()
        .single(); 

    if (bottleUpdateError || !bottleUpdated) {
         console.error('Bottle update failed or already used (Atomic Check):', bottleUpdateError || 'No rows updated');
         return NextResponse.json({ error: 'QR Code already used' }, { status: 400 });
    }

    // B. Insert Coupon
    // Only happens if bottle was successfully marked used by THIS request.
    const { error: couponError } = await adminClient
        .from('coupons')
        .insert({
          coupon_code: couponCode,
          bottle_id: bottle.id,
          campaign_id: bottle.campaign_id,
          user_id: userId, // Link to the user
          status: 'active',
          generated_at: now,
          redeemed_at: null
        });

    if (couponError) {
        console.error('Error creating coupon:', couponError);
        // Critical: Bottle is marked used but coupon failed.
        return NextResponse.json({ error: 'Failed to generate coupon' }, { status: 500 });
    }

    return NextResponse.json({ 
        success: true, 
        coupon_code: couponCode,
        status: 'active',
        message: 'Coupon generated successfully' 
    });
    
  } catch (error) {
    console.error('Error verifying OTP and generating coupon:', error);
    return NextResponse.json({ error: 'System error' }, { status: 500 });
  }
}
