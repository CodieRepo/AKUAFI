import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { ArrowLeft, ChevronRight } from 'lucide-react';

type Metrics = {
  campaign_id: string;
  campaign_name: string;
  total_qr: number;
  total_claims: number;
  unique_users: number;
  conversion_rate: number;
};

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-1 text-3xl font-bold text-gray-900">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
    </div>
  );
}

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: clientId } = await params;
  const supabase = getSupabaseAdmin();

  // 1. Client info
  const { data: clientData } = await supabase
    .from('clients')
    .select('client_name')
    .eq('id', clientId)
    .maybeSingle();

  if (!clientData) return notFound();

  // 2. Client-level stats from view
  const { data: dashRow } = await supabase
    .from('client_dashboard_v1')
    .select('*')
    .eq('client_id', clientId)
    .maybeSingle();

  const stats = {
    total_campaigns: Number(dashRow?.total_campaigns || 0),
    total_qr:        Number(dashRow?.total_qr        || 0),
    total_claims:    Number(dashRow?.total_claims    || 0),
    unique_users:    Number(dashRow?.unique_users    || 0),
    conversion_rate: Number(dashRow?.conversion_rate || 0),
  };

  // 3. Campaign list for this client from campaign_metrics_v1
  const { data: campaigns, error: campErr } = await supabase
    .from('campaign_metrics_v1')
    .select('campaign_id, campaign_name, total_qr, total_claims, unique_users, conversion_rate')
    .eq('client_id', clientId)
    .order('total_claims', { ascending: false });

  if (campErr) console.error('[ClientDetail] campaigns error:', campErr);

  const campaignList: Metrics[] = (campaigns || []).map(c => ({
    campaign_id:     c.campaign_id,
    campaign_name:   c.campaign_name,
    total_qr:        Number(c.total_qr        || 0),
    total_claims:    Number(c.total_claims    || 0),
    unique_users:    Number(c.unique_users    || 0),
    conversion_rate: Number(c.conversion_rate || 0),
  }));

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/admin/dashboard"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">{clientData.client_name}</h1>
        <p className="text-sm text-gray-500 mt-1">Client analytics overview</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Campaigns"    value={stats.total_campaigns} />
        <StatCard label="QR Generated" value={stats.total_qr} />
        <StatCard label="Claims"       value={stats.total_claims} />
        <StatCard label="Unique Users" value={stats.unique_users} />
        <StatCard label="Conversion"   value={`${stats.conversion_rate.toFixed(1)}%`} />
      </div>

      {/* Campaigns Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Campaigns</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider">Campaign Name</th>
                <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider">QR Generated</th>
                <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider">Claims</th>
                <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider">Unique Users</th>
                <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider">Conversion</th>
                <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {campaignList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-gray-400">
                    No campaigns found for this client.
                  </td>
                </tr>
              ) : (
                campaignList.map(c => (
                  <tr key={c.campaign_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-gray-900">{c.campaign_name}</td>
                    <td className="px-6 py-4 text-gray-600">{c.total_qr.toLocaleString()}</td>
                    <td className="px-6 py-4 text-gray-600">{c.total_claims.toLocaleString()}</td>
                    <td className="px-6 py-4 text-gray-600">{c.unique_users.toLocaleString()}</td>
                    <td className="px-6 py-4 text-gray-600">{c.conversion_rate.toFixed(1)}%</td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/campaign/${c.campaign_id}`}
                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        View <ChevronRight className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
