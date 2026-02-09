import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: NextRequest) {
  try {
    const { qr_token, name } = await req.json(); // Phone is extracted from Auth Token

    console.log("--- API REDEEM RECEIVED ---");

    // 1. SECURE AUTH: Verify User via Supabase Token
    // The frontend must pass the session access_token in the Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
        return NextResponse.json({ error: 'Unauthorized: Missing Auth Token' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await getSupabaseAdmin().auth.getUser(token);

    if (authError || !user || !user.phone) {
        console.error("Auth Token Verification Failed:", authError);
        return NextResponse.json({ error: 'Unauthorized: Invalid Token' }, { status: 401 });
    }

    const phone = user.phone;
    console.log("VERIFIED PHONE:", phone);

    // 2. FETCH BOTTLE & CAMPAIGN INFO
    // We need campaign details (min/max value) to calculate discount
    if (!qr_token) {
      return NextResponse.json({ error: 'Missing QR token' }, { status: 400 });
    }

    const { data: bottle, error: bottleError } = await getSupabaseAdmin()
      .from('bottles')
      .select(`
        id, 
        campaign_id, 
        qr_token, 
        is_used,
        campaigns (
            coupon_min_value,
            coupon_max_value,
            start_date,
            end_date,
            is_active
        )
      `)
      .eq('qr_token', qr_token)
      .single();

    if (bottleError || !bottle) {
      console.error("API LOOKUP FAILED for token:", JSON.stringify(qr_token));
      return NextResponse.json({ error: 'Invalid QR code' }, { status: 404 });
    }

    // STRICT CHECK 1: Bottle hard lock
    if (bottle.is_used === true) {
        return NextResponse.json({ error: 'This QR code has already been scanned.' }, { status: 409 });
    }

    // STRICT CHECK 2: Campaign Validity (Dates & Active Status)
    const campaign = Array.isArray(bottle.campaigns) ? bottle.campaigns[0] : bottle.campaigns;
    
    if (!campaign) {
         return NextResponse.json({ error: 'Campaign not found for this bottle.' }, { status: 404 });
    }

    if (campaign.is_active === false) {
         return NextResponse.json({ error: 'This campaign is currently inactive.' }, { status: 400 });
    }

    const now = new Date();
    const startDate = new Date(campaign.start_date);
    const endDate = new Date(campaign.end_date);

    if (now < startDate) {
        return NextResponse.json({ error: 'This campaign has not started yet.' }, { status: 400 });
    }

    if (now > endDate) {
        return NextResponse.json({ error: 'This campaign has expired.' }, { status: 400 });
    }

    // 3. UPSERT PUBLIC USER (Identity Map)
    // We map Auth User -> Public User Table for relational integrity
    let userId: string;
    
    // Check if user exists by phone
    const { data: existingUser } = await getSupabaseAdmin()
      .from('users')
      .select('id')
      .eq('phone', phone)
      .maybeSingle();

    if (existingUser) {
      userId = existingUser.id;
    } else {
      // Create new user map
      const { data: newUser, error: createUserError } = await getSupabaseAdmin()
        .from('users')
        .insert([{ 
            phone,
            name: name || 'Anonymous',
            created_at: new Date().toISOString()
        }])
        .select('id')
        .single();

      if (createUserError || !newUser) {
        // Handle race condition if user created in parallel
        if (createUserError.code === '23505') { // Unique violation
             const { data: retryUser } = await getSupabaseAdmin().from('users').select('id').eq('phone', phone).single();
             if (retryUser) userId = retryUser.id;
             else throw createUserError;
        } else {
            console.error('Error creating user:', createUserError);
            return NextResponse.json({ error: 'Failed to create user record' }, { status: 500 });
        }
      } else {
          userId = newUser.id;
      }
    }

    // 4. CHECK CAMPAIGN ELIGIBILITY (User + Campaign)
    const { data: existingCoupon } = await getSupabaseAdmin()
      .from('coupons')
      .select('id')
      .eq('user_id', userId)
      .eq('campaign_id', bottle.campaign_id)
      .maybeSingle();

    if (existingCoupon) {
      // Rule: One User -> One Coupon per Campaign.
      return NextResponse.json({ error: 'You have already claimed a reward for this campaign.' }, { status: 409 });
    }

    // 5. CALCULATE DISCOUNT & ISSUE COUPON
    // Uses verified campaign data from Step 2
    const minVal = campaign?.coupon_min_value || 0;
    const maxVal = campaign?.coupon_max_value || 0;
    
    // Random integer between min and max (inclusive)
    const discountValue = Math.floor(Math.random() * (maxVal - minVal + 1)) + minVal;

    const couponCode = `AKUAFI-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const issuedAt = new Date().toISOString();

    // A. Insert Coupon (Rely on UNIQUE bottle_id constraint)
    const { error: couponInsertError } = await getSupabaseAdmin()
      .from('coupons')
      .insert([{
        code: couponCode,
        user_id: userId,
        campaign_id: bottle.campaign_id,
        bottle_id: bottle.id,
        discount_value: discountValue,
        status: 'issued',
        issued_at: issuedAt
      }]);

    if (couponInsertError) {
      console.error('Coupon insert error:', couponInsertError);
      
      // Conflict: Bottle already used (Constraint: unique(bottle_id))
      if (couponInsertError.code === '23505' || couponInsertError.message?.includes('bottle_id')) {
           return NextResponse.json({ error: 'This QR code has already been redeemed.' }, { status: 409 });
      }
      
      // Conflict: User already claimed (Constraint: unique(user_id, campaign_id))
      // (Though we checked above, race conditions happen)
      if (couponInsertError.message?.includes('user_id') && couponInsertError.message?.includes('campaign_id')) {
           return NextResponse.json({ error: 'You have already claimed a reward for this campaign.' }, { status: 409 });
      }

      return NextResponse.json({ error: 'Failed to generate coupon' }, { status: 500 });
    }
    
    // B. Mark Bottle as USED (Hard Lock)
    // We update this AFTER coupon issue. 
    const { error: bottleUpdateError } = await getSupabaseAdmin()
        .from('bottles')
        .update({ 
            is_used: true,
            used_at: issuedAt
        })
        .eq('id', bottle.id);

    if (bottleUpdateError) {
        // This is a critical edge case. Coupon exists, but bottle not marked.
        // The unique constraint on bottle_id prevents other coupons, so it's "safe" from double spend,
        // but physically the bottle looks unused in DB.
        console.error('CRITICAL: Bottle update failed after coupon issue:', bottleUpdateError);
        // We do strictly attempt to lock it.
    }

    return NextResponse.json({ 
        coupon: couponCode,
        value: discountValue 
    });

  } catch (err) {
    console.error('Unexpected error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
