import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { qr_token } = await request.json();

    if (!qr_token) {
      return NextResponse.json({ error: 'QR Token is required' }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // 1. Fetch Bottle
    const { data: bottles, error } = await supabaseAdmin
      .from('bottles')
      .select('*')
      .eq('qr_token', qr_token)
      .limit(1);

    if (error) {
      console.error('Bottle lookup failed:', error?.message);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!bottles || bottles.length === 0) {
      return NextResponse.json({ error: 'Bottle not found' }, { status: 404 });
    }

    const bottle = bottles[0];

    // 2. CHECK: Existing Coupon for this bottle
    // Query 'coupons' table to see if a coupon was already generated for this bottle
    const { data: coupons, error: couponError } = await supabaseAdmin
      .from('coupons')
      .select('coupon_code, status, redeemed_at, discount_value')
      .eq('bottle_id', bottle.id)
      .limit(1);

    if (couponError) {
      console.error('Coupon check failed:', couponError);
      return NextResponse.json({ error: 'Database error checking redemptions' }, { status: 500 });
    }

    const existingCoupon = coupons && coupons.length > 0 ? coupons[0] : null;

    // STRICT RULE: If ANY coupon exists for this bottle, permanently lock the QR.
    // Status is irrelevant — active, claimed, used, expired all block the form.
    const isHardBlocked = Boolean(existingCoupon);

    // 3. Increment Scan Count (Fire and Forget)
    // Only increment if it's the first time scan (bottle not used)
    if (bottle.campaign_id) {
      try {
        await supabaseAdmin.rpc('increment_scan_count', { p_campaign_id: bottle.campaign_id });
      } catch (cntErr) {
        console.error("Failed to increment scan count:", cntErr);
      }
    }

    return NextResponse.json({ 
      success: true, 
      bottle: bottle,
      exists: Boolean(isHardBlocked),
      coupon: existingCoupon
    });

  } catch (error) {
    console.error('Error checking bottle:', error);
    return NextResponse.json({ error: 'System error' }, { status: 500 });
  }
}
