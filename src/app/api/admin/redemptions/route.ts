import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { verifyAdmin } from '@/lib/adminAuth';

export async function GET(request: Request) {
  try {
    await verifyAdmin(request);

    // Fetch redemptions via coupons table which links everything
    // We attempt to perform a join. If FKs are missing, this might fail or return nulls.
    // Based on "coupons" table usage in api/redeem.
    
    // Selecting: code, status, created_at, bottles(qr_token), users(phone), campaigns(name)
    const { data, error } = await supabaseAdmin
      .from('coupons')
      .select(`
        code,
        created_at,
        bottles ( qr_token ),
        users ( phone ),
        campaigns ( name )
      `)
      .order('created_at', { ascending: false })
      .limit(100); // Limit for performance

    if (error) {
        // Fallback or specific error handling
        console.error("Redemptions fetch error:", error);
        throw error;
    }

    // Transform data flat for the UI
    const formatted = data.map((item: any) => ({
        id: item.code, // Use code as ID for key
        qr_token: item.bottles?.qr_token || 'N/A',
        campaign_name: item.campaigns?.name || 'Unknown',
        phone: item.users?.phone || 'Unknown',
        coupon_code: item.code,
        redeemed_at: item.created_at
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    const status = error.message.includes('Unauthorized') ? 401 : error.message.includes('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    await verifyAdmin(request);
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json({ error: 'Coupon code is required' }, { status: 400 });
    }
    
    // 1. Fetch Coupon & Details
    const { data: coupon, error: fetchError } = await supabaseAdmin
        .from('coupons')
        .select(`
            id,
            status,
            campaign_id,
            campaigns (
                end_date,
                is_active
            )
        `)
        .eq('code', code)
        .single();
    
    if (fetchError || !coupon) {
        return NextResponse.json({ error: 'Invalid coupon code' }, { status: 404 });
    }

    // 2. Access Control Checks
    if (coupon.status === 'redeemed') {
        return NextResponse.json({ error: 'This coupon has already been used.' }, { status: 409 });
    }

    // 3. Expiry Check (Campaign Inheritance)
    // Handle array potential for joins
    const campaign = Array.isArray(coupon.campaigns) ? coupon.campaigns[0] : coupon.campaigns;
    
    if (campaign) {
        // Active check
        if (campaign.is_active === false) {
             return NextResponse.json({ error: 'The campaign for this coupon is inactive.' }, { status: 400 });
        }
        
        // Date check
        const now = new Date();
        const endDate = new Date(campaign.end_date);
        
        if (now > endDate) {
             return NextResponse.json({ error: 'This coupon has expired (Campaign Ended).' }, { status: 400 });
        }
    }

    // 4. Perform Redemption (Atomic-ish)
    const redeemedAt = new Date().toISOString();

    // A. Update Coupon Status
    const { error: updateError } = await supabaseAdmin
        .from('coupons')
        .update({ status: 'redeemed', redeemed_at: redeemedAt })
        .eq('id', coupon.id);
    
    if (updateError) {
        throw updateError;
    }

    // B. Create Redemption Record
    const { error: insertError } = await supabaseAdmin
        .from('redemptions')
        .insert([{
            coupon_id: coupon.id,
            redeemed_at: redeemedAt
        }]);
    
    if (insertError) {
        // Log consistency error (coupon updated but log failed)
        console.error("Redemption Log Failed:", insertError);
    }

    return NextResponse.json({ success: true, message: 'Coupon redeemed successfully.' });

  } catch (error: any) {
    console.error("Redemption POST Error:", error);
    const status = error.message.includes('Unauthorized') ? 401 : error.message.includes('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
