import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { 
  Calendar, 
  QrCode, 
  TrendingUp, 
  Eye, 
  Percent, 
  CheckCircle, 
  IndianRupee, 
  Activity,
  ArrowUpRight,
  Clock
} from "lucide-react";

// FORMATTER: UTC -> IST Display Only
function formatIST(dateString: string) {
    if (!dateString) return '-';
    // Handle ISO strings that might be missing timezone info, assume UTC if not specified? 
    // Supabase returns ISO usually.
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
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-4">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-full mb-4">
            <TrendingUp className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Account Not Linked</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-md">
          Your account is active, but it hasn't been linked to a client profile yet. Please contact your administrator.
        </p>
      </div>
    );
  }

  // 2. Fetch Campaigns
  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("id, name, created_at, status, start_date, end_date")
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
      // A. Impressions (Total Bottles)
      supabase.from("bottles")
        .select('*', { count: 'exact', head: true })
        .in('campaign_id', campaignIds),
      
      // B. Scans (Total Coupons Generated)
      supabase.from("coupons")
        .select('*', { count: 'exact', head: true })
        .in('campaign_id', campaignIds),

      // C. Revenue & Redemptions (Status = redeemed)
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
        .in('coupons.campaign_id', campaignIds) // Filter by campaigns
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
  const conversionRate = impressions > 0 ? ((scans / impressions) * 100).toFixed(1) : "0.0";
  const redemptionRate = scans > 0 ? ((redemptions / scans) * 100).toFixed(1) : "0.0";


  return (
    <div className="space-y-8 animate-in fade-in duration-500 p-6 md:p-8 max-w-7xl mx-auto">
      
      {/* --- Top Section --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            Dashboard
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-lg">
             Welcome back, <span className="font-medium text-gray-900 dark:text-gray-200">{client.client_name}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 bg-white dark:bg-gray-800 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm">
             <Calendar className="h-4 w-4" />
             <span>{new Date().toLocaleDateString("en-IN", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>

      {/* --- Metrics Grid --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        
        {/* Card 1: Impressions */}
        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 shadow-sm rounded-xl p-5 hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Eye className="h-16 w-16 text-blue-600" />
            </div>
            <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg text-blue-600 dark:text-blue-400">
                    <Eye className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300">Impressions</h3>
            </div>
            <div className="space-y-1">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{impressions.toLocaleString()}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Bottles in active campaigns</p>
            </div>
        </div>

        {/* Card 2: QR Scans */}
        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 shadow-sm rounded-xl p-5 hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <QrCode className="h-16 w-16 text-purple-600" />
            </div>
             <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/40 rounded-lg text-purple-600 dark:text-purple-400">
                    <QrCode className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300">QR Scans</h3>
            </div>
            <div className="space-y-1">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{scans.toLocaleString()}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Total coupons generated</p>
            </div>
        </div>

        {/* Card 3: Conversion Rate */}
        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 shadow-sm rounded-xl p-5 hover:shadow-md transition-shadow relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Percent className="h-16 w-16 text-indigo-600" />
            </div>
             <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg text-indigo-600 dark:text-indigo-400">
                    <Activity className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300">Conversion</h3>
            </div>
            <div className="space-y-1">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{conversionRate}%</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Scans vs Impressions</p>
            </div>
        </div>

        {/* Card 4: Redemption Rate */}
         <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 shadow-sm rounded-xl p-5 hover:shadow-md transition-shadow relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <CheckCircle className="h-16 w-16 text-green-600" />
            </div>
             <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/40 rounded-lg text-green-600 dark:text-green-400">
                    <CheckCircle className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300">Redemption %</h3>
            </div>
            <div className="space-y-1">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{redemptionRate}%</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{redemptions.toLocaleString()} redeemed</p>
            </div>
        </div>

        {/* Card 5: Revenue */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg rounded-xl p-5 hover:shadow-xl transition-shadow relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-30 transition-opacity">
                <IndianRupee className="h-16 w-16 text-white" />
            </div>
             <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-white/20 rounded-lg text-white">
                    <IndianRupee className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-semibold text-blue-100">Revenue</h3>
            </div>
            <div className="space-y-1">
                <p className="text-2xl font-bold text-white">{formatCurrency(revenue)}</p>
                <p className="text-xs text-blue-100/80">Value from redemptions</p>
            </div>
        </div>
      </div>

      {/* --- Main Content Grid --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Campaign List (2 cols wide) */}
        <div className="lg:col-span-2 space-y-4">
             <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-gray-500" />
                    Campaign Performance
                </h2>
             </div>
             
             {campaignList.length === 0 ? (
                 <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
                     <div className="bg-gray-50 dark:bg-gray-900/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                         <QrCode className="h-8 w-8 text-gray-400" />
                     </div>
                     <h3 className="text-lg font-medium text-gray-900 dark:text-white">No campaigns yet</h3>
                     <p className="text-gray-500 dark:text-gray-400 mt-1">
                         You haven't launched any campaigns yet.
                     </p>
                 </div>
             ) : (
                 <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                     <div className="overflow-x-auto">
                         <table className="w-full text-left text-sm">
                             <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400">
                                 <tr>
                                     <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Campaign</th>
                                     <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Created</th>
                                     <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Validity</th>
                                     <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Status</th>
                                 </tr>
                             </thead>
                             <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                                 {campaignList.map((campaign) => (
                                     <tr key={campaign.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-colors">
                                         <td className="px-6 py-4">
                                             <span className="font-semibold text-gray-900 dark:text-white">{campaign.name}</span>
                                         </td>
                                         <td className="px-6 py-4 text-gray-600 dark:text-gray-400 text-xs">
                                             {formatIST(campaign.created_at)}
                                         </td>
                                          <td className="px-6 py-4 text-gray-600 dark:text-gray-400 text-xs">
                                             <div className="flex flex-col">
                                                <span>{new Date(campaign.start_date).toLocaleDateString()}</span>
                                                <span className="text-gray-400">to</span>
                                                <span>{new Date(campaign.end_date).toLocaleDateString()}</span>
                                             </div>
                                         </td>
                                         <td className="px-6 py-4">
                                             <span className={`
                                                inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize border
                                                ${campaign.status === 'active' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800' : ''}
                                                ${campaign.status === 'paused' ? 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800' : ''}
                                                ${campaign.status === 'completed' ? 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700' : ''}
                                                ${!campaign.status || campaign.status === 'draft' ? 'bg-gray-50 text-gray-600 border-gray-200' : ''}
                                             `}>
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

        {/* Right Column: Recent Activity (1 col wide) */}
        <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Clock className="h-5 w-5 text-gray-500" />
                Recent Activity
            </h2>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4 h-full max-h-[500px] overflow-y-auto">
                {recentActivity.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-sm">
                        No recent activity found.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {recentActivity.map((activity, idx) => (
                            <div key={idx} className="flex items-start gap-3 pb-3 border-b border-gray-100 dark:border-gray-700/50 last:border-0 last:pb-0">
                                <div className="mt-1 h-8 w-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                                    <ArrowUpRight className="h-4 w-4 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                        Coupon Redeemed
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                        Campaign: {activity.coupons?.campaigns?.name}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                         <span className="text-xs font-mono bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-300">
                                            {activity.coupons?.code}
                                         </span>
                                         <span className="text-[10px] text-gray-400">
                                            {new Date(activity.redeemed_at).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })}
                                         </span>
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
  );
}
