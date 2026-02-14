import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Calendar, QrCode, TrendingUp } from "lucide-react";

// FORMATTER: UTC -> IST Display Only
function formatIST(dateString: string) {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      dateStyle: "medium",
    //   timeStyle: "short" 
    });
}

export default async function ClientDashboard() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  // 1. Fetch Client Details
  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("id, client_name")
    .eq("user_id", user.id)
    .single(); // .single() is appropriate here as one user should map to one client

  if (clientError || !client) {
    // Edge case: User has 'client' role but no record in clients table
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

  // 2. Fetch Campaigns (STRICT ISOLATION)
  // Must use client.id to filter.
  const { data: campaigns, error: campaignError } = await supabase
    .from("campaigns")
    .select("id, name, created_at, status, start_date, end_date")
    .eq("client_id", client.id) // <--- CRITICAL: STRICT FILTER
    .order("created_at", { ascending: false });

  if (campaignError) {
      console.error("Error fetching campaigns:", campaignError);
      return (
          <div className="p-4 rounded-lg bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400">
              Failed to load campaigns. Please try again later.
          </div>
      );
  }

  const campaignList = campaigns || [];
  const totalCampaigns = campaignList.length;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            Dashboard
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-lg">
             Welcome back, <span className="font-medium text-gray-900 dark:text-gray-200">{client.client_name}</span>
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-3">
             <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-md">
                <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
             </div>
             <div>
                 <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">Total Campaigns</p>
                 <p className="text-xl font-bold text-gray-900 dark:text-white">{totalCampaigns}</p>
             </div>
        </div>
      </div>

      {/* Campaign List */}
      <div>
         <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <QrCode className="h-5 w-5 text-gray-500" />
            Your Campaigns
         </h2>
         
         {campaignList.length === 0 ? (
             <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
                 <div className="bg-gray-50 dark:bg-gray-900/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                     <QrCode className="h-8 w-8 text-gray-400" />
                 </div>
                 <h3 className="text-lg font-medium text-gray-900 dark:text-white">No campaigns yet</h3>
                 <p className="text-gray-500 dark:text-gray-400 mt-1">
                     You haven't launched any campaigns yet. Contact your admin to get started.
                 </p>
             </div>
         ) : (
             <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                 <div className="overflow-x-auto">
                     <table className="w-full text-left text-sm">
                         <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400">
                             <tr>
                                 <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Campaign Name</th>
                                 <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Date Created</th>
                                 <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Duration</th>
                                 <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Status</th>
                             </tr>
                         </thead>
                         <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                             {campaignList.map((campaign) => (
                                 <tr key={campaign.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-colors">
                                     <td className="px-6 py-4">
                                         <span className="font-medium text-gray-900 dark:text-white">{campaign.name}</span>
                                     </td>
                                     <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                                         <div className="flex items-center gap-2">
                                             <Calendar className="h-3.5 w-3.5" />
                                             {formatIST(campaign.created_at)}
                                         </div>
                                     </td>
                                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400 text-xs">
                                         <div>{formatIST(campaign.start_date)} -</div>
                                         <div>{formatIST(campaign.end_date)}</div>
                                     </td>
                                     <td className="px-6 py-4">
                                         <span className={`
                                            inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                                            ${campaign.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : ''}
                                            ${campaign.status === 'paused' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' : ''}
                                            ${campaign.status === 'completed' ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400' : ''}
                                            ${!campaign.status || campaign.status === 'draft' ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400' : ''}
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
    </div>
  );
}
