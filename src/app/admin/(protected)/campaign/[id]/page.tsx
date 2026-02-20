import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { 
  ArrowLeft, QrCode, ScanLine, Ticket, TrendingUp, 
  Tag, Hash, Type, Percent, Users
} from 'lucide-react';
import DeleteCampaignButton from '@/components/admin/campaign/DeleteCampaignButton';



// FORMATTER: UTC -> Update to show localized time
function formatDate(dateStr: string | null) {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function StatCard({ title, value, subtext, icon: Icon, colorClass }: any) {
    return (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-start justify-between">
            <div>
                <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
                <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
                {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
            </div>
            <div className={`p-3 rounded-lg ${colorClass}`}>
                <Icon className="h-5 w-5" />
            </div>
        </div>
    );
}

function ConfigItem({ label, value, icon: Icon }: any) {
    return (
        <div className="flex items-center p-4 bg-gray-50 rounded-lg border border-gray-100">
            <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center text-gray-400 shadow-sm mr-4 border border-gray-100">
                <Icon className="h-5 w-5" />
            </div>
            <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
                <p className="text-sm font-semibold text-gray-900">{value || '-'}</p>
            </div>
        </div>
    );
}

// MAIN COMPONENT
export default async function CampaignDetailsPage(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const campaignId = id?.trim();
  const supabase = getSupabaseAdmin();
  
  console.log("Campaign page rendering with ID:", campaignId); // DEBUG LOG

  // Use Promise.all for parallel fetching
  const [
    campaignRes,
    metricsRes,
    usersRes
  ] = await Promise.all([
    // 1. Campaign Details
    supabase.from('campaigns').select('*').eq('id', campaignId).maybeSingle(),
    
    // 2. Metrics from View
    supabase.from('campaign_metrics_v1').select('*').eq('campaign_id', campaignId).maybeSingle(),

    // 3. Recent Users Details
    supabase.from('campaign_user_details_v1')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('redeemed_at', { ascending: false })
        .limit(50) // Reasonable limit
  ]);

  if (campaignRes.error) {
    console.error("Campaign fetch error:", campaignRes.error);
  }

  if (!campaignRes.data) {
    console.error("Campaign not found for ID:", campaignId);
    return notFound();
  }

  const campaign = campaignRes.data;
  const metrics = metricsRes.data || { total_qr: 0, total_claims: 0, unique_users: 0, conversion_rate: 0 };
  const users = usersRes.data || [];

  const totalQR = metrics.total_qr;
  const totalClaims = metrics.total_claims;
  const uniqueUsers = metrics.unique_users;
  const progressPercent = Number(metrics.conversion_rate).toFixed(1);

  const getStatusColor = (status: string) => {
    switch (status) {
        case 'active': return 'bg-green-100 text-green-700 border-green-200';
        case 'paused': return 'bg-orange-50 text-orange-700 border-orange-200';
        case 'expired': return 'bg-red-50 text-red-700 border-red-200';
        case 'completed': return 'bg-gray-100 text-gray-700 border-gray-200';
        default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-12 px-4 sm:px-6 lg:px-8 py-8">
      {/* 1. HEADER */}
      <div className="mb-8">
        <Link 
            href="/admin/campaigns" 
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 mb-4 transition-colors"
        >
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Campaigns
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">{campaign.name}</h1>
                <div className="flex items-center gap-3 mt-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border uppercase ${getStatusColor(campaign.status)}`}>
                        {campaign.status}
                    </span>
                    {/* Hiding UUID as requested */}
                    {/* <span className="text-xs text-gray-400 font-mono flex items-center">
                        <Hash className="h-3 w-3 mr-1" /> {campaign.id}
                    </span> */}
                </div>
            </div>
            <DeleteCampaignButton campaignId={campaign.id} campaignName={campaign.name} />
        </div>
      </div>

      {/* 2. ANALYTICS GRID */}
      <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard 
                  title="Total QR Generated" 
                  value={totalQR.toLocaleString()} 
                  icon={QrCode} 
                  colorClass="bg-blue-50 text-blue-600" 
              />
              <StatCard 
                  title="Total Claims" 
                  value={totalClaims.toLocaleString()} 
                  subtext="Verified Claims"
                  icon={Ticket} 
                  colorClass="bg-orange-50 text-orange-600" 
              />
              <StatCard 
                  title="Unique Users" 
                  value={uniqueUsers.toLocaleString()} 
                  subtext="Distinct Participants"
                  icon={Users} 
                  colorClass="bg-purple-50 text-purple-600" 
              />
               <StatCard 
                  title="Conversion" 
                  value={`${progressPercent}%`} 
                  subtext={`Claim Rate`}
                  icon={TrendingUp} 
                  colorClass="bg-green-50 text-green-600" 
              />
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
               <div className="mb-4">
                   <div className="flex justify-between text-sm mb-1">
                       <span className="text-gray-600">Campaign Progress</span>
                       <span className="font-medium text-gray-900">{progressPercent}%</span>
                   </div>
                   <div className="w-full bg-gray-100 rounded-full h-2">
                       <div 
                            className="bg-green-600 h-2 rounded-full transition-all duration-500" 
                            style={{ width: `${Math.min(parseFloat(progressPercent), 100)}%` }}
                       />
                   </div>
               </div>
          </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 3. COUPON CONFIGURATION */}
          <section className="lg:col-span-2">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Details & Configuration</h2>
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <ConfigItem 
                          label="Prefix" 
                          value={campaign.coupon_prefix} 
                          icon={Tag} 
                      />
                      <ConfigItem 
                          label="Length" 
                          value={`${campaign.coupon_length || 6} chars`} 
                          icon={Hash} 
                      />
                      <ConfigItem 
                          label="Type" 
                          value={campaign.coupon_type} 
                          icon={Type} 
                      />
                       <ConfigItem 
                          label="Value Range" 
                          value={`₹${campaign.coupon_min_value || 0} - ₹${campaign.coupon_max_value || 0}`} 
                          icon={Percent} 
                      />
                  </div>
                  {campaign.description && (
                    <div className="mt-6 pt-6 border-t border-gray-100">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Description</h4>
                        <p className="text-sm text-gray-600 leading-relaxed">{campaign.description}</p>
                    </div>
                  )}
              </div>

               {/* 5. USER ACTIVITY TABLE */}
               <div className="mt-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Claims</h3>
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coupon</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Claimed At</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {users.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500">
                                            No claims yet.
                                        </td>
                                    </tr>
                                ) : (
                                    users.map((u: any, i: number) => (
                                        <tr key={i} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{u.user_name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.phone}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                                                <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded text-xs">{u.coupon_code}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(u.redeemed_at)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                  </div>
              </div>
          </section>

          {/* 4. TIMELINE */}
          <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h2>
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
                  <div className="relative border-l-2 border-gray-100 pl-4 ml-2 space-y-6">
                      <div className="relative">
                          <span className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-green-500 ring-4 ring-white"></span>
                          <p className="text-xs text-gray-500 uppercase">Start Date</p>
                          <p className="text-sm font-medium text-gray-900">{formatDate(campaign.start_date)}</p>
                      </div>
                      <div className="relative">
                          <span className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-gray-300 ring-4 ring-white"></span>
                          <p className="text-xs text-gray-500 uppercase">End Date</p>
                          <p className="text-sm font-medium text-gray-900">{formatDate(campaign.end_date)}</p>
                      </div>
                      <div className="relative">
                          <span className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-blue-200 ring-4 ring-white"></span>
                          <p className="text-xs text-gray-500 uppercase">Created On</p>
                          <p className="text-sm font-medium text-gray-900">{formatDate(campaign.created_at)}</p>
                      </div>
                  </div>
              </div>
          </section>
      </div>

    </div>
  );
}
