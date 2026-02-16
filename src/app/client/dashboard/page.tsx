import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { 
  Calendar, 
  Clock,
  Sparkles,
  Trophy,
  Activity,
  Zap,
  TrendingUp
} from "lucide-react";
import PremiumStatCard from "@/components/dashboard/PremiumStatCard";
import CouponVerification from "@/components/dashboard/coupons/CouponVerification";
import MiniScanChart from "@/components/dashboard/MiniScanChart";
import AISummaryCard from "@/components/dashboard/AISummaryCard";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
}

// Helper to get array of last 7 days dates (YYYY-MM-DD)
function getLast7Days() {
    const dates = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
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

  // 2. Fetch Campaigns
  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("id, name, created_at, status, start_date, end_date, coupons(count)")
    .eq("client_id", client.id)
    .order("created_at", { ascending: false });

  const campaignList = campaigns || [];
  const campaignIds = campaignList.map(c => c.id);

  // 3. Metrics Initialization & Defensive Defaults
  const last7Days = getLast7Days();
  const scansByDate: Record<string, number> = {};
  const revenueByDate: Record<string, number> = {};
  
  // Initialize Chart Data Maps (guarantee keys exist)
  last7Days.forEach(d => {
    scansByDate[d] = 0;
    revenueByDate[d] = 0;
  });

  // Declare all metric variables at top scope
  let impressions = 0;
  let scans = 0;
  let redemptions = 0;
  let revenue = 0;
  let todayScans = 0;
  let yesterdayScans = 0;
  let todayRevenue = 0;
  let yesterdayRevenue = 0;
  
  let recentActivity: any[] = [];
  const campaignStats: Record<string, { impressions: number, redemptions: number, health: 'High' | 'Medium' | 'Low', conversion: number }> = {};

  // Date Boundaries for "Today" vs "Yesterday" (UTC Safe)
  const todayStart = new Date();
  todayStart.setHours(0,0,0,0);
  
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(todayStart.getDate() + 1);
  
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(todayStart.getDate() - 1);

  // 4. Data Fetching & Processing
  if (campaignIds.length > 0) {
      const [
        { data: bottlesData },
        { data: allCoupons }, 
        { data: redeemedCoupons }, 
        { data: recentRedemptions } 
      ] = await Promise.all([
        supabase.from("bottles").select('campaign_id').in('campaign_id', campaignIds),
        supabase.from("coupons").select('created_at, campaign_id').in('campaign_id', campaignIds),
        supabase.from("coupons").select('campaign_id, discount_value, status, created_at, updated_at').in('campaign_id', campaignIds).eq('status', 'redeemed'),
        supabase.from("redemptions").select('redeemed_at, coupons!inner(code, campaign_id, campaigns(name))').in('coupons.campaign_id', campaignIds).order('redeemed_at', { ascending: false }).limit(5)
      ]);

      const coupons = allCoupons || [];
      const redeemed = redeemedCoupons || [];
      const bottles = bottlesData || [];

      // A. Standard Aggregates
      impressions = bottles.length;
      scans = coupons.length;
      redemptions = redeemed.length;
      
      // B. Revenue Total
      revenue = redeemed.reduce((acc, curr) => acc + (Number(curr.discount_value) || 0), 0);

      // C. Today vs Yesterday (Strict Filter Logic)
      todayScans = coupons.filter(c => {
          const d = new Date(c.created_at).getTime();
          return d >= todayStart.getTime() && d < tomorrowStart.getTime();
      }).length;

      yesterdayScans = coupons.filter(c => {
          const d = new Date(c.created_at).getTime();
          return d >= yesterdayStart.getTime() && d < todayStart.getTime();
      }).length;

      todayRevenue = redeemed.filter(r => {
          const dateStr = r.updated_at || r.created_at;
          const d = new Date(dateStr).getTime();
          return d >= todayStart.getTime() && d < tomorrowStart.getTime();
      }).reduce((acc, curr) => acc + (Number(curr.discount_value) || 0), 0);

      yesterdayRevenue = redeemed.filter(r => {
          const dateStr = r.updated_at || r.created_at;
          const d = new Date(dateStr).getTime();
          return d >= yesterdayStart.getTime() && d < todayStart.getTime();
      }).reduce((acc, curr) => acc + (Number(curr.discount_value) || 0), 0);

      // D. Chart Data Population
      coupons.forEach(c => {
          const dateKey = c.created_at.split('T')[0];
          if (scansByDate[dateKey] !== undefined) {
              scansByDate[dateKey]++;
          }
      });

      redeemed.forEach(r => {
          const dateKey = (r.updated_at || r.created_at).split('T')[0];
          if (revenueByDate[dateKey] !== undefined) {
              revenueByDate[dateKey] += (Number(r.discount_value) || 0);
          }
      });

      // E. Campaign Performance Stats
      campaignList.forEach(c => {
          const cImpressions = bottles.filter(b => b.campaign_id === c.id).length;
          const cScans = coupons.filter(cp => cp.campaign_id === c.id).length;
          const cRedemptions = redeemed.filter(rd => rd.campaign_id === c.id).length;
          
          const conv = cImpressions > 0 ? (cScans / cImpressions) * 100 : 0;
          let health: 'High' | 'Medium' | 'Low' = 'Low';
          if (conv >= 25) health = 'High';
          else if (conv >= 10) health = 'Medium';
          
          campaignStats[c.id] = {
              impressions: cImpressions,
              redemptions: cRedemptions,
              conversion: conv,
              health
          };
      });
      
      if (recentRedemptions) {
          recentActivity = recentRedemptions;
      }
  }

  // --- Global Rates & Trends ---
  const conversionRateVal = impressions > 0 ? (scans / impressions) * 100 : 0;
  const redemptionRateVal = scans > 0 ? (redemptions / scans) * 100 : 0;
  
  const conversionRate = conversionRateVal.toFixed(1) + "%";
  const redemptionRate = redemptionRateVal.toFixed(1) + "%";
  
  // Scan Trend Logic
  const scanTrendVal = todayScans - yesterdayScans;
  let scanTrendLabel = "Stable vs yesterday";
  let scanTrendType: 'up' | 'down' | 'neutral' = 'neutral';
  
  if (todayScans > yesterdayScans) {
      scanTrendLabel = `+${scanTrendVal} vs yesterday`;
      scanTrendType = 'up';
  } else if (todayScans < yesterdayScans) {
      scanTrendLabel = `${scanTrendVal} vs yesterday`;
      scanTrendType = 'down';
  } else if (yesterdayScans === 0 && todayScans > 0) {
      scanTrendLabel = "New activity today";
      scanTrendType = 'up';
  } else if (yesterdayScans === 0 && todayScans === 0) {
      scanTrendLabel = "No recent activity";
      scanTrendType = 'neutral';
  }

  // Revenue Trend Logic
  const revTrendVal = todayRevenue - yesterdayRevenue;
  let revTrendLabel = "Stable vs yesterday";
  let revTrendType: 'up' | 'down' | 'neutral' = 'neutral';

  if (todayRevenue > yesterdayRevenue) {
      revTrendLabel = `+${formatCurrency(revTrendVal)} vs yesterday`;
      revTrendType = 'up';
  } else if (todayRevenue < yesterdayRevenue) {
      revTrendLabel = `${formatCurrency(revTrendVal)} vs yesterday`;
      revTrendType = 'down';
  } else if (yesterdayRevenue === 0 && todayRevenue > 0) {
      revTrendLabel = "New revenue today";
      revTrendType = 'up';
  } else if (yesterdayRevenue === 0 && todayRevenue === 0) {
      revTrendLabel = "No recent revenue";
      revTrendType = 'neutral';
  }
  
  // Chart Arrays
  const scanChartData = last7Days.map(d => scansByDate[d]);
  const revenueSparkData = last7Days.map(d => revenueByDate[d]);

  // AI Summary Logic Prep
  const revTrendEnum = revTrendVal > 0 ? 'up' : revTrendVal < 0 ? 'down' : 'stable';
  const scansTrendEnum = scanTrendVal > 0 ? 'up' : scanTrendVal < 0 ? 'down' : 'stable';
  
  // Quick Insights Data
  const activeCampaigns = campaignList.filter(c => c.status === 'active').length;
  const bestCampaign = campaignList.reduce((prev, current) => {
      const prevScans = prev.coupons?.[0]?.count || 0;
      const currScans = current.coupons?.[0]?.count || 0;
      return (prevScans > currScans) ? prev : current;
  }, campaignList[0] || { name: 'N/A' });


  // --- EMPTY STATE CHECK ---
  if (campaignList.length === 0) {
      return (
        <div className="min-h-screen bg-black lg:bg-transparent flex items-center justify-center p-6">
            <div className="max-w-2xl w-full bg-slate-900/50 backdrop-blur-xl rounded-3xl border border-slate-800 p-12 text-center shadow-2xl animate-in fade-in zoom-in duration-500">
                <div className="mx-auto w-20 h-20 rounded-full bg-blue-500/10 flex items-center justify-center mb-6 ring-1 ring-blue-400/20">
                    <Sparkles className="h-10 w-10 text-blue-400" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-4 tracking-tight">Launch Your First Campaign</h2>
                <p className="text-slate-400 text-lg mb-8 max-w-md mx-auto">
                    Start tracking impressions, scans, and revenue in real-time. Create a campaign to unlock your dashboard.
                </p>
                <a 
                    href="/client/campaigns/create" 
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-full font-semibold transition-all hover:scale-105 hover:shadow-lg hover:shadow-blue-500/20"
                >
                    <Zap className="h-4 w-4 fill-white" />
                    Create Campaign
                </a>
            </div>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-black lg:bg-transparent text-slate-200 font-sans">
        <div className="max-w-7xl mx-auto px-6 py-10 space-y-8 animate-in fade-in duration-700">
        
            {/* --- 1. Hero Analytics Section --- */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-950 to-black border border-slate-800 p-8 shadow-2xl">
                {/* Background Glow */}
                <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none opacity-50"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-4">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <span>Live Analytics</span>
                        </div>
                        <h1 className="text-4xl font-bold text-white tracking-tight mb-2">
                            Welcome back, {client.client_name}
                        </h1>
                        <p className="text-slate-400 text-sm max-w-lg mb-4">
                             Your campaigns generated <span className="text-white font-semibold">{todayScans} scans</span> and <span className="text-white font-semibold">{formatCurrency(todayRevenue)} revenue</span> today.
                        </p>
                        
                        <div className="flex flex-wrap gap-3">
                            <div className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300 border border-slate-700">
                                Active Campaigns: <span className="text-white font-semibold">{activeCampaigns}</span>
                            </div>
                            <div className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300 border border-slate-700">
                                Today&apos;s Scans: <span className="text-white font-semibold">{todayScans}</span>
                            </div>
                             <div className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300 border border-slate-700">
                                Today&apos;s Revenue: <span className="text-white font-semibold">{formatCurrency(todayRevenue)}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex flex-col items-start md:items-end gap-2">
                         <div className="flex items-center gap-2 text-slate-400 text-sm bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-800">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>{new Date().toLocaleDateString("en-IN", { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                         </div>
                         <p className="text-xs text-slate-500">
                            Last updated: {new Date().toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' })}
                         </p>
                    </div>
                </div>
            </div>

            {/* SPACER Divider */}
            <div className="border-t border-slate-800/50 my-8" />

            {/* --- 2. KPI Metric Grid --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <PremiumStatCard 
                    title="Impressions"
                    value={impressions}
                    iconType="impressions"
                    description="Across active campaigns"
                    delay={0}
                />
                <PremiumStatCard 
                    title="QR Scans"
                    value={scans}
                    iconType="scans"
                    trend={scanTrendLabel}
                    trendType={scanTrendType}
                    delay={75}
                />
                <PremiumStatCard 
                    title="Conversion"
                    value={conversionRate}
                    iconType="conversion"
                    description="Industry avg: 5–8%"
                    delay={150}
                />
                <PremiumStatCard 
                    title="Redemption %"
                    value={redemptionRate}
                    iconType="redemption"
                    description="Based on total scans"
                    delay={225}
                />
                <PremiumStatCard 
                    title="Revenue"
                    value={formatCurrency(revenue)}
                    iconType="revenue"
                    description="Total Value"
                    type="revenue"
                    trend={revTrendLabel}
                    trendType={revTrendType}
                    sparklineData={revenueSparkData}
                    delay={300}
                />
            </div>
            
             {/* --- Mini 7-Day Chart --- */}
            <div className="bg-slate-900/40 backdrop-blur-sm border-t border-b border-slate-800/50 py-6 -mx-6 px-6 md:mx-0 md:px-6 md:rounded-2xl md:border mt-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400">
                            <Activity className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-white">Scan Activity</h3>
                            <p className="text-xs text-slate-400">Past 7 days performance</p>
                        </div>
                    </div>
                    <div className="w-full md:w-1/2 lg:w-1/3">
                        <MiniScanChart data={scanChartData} />
                    </div>
                </div>
            </div>

            {/* SPACER Divider */}
            <div className="border-t border-slate-800/50 my-8" />

            {/* --- 3. Main Content Area --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* LEFT: Campaign Permformance & Activity (2 Cols) */}
                <div className="lg:col-span-2 space-y-8">
                    
                    {/* Campaign Performance Card */}
                    <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-white/5 p-6 shadow-xl">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <Trophy className="h-5 w-5 text-blue-500" />
                                    Campaign Performance
                                </h3>
                                <p className="text-sm text-slate-400">Engagement breakdown</p>
                            </div>
                        </div>

                        {campaignList.length === 0 ? (
                             <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl bg-slate-900/30">
                                <Sparkles className="h-10 w-10 text-slate-600 mx-auto mb-3" />
                                <p className="text-slate-400">No active campaigns found.</p>
                             </div>
                        ) : (
                            <div className="space-y-6">
                                {campaignList.slice(0, 5).map((campaign, idx) => {
                                    const stats = campaignStats[campaign.id];
                                    const cScans = campaign.coupons?.[0]?.count || 0;
                                    const progress = Math.min(stats.conversion, 100);
                                    
                                    // Health Color
                                    const healthColor = stats.health === 'High' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' 
                                        : stats.health === 'Medium' ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'
                                        : 'text-red-400 bg-red-500/10 border-red-500/20';

                                    return (
                                        <div key={campaign.id} className="group">
                                            <div className="flex justify-between items-center mb-2">
                                                <div>
                                                    <h4 className="text-white font-medium text-sm flex items-center gap-2">
                                                        {campaign.name}
                                                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${healthColor} font-semibold hidden sm:inline-block`}>
                                                            {stats.health}
                                                        </span>
                                                    </h4>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-white font-bold">{cScans.toLocaleString()}</p>
                                                    <p className="text-[10px] text-slate-500 uppercase">Scans</p>
                                                </div>
                                            </div>
                                            
                                            {/* Advanced Progress Bar */}
                                            <div className="relative h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                                <div 
                                                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                                                    style={{ width: `${progress}%` }}
                                                />
                                            </div>
                                            
                                            <div className="flex justify-between mt-2">
                                                <div className="flex gap-4">
                                                    <span className="text-[10px] text-slate-500">Impressions: <span className="text-slate-300">{stats.impressions}</span></span>
                                                    <span className="text-[10px] text-slate-500">Redeemed: <span className="text-slate-300">{stats.redemptions}</span></span>
                                                </div>
                                                <span className="text-xs font-bold text-blue-400">{stats.conversion.toFixed(1)}% Conv.</span>
                                            </div>
                                            
                                            {idx < campaignList.length - 1 && <div className="h-px bg-slate-800/50 mt-6" />}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Recent Activity List */}
                    <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-white/5 p-6 shadow-xl">
                         <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <Clock className="h-5 w-5 text-indigo-500" />
                                    Recent Activity
                                </h3>
                                <p className="text-sm text-slate-400">Real-time redemptions (Last 5)</p>
                            </div>
                        </div>

                         <div className="space-y-2">
                            {recentActivity.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-slate-500 text-sm">No recent activity.</p>
                                </div>
                            ) : (
                                recentActivity.map((activity, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/40 hover:bg-slate-800/80 transition-colors border border-transparent hover:border-slate-700 group">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                                                <CheckCircleIcon />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-white">
                                                    {activity.coupons?.code} <span className="text-slate-500 font-normal">redeemed</span>
                                                </p>
                                                <p className="text-xs text-slate-500">{activity.coupons?.campaigns?.name}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xs text-slate-400 font-mono bg-slate-900 px-2 py-1 rounded border border-slate-800">
                                                {new Date(activity.redeemed_at).toLocaleTimeString("en-IN", { hour: '2-digit', minute:'2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                         </div>
                    </div>
                </div>

                {/* RIGHT: Verify & Quick Insights (1 Col) */}
                <div className="space-y-6">
                    
                    {/* AISummary Card */}
                    <div className="animate-in slide-in-from-right-4 fade-in duration-700 delay-300">
                        <AISummaryCard 
                            conversionRate={conversionRateVal}
                            revenueTrend={revTrendEnum}
                            scansTrend={scansTrendEnum}
                            redemptionRate={redemptionRateVal}
                        />
                    </div>

                    {/* Verify Coupon */}
                    <div className="h-fit">
                        <CouponVerification />
                    </div>

                    {/* Quick Insights Card */}
                    <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-white/5 p-6 shadow-xl">
                        <div className="mb-4">
                            <h3 className="text-base font-bold text-white flex items-center gap-2">
                                <Zap className="h-4 w-4 text-amber-500" />
                                Quick Insights
                            </h3>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-800 flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-slate-400 uppercase tracking-wide">Best Campaign</p>
                                    <p className="text-sm font-bold text-white mt-1 truncate max-w-[150px]" title={bestCampaign?.name || 'N/A'}>{bestCampaign?.name || 'N/A'}</p>
                                </div>
                                <Trophy className="h-5 w-5 text-yellow-500" />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-800">
                                    <p className="text-[10px] text-slate-400 uppercase">Active</p>
                                    <p className="text-xl font-bold text-white mt-1">{activeCampaigns}</p>
                                </div>
                                <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-800">
                                    <p className="text-[10px] text-slate-400 uppercase">Total</p>
                                    <p className="text-xl font-bold text-white mt-1">{campaignList.length}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    </div>
  );
}

// Icon Helper
function CheckCircleIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
        </svg>
    )
}

