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
        // Force 401/403 based on error message or default to 401 for safety if it was an auth attempt
        const status = authError.message.includes('Forbidden') ? 403 : 401;
        return NextResponse.json({ error: authError.message }, { status });
    }

    // Parallel queries for dashboard stats
    // 1. Campaign Counts
    const { count: totalCampaigns, error: cErr } = await getSupabaseAdmin()
        .from('campaigns')
        .select('*', { count: 'exact', head: true });
        
    if (cErr) throw new Error(`DB Error (Campaigns): ${cErr.message}`);

    // 2. Active Campaigns
    const now = new Date().toISOString();
    const { count: activeCampaigns } = await getSupabaseAdmin()
        .from('campaigns')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .lte('start_date', now)
        .gte('end_date', now);

    // 3. Bottles Generated
    const { count: totalBottles } = await getSupabaseAdmin()
        .from('bottles')
        .select('*', { count: 'exact', head: true });

    // 4. Total Redemptions
    const { count: totalRedeemed } = await getSupabaseAdmin()
        .from('coupons')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'redeemed');

    // 5. Recent Activity
    const { data: recentActivity } = await getSupabaseAdmin()
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
    console.error('[API] Stats Error:', error);
    // Ensure we don't accidentally return 400 for server errors
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
