import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request: Request) {
  try {
    const { coupon_code } = await request.json();

    if (!coupon_code) {
      return NextResponse.json({ error: 'Coupon code is required' }, { status: 400 });
    }

    // 1. Redeem Coupon Atomically
    // Validates status is 'active' AND updates to 'redeemed' in one go.
    // This prevents race conditions where a coupon could be redeemed twice.
    const { data, error } = await getSupabaseAdmin()
      .from('coupons')
      .update({
        status: 'claimed',
        redeemed_at: new Date().toISOString(),
      })
      .eq('coupon_code', coupon_code) // Use coupon_code as the lookup
      .eq('status', 'active') // Atomic Check: Only update if active
      .select()
      .single();

    if (error) {
        // If error, it could also be that the row wasn't found (already redeemed or invalid code)
        console.error('Error redeeming coupon:', error);
        // We distinguish between "System Error" and "Aleady Redeemed" based on context,
        // but here supabase returns error if .single() finds 0 rows (which means condition failed).
        return NextResponse.json({ error: 'Coupon already redeemed or invalid' }, { status: 400 });
    }

    if (!data) {
       return NextResponse.json({ error: 'Coupon already redeemed, invalid, or not active' }, { status: 400 });
    }

    // 2. Insert into Redemptions Table (Metric Consistency)
    // We now log this as a redemption in the redemptions table
    const { error: redemptionError } = await getSupabaseAdmin()
        .from('redemptions')
        .insert({
            user_id: data.user_id || null, // If user_id exists on coupon (backfilled or assigned), use it. Else null (manual claim).
            campaign_id: data.campaign_id,
            coupon_code: data.coupon_code,
            bottle_id: data.bottle_id, // Important to link bottle if it exists
            redeemed_at: new Date().toISOString()
        });

    if (redemptionError) {
        console.error('Error inserting redemption record:', redemptionError);
        // We don't rollback the coupon status? ideally we should, but for now log error.
        // The coupon IS claimed, just metrics might be off.
    }

    return NextResponse.json({ 
        success: true, 
        message: 'Coupon marked as claimed successfully',
        coupon: data
    });

  } catch (error) {
    console.error('Error in redemption API:', error);
    return NextResponse.json({ error: 'System error' }, { status: 500 });
  }
}
