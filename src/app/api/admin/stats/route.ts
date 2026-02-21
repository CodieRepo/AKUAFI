import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { verifyAdmin } from '@/lib/adminAuth';

export async function GET(request: Request) {
  try {
    console.log('[API] /admin/stats called');
    
    // Explicitly handle auth verification
    try {
        await verifyAdmin();
    } catch (authError: any) {
        console.error('[API] Auth failed:', authError.message);
        const status = authError.message.includes('Forbidden') ? 403 : 401;
        return NextResponse.json({ error: authError.message }, { status });
    }

    // Parallel queries for dashboard stats
    const [
      { count: totalCampaigns, error: cErr },
      { count: activeCampaigns },
      { count: totalBottles },
      { count: totalRedeemed },
      { data: recentActivity },
      // Platform Revenue: fetch claimed coupons with campaign MOV via admin client (bypasses RLS)
      { data: claimedWithMOV },
    ] = await Promise.all([
      // 1. Campaign Counts
      getSupabaseAdmin()
        .from('campaigns')
        .select('*', { count: 'exact', head: true }),

      // 2. Active Campaigns
      getSupabaseAdmin()
        .from('campaigns')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .lte('start_date', new Date().toISOString())
        .gte('end_date', new Date().toISOString()),

      // 3. Bottles Generated
      getSupabaseAdmin()
        .from('bottles')
        .select('*', { count: 'exact', head: true }),

      // 4. Total Redemptions (claimed + redeemed statuses)
      getSupabaseAdmin()
        .from('coupons')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'redeemed'),

      // 5. Recent Activity
      getSupabaseAdmin()
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
        .limit(5),

      // 6. Platform Revenue: claimed coupons joined to campaigns for MOV
      //    Uses admin client — bypasses RLS, ensuring campaigns.minimum_order_value is readable
      getSupabaseAdmin()
        .from('coupons')
        .select('campaign_id, campaigns(minimum_order_value)')
        .eq('status', 'claimed'),
    ]);

    if (cErr) throw new Error(`DB Error (Campaigns): ${cErr.message}`);

    // Aggregate platform revenue: SUM(claimed × minimum_order_value)
    const platformRevenue = (claimedWithMOV || []).reduce((sum: number, c: any) =>
      sum + Number(c.campaigns?.minimum_order_value || 0), 0
    );

    return NextResponse.json({
        total_campaigns: totalCampaigns || 0,
        active_campaigns: activeCampaigns || 0,
        total_qr_generated: totalBottles || 0,
        total_redeemed: totalRedeemed || 0,
        recent_activity: recentActivity || [],
        platform_revenue: platformRevenue,
    });

  } catch (error: any) {
    console.error('[API] Stats Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
