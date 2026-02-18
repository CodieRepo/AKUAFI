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

    // 2. HARD CHECK: Redemption Existence
    // Prevent form from opening if already redeemed
    const { data: existingRedemptions, error: redemptionError } = await supabaseAdmin
      .from('redemptions')
      .select('id')
      .eq('bottle_id', bottle.id)
      .limit(1);

    if (redemptionError) {
        console.error('Redemption check failed:', redemptionError);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (existingRedemptions && existingRedemptions.length > 0) {
        // Front-end expects this exact string to show "Used" view
        return NextResponse.json({ error: 'Coupon redeemed from this QR' }, { status: 400 });
    }

    // 3. Fallback Check: is_used flag
    if (bottle.is_used) {
         return NextResponse.json({ error: 'Coupon redeemed from this QR' }, { status: 400 });
    }

    // 4. Increment Scan Count (Fire and Forget)
    // We increment scan count for "Valid Bottle View"
    if (bottle.campaign_id) {
        // We do not await this strictly to keep response fast, 
        // or we can await if we want strict logging. 
        // Since it's critical analytic, better to await catch error quietly.
        try {
            await supabaseAdmin.rpc('increment_scan_count', { p_campaign_id: bottle.campaign_id });
        } catch (cntErr) {
            console.error("Failed to increment scan count:", cntErr);
        }
    }

    return NextResponse.json({ 
        success: true, 
        bottle: bottle 
    });

  } catch (error) {
    console.error('Error checking bottle:', error);
    return NextResponse.json({ error: 'System error' }, { status: 500 });
  }
}
