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
import GeneratedCouponsList from "@/components/dashboard/coupons/GeneratedCouponsList";

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

  // 2. Fetch Data from Views
  const [
      { data: summaryData },
      { data: recentActivityData },
      { data: weeklyScansData },
      { data: generatedCouponsData }
  ] = await Promise.all([
      supabase.from("client_campaign_summary").select("*").eq("client_id", client.id),
      supabase.from("client_recent_activity").select("*").eq("client_id", client.id).limit(5),
      supabase.from("client_weekly_scans").select("*").eq("client_id", client.id),
      supabase
        .from("client_coupons")
        .select("*")
        .eq("client_id", client.id)
        .order("generated_at", { ascending: false })
        .limit(50)
  ]);

  const campaigns = summaryData || [];
  const recentActivity = recentActivityData || [];
  const weeklyScans = weeklyScansData || [];
  const generatedCoupons = (generatedCouponsData as any[]) || [];

  // 3. Metrics Aggregation
  // Calculate totals from summary view
  let impressions = 0;
  let scans = 0; 
  let redemptions = 0;
  let revenue = 0; 

  // Weekly Graph Processing
  const last7Days = getLast7Days();
  const scansByDate: Record<string, number> = {};
  
  // Initialize with 0
  last7Days.forEach(d => {
    scansByDate[d] = 0;
  });

  // Fill from weeklyScans view
  weeklyScans.forEach((row: any) => {
      const dateStr = row.scan_date || row.date || row.day; 
      if (dateStr && scansByDate[dateStr] !== undefined) {
          scansByDate[dateStr] = row.scan_count || row.scans || row.count || 0;
      }
  });

  const scanChartData = last7Days.map(d => scansByDate[d]);

  // Derive Today/Yesterday from Chart Data
  // last7Days is [today-6, ..., Today] (Ascending Order)
  // So last element is Today. Second to last is Yesterday.
  
  const todayDateKey = last7Days[last7Days.length - 1];
  const yesterdayDateKey = last7Days[last7Days.length - 2];
  
  const todayScans = scansByDate[todayDateKey] || 0;
  const yesterdayScans = scansByDate[yesterdayDateKey] || 0;
  
  const todayRevenue = 0; // Not available in views
  const yesterdayRevenue = 0; // Not available in views
  
  const campaignList = campaigns; // Alias for compatibility with existing UI code
  
  // Weekly Labels (e.g., "Mon", "Tue")
  const weeklyLabels = last7Days.map(dateStr => {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-IN', { weekday: 'short' });
  });

  // Campaign Stats Processing
  const campaignStats: Record<string, any> = {};
  let uniqueUsers = 0;

  campaigns.forEach((c: any) => {
      impressions += (Number(c.total_bottles) || 0);
      redemptions += (Number(c.total_claims) || 0);
      uniqueUsers += (Number(c.unique_users) || 0);
      
      let health = 'Low';
      const conv = Number(c.conversion_rate) || 0;
      if (conv >= 25) health = 'High';
      else if (conv >= 10) health = 'Medium';

      campaignStats[c.id || c.campaign_id] = {
          impressions: Number(c.total_bottles) || 0,
          redemptions: Number(c.total_claims) || 0,
          conversion: conv,
          health,
          unique_users: Number(c.unique_users) || 0
      };
  });
  
  // Calculate Global Rates
  if (scans === 0 && campaigns.length > 0) {
      scans = campaigns.reduce((acc: number, c: any) => {
          const b = Number(c.total_bottles) || 0;
          const r = Number(c.conversion_rate) || 0;
          return acc + Math.round(b * (r / 100));
      }, 0);
  }

  const conversionRate = impressions > 0 ? ((scans / impressions) * 100).toFixed(1) + "%" : "0%";
  const redemptionRate = scans > 0 ? ((redemptions / scans) * 100).toFixed(1) + "%" : "0%";

  // Quick Insights
  const activeCampaigns = campaigns.filter((c: any) => c.status === 'active').length;
  // Sort by highest redemptions (claims) as proxy for "Best"
  const bestCampaign = [...campaigns].sort((a: any, b: any) => (Number(b.total_claims) || 0) - (Number(a.total_claims) || 0))[0];

  // Trends - Not available in views (would need yesterday's data).
  // We will set to "neutral" or hide.
  const scanTrendLabel = "View details"; 
  const scanTrendType = 'neutral';
  const revTrendLabel = "View details";
  const revTrendType = 'neutral';
  
  const revenueSparkData = last7Days.map(() => 0); // No daily revenue data

  // AI Summary Logic Prep
  const revTrendEnum = 'stable';
  const scansTrendEnum = todayScans > yesterdayScans ? 'up' : todayScans < yesterdayScans ? 'down' : 'stable';
  const conversionRateVal = impressions > 0 ? (scans / impressions) * 100 : 0;
  const redemptionRateVal = scans > 0 ? (redemptions / scans) * 100 : 0;

  // --- EMPTY STATE CHECK ---
  if (campaigns.length === 0) {
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <PremiumStatCard 
                    title="Impressions"
                    value={impressions}
                    iconType="impressions"
                    description="Total bottles generated"
                    delay={0}
                />
                <PremiumStatCard 
                    title="QR Scans"
                    value={scans}
                    iconType="scans"
                    description="Total redemptions"
                    delay={75}
                />
                <PremiumStatCard 
                    title="Unique Users"
                    value={uniqueUsers}
                    iconType="users"
                    description="Total customers"
                    delay={150}
                />
                 <PremiumStatCard 
                    title="Conversion Rate"
                    value={conversionRate}
                    iconType="conversion"
                    description="Redemption efficiency"
                    delay={225}
                />
                <PremiumStatCard 
                    title="Revenue Generated"
                    value={formatCurrency(revenue)}
                    iconType="revenue"
                    description="Revenue tracking soon"
                    type="revenue"
                    delay={300}
                />
            </div>
            


            {/* SPACER Divider */}
            <div className="border-t border-slate-800/50 my-8" />

            {/* --- 3. Main Content Area --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* LEFT: Campaign Permformance & Activity (2 Cols) */}
                <div className="lg:col-span-2 space-y-8">
                    
                    {/* Campaign Performance Card */}
                    <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-white/5 p-6 shadow-xl leading-relaxed">
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
                                {campaigns.slice(0, 5).map((campaign: any, idx: number) => {
                                    const stats = campaignStats[campaign.id || campaign.campaign_id];
                                    const progress = Math.min(stats.conversion, 100);
                                    
                                    // Health Color
                                    const healthColor = stats.health === 'High' ? 'text-emerald-400' 
                                        : stats.health === 'Medium' ? 'text-yellow-400'
                                        : 'text-red-400';

                                    return (
                                        <div key={campaign.id} className="group">
                                            <div className="mb-3">
                                                <div className="flex justify-between items-center mb-1">
                                                     <h4 className="text-white font-semibold text-base flex items-center gap-2">
                                                        {campaign.name || campaign.campaign_name}
                                                    </h4>
                                                     <span className={`text-[10px] px-2 py-0.5 rounded-full border border-slate-700 bg-slate-800/50 font-bold ${healthColor}`}>
                                                            {stats.health} Health
                                                    </span>
                                                </div>
                                                
                                                {/* Inline Metrics */}
                                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                                                    <span>Impressions: <span className="text-slate-200 font-mono">{stats.impressions}</span></span>
                                                    <span className="text-slate-700">|</span>
                                                    <span>Scans: <span className="text-slate-200 font-mono">{Number(campaign.total_claims) || 0}</span></span>
                                                    <span className="text-slate-700">|</span>
                                                    <span>Conversion: <span className="text-slate-200 font-mono">{stats.conversion.toFixed(1)}%</span></span>
                                                    <span className="text-slate-700">|</span>
                                                    <span>Users: <span className="text-slate-200 font-mono">{stats.unique_users}</span></span>
                                                </div>
                                            </div>
                                            
                                            {/* Advanced Progress Bar */}
                                            <div className="relative h-1.5 w-full bg-slate-800 rounded-full overflow-hidden opacity-80 group-hover:opacity-100 transition-opacity">
                                                <div 
                                                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full"
                                                    style={{ width: `${progress}%` }}
                                                />
                                            </div>
                                            
                                            {idx < campaigns.length - 1 && <div className="h-px bg-slate-800/50 mt-6" />}
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
                                recentActivity.map((activity: any, idx: number) => (
                                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/40 hover:bg-slate-800/80 transition-colors border border-transparent hover:border-slate-700 group">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                                                <CheckCircleIcon />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-white">
                                                    {activity.name} <span className="text-slate-500 font-normal">redeemed</span>
                                                </p>
                                                <p className="text-xs text-slate-500">{activity.campaign_name}</p>
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
                    
                    {/* Generated Coupons List */}
                    <GeneratedCouponsList coupons={generatedCoupons} />
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

            {/* SPACER Divider */}
            <div className="border-t border-slate-800/50 my-8" />

             {/* --- Weekly Scan Chart (Moved to Bottom) --- */}
            <div className="bg-slate-900/40 backdrop-blur-sm border-t border-b border-slate-800/50 py-6 -mx-6 px-6 md:mx-0 md:px-6 md:rounded-2xl md:border">
                <div className="flex flex-col items-center justify-center gap-6">
                     <div className="flex flex-col items-center text-center">
                        <div className="inline-flex items-center gap-2 mb-2">
                             <div className="p-1.5 bg-blue-500/10 rounded-lg text-blue-400">
                                <Activity className="h-4 w-4" />
                            </div>
                            <h3 className="text-sm font-semibold text-white">Scan Activity (Past 7 days)</h3>
                        </div>
                    </div>
                    <div className="w-full max-w-lg">
                        <MiniScanChart data={scanChartData} labels={weeklyLabels} />
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

