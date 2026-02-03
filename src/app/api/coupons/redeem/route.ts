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
        status: 'redeemed',
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
       // Should be caught by error check above with .single(), but double check.
       return NextResponse.json({ error: 'Coupon already redeemed or invalid' }, { status: 400 });
    }

    return NextResponse.json({ 
        success: true, 
        message: 'Coupon redeemed successfully',
        coupon: data
    });

  } catch (error) {
    console.error('Error in redemption API:', error);
    return NextResponse.json({ error: 'System error' }, { status: 500 });
  }
}
