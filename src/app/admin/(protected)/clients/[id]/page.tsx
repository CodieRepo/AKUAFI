import { notFound } from "next/navigation";
import Link from "next/link";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import {
  ArrowLeft,
  Building2,
  Megaphone,
  QrCode,
  Ticket,
  UserCheck,
  TrendingUp,
  DollarSign,
} from "lucide-react";
import { AdminCard } from "@/components/admin/ui/AdminCard";
import { AdminStatCard } from "@/components/admin/ui/AdminStatCard";
import {
  AdminTable,
  AdminTableHeader,
  AdminTableBody,
  AdminTableRow,
  AdminTableCell,
  AdminTableHeadCell,
} from "@/components/admin/ui/AdminTable";
import { AdminBadge } from "@/components/admin/ui/AdminBadge";

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

function formatINR(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
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
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/admin/dashboard"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white mb-4 transition-colors font-medium"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Dashboard
        </Link>
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <Building2 className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {clientData.client_name}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Client analytics overview
            </p>
          </div>
        </div>
      </div>

      {/* Stat Cards â€” 6 card grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <AdminStatCard
          label="Campaigns"
          value={stats.total_campaigns}
          icon={<Megaphone className="h-5 w-5" strokeWidth={2.5} />}
          iconColor="text-purple-600 dark:text-purple-400"
          description="Total campaigns for this client"
        />
        <AdminStatCard
          label="QR Generated"
          value={stats.total_qr}
          icon={<QrCode className="h-5 w-5" strokeWidth={2.5} />}
          iconColor="text-blue-600 dark:text-blue-400"
          description="Total campaign impressions"
        />
        <AdminStatCard
          label="Claims"
          value={stats.total_claims}
          icon={<Ticket className="h-5 w-5" strokeWidth={2.5} />}
          iconColor="text-green-600 dark:text-green-400"
          description="Successful coupon claims"
        />
        <AdminStatCard
          label="Unique Users"
          value={stats.unique_users}
          icon={<UserCheck className="h-5 w-5" strokeWidth={2.5} />}
          iconColor="text-indigo-600 dark:text-indigo-400"
          description="Distinct claiming users"
        />
        <AdminStatCard
          label="Conversion"
          value={`${stats.conversion_rate.toFixed(1)}%`}
          icon={<TrendingUp className="h-5 w-5" strokeWidth={2.5} />}
          iconColor="text-amber-600 dark:text-amber-400"
          description="Claims as % of QR generated"
        />
        <AdminCard className="p-6" hover>
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Est. Revenue
              </p>
              <p className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                {formatINR(totalEstimatedRevenue)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Across all campaigns
              </p>
            </div>
          </div>
        </AdminCard>
      </div>

      {/* Campaigns Table */}
      <div>
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Campaigns
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Per-campaign performance metrics
          </p>
        </div>

        {campaignList.length === 0 ? (
          <AdminCard className="p-12 text-center">
            <Megaphone className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
            <p className="text-gray-500 dark:text-gray-400">
              No campaigns found for this client.
            </p>
          </AdminCard>
        ) : (
          <AdminTable>
            <AdminTableHeader>
              <AdminTableRow>
                <AdminTableHeadCell>Campaign Name</AdminTableHeadCell>
                <AdminTableHeadCell>QR Generated</AdminTableHeadCell>
                <AdminTableHeadCell>Claims</AdminTableHeadCell>
                <AdminTableHeadCell>Unique Users</AdminTableHeadCell>
                <AdminTableHeadCell>Conversion</AdminTableHeadCell>
                <AdminTableHeadCell>Est. Revenue</AdminTableHeadCell>
                <AdminTableHeadCell>Action</AdminTableHeadCell>
              </AdminTableRow>
            </AdminTableHeader>
            <AdminTableBody>
              {campaignList.map((c) => (
                <AdminTableRow key={c.campaign_id}>
                  <AdminTableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                        <Megaphone className="h-5 w-5 text-white" />
                      </div>
                      <span className="font-semibold">{c.campaign_name}</span>
                    </div>
                  </AdminTableCell>
                  <AdminTableCell>
                    <div className="flex items-center gap-2">
                      <QrCode className="h-4 w-4 text-blue-500" />
                      <span>{c.total_qr.toLocaleString()}</span>
                    </div>
                  </AdminTableCell>
                  <AdminTableCell>
                    <AdminBadge variant="success">
                      {c.total_claims.toLocaleString()}
                    </AdminBadge>
                  </AdminTableCell>
                  <AdminTableCell>
                    {c.unique_users.toLocaleString()}
                  </AdminTableCell>
                  <AdminTableCell>
                    <AdminBadge variant="info">
                      {c.conversion_rate.toFixed(1)}%
                    </AdminBadge>
                  </AdminTableCell>
                  <AdminTableCell>
                    {c.estimated_revenue > 0 ? (
                      <div className="flex flex-col gap-1.5">
                        <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                          {formatINR(c.estimated_revenue)}
                        </span>
                        <AdminBadge variant="success" size="sm">
                          MOV set
                        </AdminBadge>
                      </div>
                    ) : (
                      <AdminBadge variant="warning" size="sm">
                        Config missing
                      </AdminBadge>
                    )}
                  </AdminTableCell>
                  <AdminTableCell>
                    <Link
                      href={`/admin/campaign/${c.campaign_id}`}
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 text-sm font-semibold"
                    >
                      View Details
                    </Link>
                  </AdminTableCell>
                </AdminTableRow>
              ))}
            </AdminTableBody>
          </AdminTable>
        )}
      </div>
    </div>
  );
}
