import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { ArrowLeft } from 'lucide-react';
import DeleteCampaignButton from '@/components/admin/campaign/DeleteCampaignButton';

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function StatCard({
  title, value, subtext,
}: { title: string; value: string | number; subtext?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
    </div>
  );
}

export default async function CampaignDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const campaignId = id?.trim();
  const supabase = getSupabaseAdmin();

  console.log('[CampaignDetail] ID:', campaignId);

  const [campaignRes, metricsRes, usersRes, discountRes] = await Promise.all([
    supabase.from('campaigns').select('*').eq('id', campaignId).maybeSingle(),
    supabase.from('campaign_metrics_v1').select('*').eq('campaign_id', campaignId).maybeSingle(),
    // Issue 1: No status filter — unique users counted from ALL coupons rows (active + claimed)
    supabase
      .from('campaign_user_details_v1')
      .select('user_name, phone, coupon_code, discount_value, status, redeemed_at')
      .eq('campaign_id', campaignId)
      .order('redeemed_at', { ascending: false })
      .limit(100),
    // Total discount issued (claimed coupons only = verified spend)
    supabase
      .from('coupons')
      .select('discount_value, status')
      .eq('campaign_id', campaignId),
  ]);

  if (metricsRes.error) console.error('[CampaignDetail] metrics error:', metricsRes.error);
  if (usersRes.error)   console.error('[CampaignDetail] users error:',   usersRes.error);

  if (!campaignRes.data) {
    console.error('[CampaignDetail] not found:', campaignId);
    return notFound();
  }

  const campaign = campaignRes.data;
  const metrics = {
    total_qr:        Number(metricsRes.data?.total_qr        || 0),
    total_claims:    Number(metricsRes.data?.total_claims    || 0),
    // Unique users: count distinct users from ALL coupon rows (not just claimed)
    unique_users:    Number(metricsRes.data?.unique_users    || 0),
    conversion_rate: Number(metricsRes.data?.conversion_rate || 0),
  };
  const users = usersRes.data || [];

  // Discount aggregations from coupons table
  const allCoupons = discountRes.data || [];
  const totalDiscountIssued = allCoupons.reduce((sum: number, c: any) => sum + Number(c.discount_value || 0), 0);
  const claimedDiscountIssued = allCoupons
    .filter((c: any) => c.status === 'claimed')
    .reduce((sum: number, c: any) => sum + Number(c.discount_value || 0), 0);
  const avgDiscount = allCoupons.length > 0
    ? Math.round(totalDiscountIssued / allCoupons.length) : 0;

  // Analytics metrics
  const impressions = allCoupons.length; // Total coupons generated (all statuses)
  const claimedCount = allCoupons.filter((c: any) => c.status === 'claimed').length;
  const minimumOrderValue = Number(campaign.minimum_order_value || 0);
  // Estimated Revenue: claimed coupons × minimum order value
  const estimatedRevenueByMOV = claimedCount * minimumOrderValue;

  console.log('[CampaignDetail] metrics:', metrics);
  console.log('[CampaignDetail] users count:', users.length);

  const statusColor: Record<string, string> = {
    active:    'bg-green-100 text-green-700',
    paused:    'bg-orange-100 text-orange-700',
    expired:   'bg-red-100 text-red-700',
    completed: 'bg-gray-100 text-gray-700',
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/admin/campaigns"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Campaigns
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{campaign.name}</h1>
            <span
              className={`inline-block mt-2 px-2.5 py-0.5 rounded-full text-xs font-medium uppercase ${
                statusColor[campaign.status] || 'bg-gray-100 text-gray-700'
              }`}
            >
              {campaign.status}
            </span>
          </div>
          <DeleteCampaignButton campaignId={campaign.id} campaignName={campaign.name} />
        </div>
      </div>

      {/* Performance Stat Cards */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total QR Generated"     value={metrics.total_qr} />
          <StatCard title="Total Claims"            value={metrics.total_claims} subtext="Verified (Mark as Claimed)" />
          <StatCard title="Unique Users"            value={metrics.unique_users} subtext="From coupon creation" />
          <StatCard title="Conversion"              value={`${metrics.conversion_rate.toFixed(1)}%`} subtext="Claim rate" />
        </div>

        {/* Discount stat row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
          <StatCard title="Total Discount Issued"   value={`₹${totalDiscountIssued.toLocaleString()}`} subtext="Across all coupons" />
          <StatCard title="Estimated Revenue Impact" value={`₹${claimedDiscountIssued.toLocaleString()}`} subtext="Claimed coupons only" />
          <StatCard title="Avg Discount per Coupon" value={`₹${avgDiscount}`} subtext={`Across ${allCoupons.length} coupons`} />
        </div>

        {/* Analytics row: Impressions · MOV · Revenue by MOV */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
          <StatCard title="Impressions" value={impressions} subtext="Total coupons generated" />
          <StatCard
            title="Minimum Order Value"
            value={minimumOrderValue > 0 ? `₹${minimumOrderValue.toLocaleString()}` : '— Not set'}
            subtext={minimumOrderValue > 0 ? 'Per order for revenue calc' : 'Set in Client Settings'}
          />
          <StatCard
            title="Estimated Revenue Impact (MOV)"
            value={minimumOrderValue > 0 ? `₹${estimatedRevenueByMOV.toLocaleString()}` : '₹0'}
            subtext={minimumOrderValue > 0 ? `${claimedCount} claimed × ₹${minimumOrderValue}` : 'Set minimum order value to calculate'}
          />
        </div>

        {/* Progress bar */}
        <div className="mt-4 bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">Claim Rate</span>
            <span className="font-medium text-gray-900">{metrics.conversion_rate.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all"
              style={{ width: `${Math.min(metrics.conversion_rate, 100)}%` }}
            />
          </div>
        </div>
      </section>

      {/* Campaign User Details Table */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Campaign Users
          <span className="ml-2 text-sm font-normal text-gray-400">(all coupon holders — active &amp; claimed)</span>
        </h2>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider">User Name</th>
                  <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider">Coupon Code</th>
                  <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider">Discount</th>
                  <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-gray-400">
                      No users yet — they appear as soon as a coupon is generated.
                    </td>
                  </tr>
                ) : (
                  users.map((u: any, i: number) => (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{u.user_name || '—'}</td>
                      <td className="px-6 py-4 text-gray-500">{u.phone || '—'}</td>
                      <td className="px-6 py-4 font-mono text-xs">
                        <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded">
                          {u.coupon_code || '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-emerald-700">
                        {u.discount_value != null ? `₹${u.discount_value}` : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                          u.status === 'claimed' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                        }`}>{u.status || 'active'}</span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                        {formatDate(u.redeemed_at || u.generated_at)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
