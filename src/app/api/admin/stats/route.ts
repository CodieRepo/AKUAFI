import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { verifyAdmin } from '@/lib/adminAuth';

export async function GET(request: Request) {
  try {
    await verifyAdmin(request);

    // Parallel queries for dashboard stats
    // Parallel queries for dashboard stats
    // 1. Campaign Counts
    const { count: totalCampaigns } = await supabaseAdmin
        .from('campaigns')
        .select('*', { count: 'exact', head: true });

    // 2. Active Campaigns (Logic: is_active = true)
    // Note: Accurate "Active" also depends on date, but for stats 'is_active' flag is a good proxy for "Enabled".
    // If we want strictly currently running, we'd need date filter too. Let's do both for accuracy.
    const now = new Date().toISOString();
    const { count: activeCampaigns } = await supabaseAdmin
        .from('campaigns')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .lte('start_date', now)
        .gte('end_date', now);

    // 3. Bottles Generated
    const { count: totalBottles } = await supabaseAdmin
        .from('bottles')
        .select('*', { count: 'exact', head: true });

    // 4. Total Redemptions (Coupons redeemed)
    const { count: totalRedeemed } = await supabaseAdmin
        .from('coupons')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'redeemed');

    // 5. Recent Activity (Last 5 Redemptions)
    const { data: recentActivity } = await supabaseAdmin
        .from('redemptions')
        .select(`
            redeemed_at,
            coupons (
                code,
                discount_value,
                campaigns ( name ),
                users ( phone )
            )
        `)
        .order('redeemed_at', { ascending: false })
        .limit(5);

    return NextResponse.json({
        total_campaigns: totalCampaigns || 0,
        active_campaigns: activeCampaigns || 0,
        total_qr_generated: totalBottles || 0,
        total_redeemed: totalRedeemed || 0,
        recent_activity: recentActivity || []
    });

  } catch (error: any) {
    const status = error.message.includes('Unauthorized') ? 401 : error.message.includes('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
