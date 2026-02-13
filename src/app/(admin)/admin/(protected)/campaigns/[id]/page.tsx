import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { 
  ArrowLeft, QrCode, ScanLine, Ticket, TrendingUp, 
  Calendar, Clock, Tag, Hash, Type, Percent, AlertCircle 
} from 'lucide-react';

interface PageProps {
  params: { id: string };
}

// FORMATTTER: UTC -> Update to show localized time
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
export default async function CampaignDetailsPage({ params }: PageProps) {
  const supabase = getSupabaseAdmin();
  const { id } = params;

  // PARALLEL DATA FETCHING
  // Using Promise.allSettled to handle potential failures in individual queries gracefully
  // This is especially important if schema for 'scanned' is inconsistent
  const [campaignRes, qrRes, scannedRes, redeemedRes] = await Promise.allSettled([
    supabase.from('campaigns').select('*').eq('id', id).single(),
    
    // 1. Expected Total QR
    supabase
        .from('bottles')
        .select('*', { count: 'exact', head: true })
        .eq('campaign_id', id),

    // 2. Total Scanned
    // Trying primary requirement: .not('scanned_at', 'is', null)
    // If this fails (e.g. column missing), we might get an error.
    // However, since I can't wrap a Supabase query definition in a try/catch easily without executing it,
    // I will rely on the fact that if it fails, the error will be in the result of allSettled.
    // AND I will provide a fallback query if the first one fails? No, that's too complex for one go.
    // I will use 'used_at' which I verified exists, to guarantee stability.
    // User asked for "If not available, count rows where used_at or similar exists."
    // I verified 'scanned_at' is NOT in the schema found earlier.
    supabase
        .from('bottles')
        .select('*', { count: 'exact', head: true })
        .eq('campaign_id', id)
        .not('used_at', 'is', null), 

    // 3. Total Redeemed
    supabase
        .from('coupons')
        .select('*', { count: 'exact', head: true })
        .eq('campaign_id', id),
  ]);

  // UNWRAP RESULTS
  const campaignData = campaignRes.status === 'fulfilled' ? campaignRes.value.data : null;
  
  if (!campaignData) {
    return notFound();
  }

  const campaign = campaignData;
  const totalQR = qrRes.status === 'fulfilled' ? qrRes.value.count || 0 : 0;
  const totalScanned = scannedRes.status === 'fulfilled' ? scannedRes.value.count || 0 : 0;
  const totalRedeemed = redeemedRes.status === 'fulfilled' ? redeemedRes.value.count || 0 : 0;

  // DERIVED METRICS
  const redemptionRate = totalQR > 0 ? ((totalRedeemed / totalQR) * 100).toFixed(1) : '0.0';
  const scanRate = totalQR > 0 ? ((totalScanned / totalQR) * 100).toFixed(1) : '0.0';

  // STATUS BADGE UTILS
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
    <div className="max-w-6xl mx-auto pb-12">
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
                    <span className="text-xs text-gray-400 font-mono flex items-center">
                        <Hash className="h-3 w-3 mr-1" /> {campaign.id}
                    </span>
                </div>
            </div>
             {/* Optional: Add Edit Button Here */}
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
                  title="Total Scanned" 
                  value={totalScanned.toLocaleString()} 
                  subtext="Verified Scans"
                  icon={ScanLine} 
                  colorClass="bg-purple-50 text-purple-600" 
              />
              <StatCard 
                  title="Total Redeemed" 
                  value={totalRedeemed.toLocaleString()} 
                  subtext="Coupons Issued"
                  icon={Ticket} 
                  colorClass="bg-orange-50 text-orange-600" 
              />
               <StatCard 
                  title="Redemption Rate" 
                  value={`${redemptionRate}%`} 
                  subtext={`of ${totalQR.toLocaleString()} QRs`}
                  icon={TrendingUp} 
                  colorClass="bg-green-50 text-green-600" 
              />
          </div>
          
          {/* Progress Bars */}
          <div className="mt-4 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
               <div className="mb-4">
                   <div className="flex justify-between text-sm mb-1">
                       <span className="text-gray-600">Scan Rate</span>
                       <span className="font-medium text-gray-900">{scanRate}%</span>
                   </div>
                   <div className="w-full bg-gray-100 rounded-full h-2">
                       <div 
                            className="bg-purple-500 h-2 rounded-full transition-all duration-500" 
                            style={{ width: `${Math.min(parseFloat(scanRate), 100)}%` }}
                       />
                   </div>
               </div>
               <div>
                   <div className="flex justify-between text-sm mb-1">
                       <span className="text-gray-600">Redemption Rate</span>
                       <span className="font-medium text-gray-900">{redemptionRate}%</span>
                   </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                       <div 
                            className="bg-green-500 h-2 rounded-full transition-all duration-500" 
                            style={{ width: `${Math.min(parseFloat(redemptionRate), 100)}%` }}
                       />
                   </div>
               </div>
          </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 3. COUPON CONFIGURATION */}
          <section className="lg:col-span-2">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Coupon Configuration</h2>
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
