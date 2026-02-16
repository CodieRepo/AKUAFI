import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { 
  Calendar, 
  Clock,
  ArrowUpRight,
  Sparkles,
  LayoutDashboard
} from "lucide-react";
import PremiumStatCard from "@/components/dashboard/PremiumStatCard";
import CouponVerification from "@/components/dashboard/coupons/CouponVerification";
import ClientNavbar from "@/components/client/layout/ClientNavbar";

// FORMATTER: UTC -> IST Display Only
function formatIST(dateString: string) {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      dateStyle: "medium", 
    });
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
}

export default async function ClientDashboard() {
  const supabase = await createClient();

  // 1. Auth & Client Check
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/client/login");
  }

  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("id, client_name")
    .eq("user_id", user.id)
    .single();

  if (clientError || !client) {
    return redirect("/client/login?error=no_client_profile");
  }

  // 2. Fetch Campaigns with Scan Counts
  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("id, name, created_at, status, start_date, end_date, coupons(count)")
    .eq("client_id", client.id)
    .order("created_at", { ascending: false });

  const campaignList = campaigns || [];
  const campaignIds = campaignList.map(c => c.id);

  // 3. Parallel Metrics Fetching
  let impressions = 0;
  let scans = 0;
  let redemptions = 0;
  let revenue = 0;
  let recentActivity: any[] = [];

  if (campaignIds.length > 0) {
    const [
      { count: bottlesCount },
      { count: scansCount },
      { data: redeemedCoupons }, // Need data to sum revenue
      { data: recentRedemptions } 
    ] = await Promise.all([
      // A. Impressions
      supabase.from("bottles")
        .select('*', { count: 'exact', head: true })
        .in('campaign_id', campaignIds),
      
      // B. Scans
      supabase.from("coupons")
        .select('*', { count: 'exact', head: true })
        .in('campaign_id', campaignIds),

      // C. Revenue & Redemptions
      supabase.from("coupons")
        .select('discount_value')
        .in('campaign_id', campaignIds)
        .eq('status', 'redeemed'),
        
      // D. Recent Activity
      supabase.from("redemptions")
        .select(`
            redeemed_at,
            coupons!inner (
                code,
                campaign_id,
                campaigns ( name )
            )
        `)
        .in('coupons.campaign_id', campaignIds)
        .order('redeemed_at', { ascending: false })
        .limit(5)
    ]);

    impressions = bottlesCount || 0;
    scans = scansCount || 0;
    
    // Revenue Calc
    if (redeemedCoupons) {
      redemptions = redeemedCoupons.length;
      revenue = redeemedCoupons.reduce((sum, coupon) => sum + (Number(coupon.discount_value) || 0), 0);
    }
    
    if (recentRedemptions) {
        recentActivity = recentRedemptions;
    }
  }

  // 4. Calculated Metrics
  const conversionRateVal = impressions > 0 ? (scans / impressions) * 100 : 0;
  const redemptionRateVal = scans > 0 ? (redemptions / scans) * 100 : 0;
  
  const conversionRate = conversionRateVal.toFixed(1) + "%";
  const redemptionRate = redemptionRateVal.toFixed(1) + "%";

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-black/95 flex flex-col">
        
        {/* --- Header Bar --- */}
        <ClientNavbar clientName={client.client_name} />

        <div className="flex-grow space-y-8 p-6 md:p-8 max-w-[1600px] mx-auto w-full animate-in fade-in duration-700">
        
            {/* --- Hero Section & KPIs --- */}
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-semibold mb-3">
                            <Sparkles className="h-3 w-3" />
                            <span>Live Analytics</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
                        Welcome back, {client.client_name}
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm max-w-xl">
                            Here is your campaign performance overview for today.
                        </p>
                    </div>
                    <div className="flex items-center gap-3 bg-white dark:bg-slate-900 px-4 py-2 rounded-full border border-gray-200 dark:border-slate-800 shadow-sm">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {new Date().toLocaleDateString("en-IN", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
                    <PremiumStatCard 
                        title="Impressions"
                        value={impressions}
                        iconType="impressions"
                        description="Bottles in market"
                        delay={0}
                    />
                    <PremiumStatCard 
                        title="QR Scans"
                        value={scans}
                        iconType="scans"
                        description="Total engagements"
                        delay={100}
                    />
                    <PremiumStatCard 
                        title="Conversion"
                        value={conversionRate}
                        iconType="conversion"
                        trend="Scan Rate"
                        trendValue={conversionRateVal}
                        delay={200}
                    />
                    <PremiumStatCard 
                        title="Redemption %"
                        value={redemptionRate}
                        iconType="redemption"
                        trend="Claim Rate"
                        trendValue={redemptionRateVal}
                        delay={300}
                    />
                    <PremiumStatCard 
                        title="Total Revenue"
                        value={formatCurrency(revenue)}
                        iconType="revenue"
                        description="Value Generated"
                        type="revenue"
                        trend="Excellent"
                        trendValue={revenue > 0 ? 1 : 0}
                        delay={400}
                    />
                </div>
            </div>

            {/* --- Main Content Grid --- */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 pb-10">
                
                {/* Left Column: Campaign List (2 cols wide) */}
                <div className="xl:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            Active Campaigns
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Manage your ongoing bottle campaigns</p>
                        </div>
                    </div>
                    
                    {campaignList.length === 0 ? (
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-gray-300 dark:border-slate-700 p-16 text-center">
                            <div className="bg-blue-50 dark:bg-slate-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Sparkles className="h-10 w-10 text-blue-500" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Start your first campaign</h3>
                            <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-6">
                                Launch a campaign to track impressions, scans, and revenue in real-time.
                            </p>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50/50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-700/50">
                                        <tr>
                                            <th className="px-6 py-4 font-semibold text-gray-500 dark:text-gray-400">Campaign</th>
                                            <th className="px-6 py-4 font-semibold text-gray-500 dark:text-gray-400">Engagements</th>
                                            <th className="px-6 py-4 font-semibold text-gray-500 dark:text-gray-400">Date Range</th>
                                            <th className="px-6 py-4 font-semibold text-gray-500 dark:text-gray-400 text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                                        {campaignList.map((campaign) => (
                                            <tr key={campaign.id} className="hover:bg-gray-50/80 dark:hover:bg-slate-800/30 transition-colors group">
                                                <td className="px-6 py-5">
                                                    <span className="block font-semibold text-gray-900 dark:text-white text-base mb-0.5">{campaign.name}</span>
                                                    <span className="text-xs text-gray-400">ID: {campaign.id.slice(0, 8)}...</span>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                                                        <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                                            {campaign.coupons && campaign.coupons[0] ? campaign.coupons[0].count : 0}
                                                        </div>
                                                        <span className="text-xs text-gray-500">Scans</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-gray-600 dark:text-gray-400">
                                                    <div className="flex flex-col text-xs font-medium bg-gray-100 dark:bg-slate-800 w-fit px-3 py-1.5 rounded-lg border border-transparent group-hover:border-gray-200 dark:group-hover:border-slate-700 transition-colors">
                                                        <span>{new Date(campaign.start_date).toLocaleDateString("en-IN", {month: 'short', day: 'numeric'})}</span>
                                                        <span className="text-gray-400 dark:text-gray-500 text-[10px] uppercase">to</span>
                                                        <span>{new Date(campaign.end_date).toLocaleDateString("en-IN", {month: 'short', day: 'numeric', year: 'numeric'})}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-center">
                                                    <span className={`
                                                        inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold capitalize
                                                        ${campaign.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : ''}
                                                        ${campaign.status === 'paused' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' : ''}
                                                        ${campaign.status === 'completed' ? 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-gray-400' : ''}
                                                        ${!campaign.status || campaign.status === 'draft' ? 'bg-gray-100 text-gray-600' : ''}
                                                    `}>
                                                        {campaign.status === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2 animate-pulse" />}
                                                        {campaign.status || 'Draft'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Verify & Activity (1 col wide) */}
                <div className="space-y-6 flex flex-col">
                    
                    {/* 1. Verify Coupon Section */}
                    <div className="flex-1">
                        <CouponVerification />
                    </div>

                    {/* 2. Recent Activity Section */}
                    <div className="space-y-6 flex flex-col flex-1">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    Recent Activity
                                </h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Real-time redemptions</p>
                            </div>
                        </div>
                        
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-3 min-h-[300px]">
                            {recentActivity.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                                    <Clock className="h-8 w-8 text-gray-200 dark:text-slate-700 mb-3" />
                                    <p className="text-gray-400 text-sm">No recent activity yet.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-50 dark:divide-slate-800">
                                    {recentActivity.map((activity, idx) => (
                                        <div key={idx} className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors rounded-xl group cursor-default">
                                            <div className="h-10 w-10 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-sm">
                                                <ArrowUpRight className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex justify-between items-start">
                                                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                                        Coupon Redeemed
                                                    </p>
                                                    <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">
                                                        {new Date(activity.redeemed_at).toLocaleTimeString("en-IN", { hour: '2-digit', minute:'2-digit' })}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                                                    {activity.coupons?.campaigns?.name}
                                                </p>
                                                <div className="mt-1.5 flex items-center">
                                                    <code className="bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[10px] font-mono text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-slate-700">
                                                        {activity.coupons?.code}
                                                    </code>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
}
