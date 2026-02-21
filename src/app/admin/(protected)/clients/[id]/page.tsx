import { notFound } from "next/navigation";
import Link from "next/link";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { ArrowLeft, ChevronRight } from "lucide-react";

interface Campaign {
  id: string;
  minimum_order_value: number | null;
}

interface ClaimedCoupon {
  campaign_id: string;
}

interface CampaignMetric {
  campaign_id: string;
  campaign_name: string;
  total_qr: number;
  total_claims: number;
  unique_users: number;
  conversion_rate: number;
}

type Metrics = {
  campaign_id: string;
  campaign_name: string;
  total_qr: number;
  total_claims: number;
  unique_users: number;
  conversion_rate: number;
};

function StatCard({
  label,
  value,
  subtext,
}: {
  label: string;
  value: string | number;
  subtext?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-1 text-3xl font-bold text-gray-900">
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
      {subtext ? <p className="mt-2 text-[10px] text-gray-400">{subtext}</p> : null}
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
    .from("clients")
    .select("client_name")
    .eq("id", clientId)
    .maybeSingle();

  if (!clientData) return notFound();

  // 2. Step A â€” parallel fetch: dashboard summary + campaign metrics + campaign MOV
  const [{ data: dashRow }, { data: campaigns }, { data: campaignsWithMOV }] =
    await Promise.all([
      supabase
        .from("client_dashboard_v1")
        .select("*")
        .eq("client_id", clientId)
        .maybeSingle(),

      supabase
        .from("campaign_metrics_v1")
        .select(
          "campaign_id, campaign_name, total_qr, total_claims, unique_users, conversion_rate",
        )
        .eq("client_id", clientId)
        .order("total_claims", { ascending: false }),

      // MOV from base campaigns table (read-only, no write)
      supabase
        .from("campaigns")
        .select("id, minimum_order_value")
        .eq("client_id", clientId),
    ]);

  const stats = {
    total_campaigns: Number(dashRow?.total_campaigns || 0),
    total_qr: Number(dashRow?.total_qr || 0),
    total_claims: Number(dashRow?.total_claims || 0),
    unique_users: Number(dashRow?.unique_users || 0),
    conversion_rate: Number(dashRow?.conversion_rate || 0),
  };

  // Build MOV map: campaign_id â†’ minimum_order_value
  const movMap = new Map<string, number>(
    (campaignsWithMOV || []).map((c: Campaign) => [
      c.id,
      Number(c.minimum_order_value || 0),
    ]),
  );
  const campaignIds = (campaignsWithMOV || []).map(
    (c: Campaign) => c.id as string,
  );

  // 3. Step B â€” fetch claimed coupons per campaign (only run if we have campaign IDs)
  const claimedCountMap = new Map<string, number>();
  if (campaignIds.length > 0) {
    const { data: claimedCoupons } = await supabase
      .from("coupons")
      .select("campaign_id")
      .eq("status", "claimed")
      .in("campaign_id", campaignIds);

    for (const coupon of (claimedCoupons || []) as ClaimedCoupon[]) {
      const prev = claimedCountMap.get(coupon.campaign_id) || 0;
      claimedCountMap.set(coupon.campaign_id, prev + 1);
    }
  }

  const campaignList: (Metrics & { estimated_revenue: number })[] = (
    campaigns || []
  ).map((c: CampaignMetric) => {
    const claimed = claimedCountMap.get(c.campaign_id) || 0;
    const mov = movMap.get(c.campaign_id) || 0;
    return {
      campaign_id: c.campaign_id,
      campaign_name: c.campaign_name,
      total_qr: Number(c.total_qr || 0),
      total_claims: Number(c.total_claims || 0),
      unique_users: Number(c.unique_users || 0),
      conversion_rate: Number(c.conversion_rate || 0),
      estimated_revenue: claimed * mov,
    };
  });

  // Total Estimated Revenue = sum of the per-campaign estimated revenue values shown in the table
  const totalEstimatedRevenue = campaignList.reduce(
    (sum, campaign) => sum + campaign.estimated_revenue,
    0,
  );

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
        <h1 className="text-3xl font-bold text-gray-900">
          {clientData.client_name}
        </h1>
        <p className="text-sm text-gray-500 mt-1">Client analytics overview</p>
      </div>

      {/* Stat Cards â€” 6 card grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          label="Campaigns"
          value={stats.total_campaigns}
          subtext="Total campaigns for this client"
        />
        <StatCard
          label="QR Generated"
          value={stats.total_qr}
          subtext="Total campaign impressions"
        />
        <StatCard
          label="Claims"
          value={stats.total_claims}
          subtext="Successful coupon claims"
        />
        <StatCard
          label="Unique Users"
          value={stats.unique_users}
          subtext="Distinct claiming users"
        />
        <StatCard
          label="Conversion"
          value={`${stats.conversion_rate.toFixed(1)}%`}
          subtext="Claims as percentage of QR generated"
        />
        {/* Total Estimated Revenue — sum of per-campaign estimated revenue values */}
        <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-6 shadow-sm">
          <p className="text-sm font-medium text-emerald-700">
            Total Estimated Revenue
          </p>
          <p className="mt-1 text-3xl font-bold text-emerald-800">
            â‚¹{totalEstimatedRevenue.toLocaleString()}
          </p>
          <p className="text-xs text-emerald-600 mt-1">
            Aggregated across all active campaigns.
          </p>
        </div>
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
                <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider">
                  Campaign Name
                </th>
                <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider">
                  QR Generated
                </th>
                <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider">
                  Claims
                </th>
                <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider">
                  Unique Users
                </th>
                <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider">
                  Conversion
                </th>
                <th
                  className="px-6 py-3 font-medium text-xs uppercase tracking-wider"
                  title="Per-campaign estimated revenue"
                >
                  Est. Revenue
                </th>
                <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {campaignList.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-10 text-center text-gray-400"
                  >
                    No campaigns found for this client.
                  </td>
                </tr>
              ) : (
                campaignList.map((c) => (
                  <tr
                    key={c.campaign_id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      {c.campaign_name}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {c.total_qr.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {c.total_claims.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {c.unique_users.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {c.conversion_rate.toFixed(1)}%
                    </td>
                    <td className="px-6 py-4">
                      {c.estimated_revenue > 0 ? (
                        <div className="flex flex-col gap-1">
                          <span className="font-semibold text-emerald-700">
                            â‚¹{c.estimated_revenue.toLocaleString()}
                          </span>
                          <span className="inline-flex w-fit px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700">
                            MOV set
                          </span>
                        </div>
                      ) : (
                        <span className="inline-flex w-fit px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700">
                          Config missing
                        </span>
                      )}
                    </td>
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



