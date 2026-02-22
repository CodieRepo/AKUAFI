"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  BarChart2,
  TrendingUp,
  Activity,
  Users,
  Megaphone,
  QrCode,
  Ticket,
  UserCheck,
  DollarSign,
} from "lucide-react";
import { AdminPageHeader } from "@/components/admin/ui/AdminPageHeader";
import { AdminStatCard } from "@/components/admin/ui/AdminStatCard";
import { AdminCard } from "@/components/admin/ui/AdminCard";
import { AdminBadge } from "@/components/admin/ui/AdminBadge";

type ClientRow = {
  client_id: string;
  client_name: string;
  total_campaigns: number;
  total_qr: number;
  total_claims: number;
  unique_users: number;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function claimRateColor(rate: number) {
  if (rate >= 15) return "#10b981"; // green
  if (rate >= 5) return "#f59e0b"; // amber
  return "#ef4444"; // red
}

function formatINR(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

// ── Chart 1: QR vs Claims per Client (vertical bars) ──────────────────────────
function QRvsClaimsChart({ data }: { data: ClientRow[] }) {
  if (!data.length) return null;

  const BAR_W = 26;
  const GAP = 22;
  const H = 200;
  const PAD = { top: 20, bottom: 44, left: 52, right: 16 };
  const maxVal = Math.max(
    ...data.flatMap((d) => [d.total_qr, d.total_claims]),
    1,
  );
  const totalW = data.length * (BAR_W * 2 + GAP) + PAD.left + PAD.right;
  const svgW = Math.max(totalW, 420);
  const svgH = H + PAD.top + PAD.bottom;
  const scale = (v: number) => (v / maxVal) * H;
  const ticks = [0, 0.5, 1].map((t) => Math.round(t * maxVal));

  return (
    <div className="w-full overflow-x-auto">
      <svg width={svgW} height={svgH} aria-label="QR vs Claims per client">
        {ticks.map((tick, i) => {
          const y = PAD.top + H - scale(tick);
          return (
            <g key={i}>
              <line
                x1={PAD.left}
                x2={svgW - PAD.right}
                y1={y}
                y2={y}
                stroke="#e5e7eb"
                strokeWidth={1}
              />
              <text
                x={PAD.left - 6}
                y={y + 4}
                textAnchor="end"
                fontSize={10}
                fill="#9ca3af"
              >
                {tick >= 1000 ? `${(tick / 1000).toFixed(0)}k` : tick}
              </text>
            </g>
          );
        })}
        {data.map((d, i) => {
          const x = PAD.left + i * (BAR_W * 2 + GAP);
          const qrH = scale(d.total_qr);
          const clH = scale(d.total_claims);
          return (
            <g key={d.client_id}>
              <rect
                x={x}
                y={PAD.top + H - qrH}
                width={BAR_W}
                height={qrH}
                rx={4}
                fill="#3b82f6"
                fillOpacity={0.85}
              />
              {d.total_qr > 0 && (
                <text
                  x={x + BAR_W / 2}
                  y={PAD.top + H - qrH - 4}
                  textAnchor="middle"
                  fontSize={9}
                  fill="#3b82f6"
                >
                  {d.total_qr >= 1000
                    ? `${(d.total_qr / 1000).toFixed(1)}k`
                    : d.total_qr}
                </text>
              )}
              <rect
                x={x + BAR_W + 2}
                y={PAD.top + H - clH}
                width={BAR_W}
                height={clH}
                rx={4}
                fill="#10b981"
                fillOpacity={0.85}
              />
              {d.total_claims > 0 && (
                <text
                  x={x + BAR_W + 2 + BAR_W / 2}
                  y={PAD.top + H - clH - 4}
                  textAnchor="middle"
                  fontSize={9}
                  fill="#10b981"
                >
                  {d.total_claims}
                </text>
              )}
              <text
                x={x + BAR_W}
                y={svgH - 10}
                textAnchor="middle"
                fontSize={10}
                fill="#6b7280"
              >
                {d.client_name.length > 9
                  ? d.client_name.slice(0, 8) + "…"
                  : d.client_name}
              </text>
            </g>
          );
        })}
        <line
          x1={PAD.left}
          x2={svgW - PAD.right}
          y1={PAD.top + H}
          y2={PAD.top + H}
          stroke="#d1d5db"
          strokeWidth={1}
        />
      </svg>
      <div className="flex gap-6 mt-2 ml-12">
        <span className="flex items-center gap-2 text-xs text-gray-500">
          <span className="w-3 h-3 rounded-sm bg-blue-500 inline-block" />
          QR Generated
        </span>
        <span className="flex items-center gap-2 text-xs text-gray-500">
          <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" />
          Claims
        </span>
      </div>
    </div>
  );
}

// ── Chart 2: Claim Rate % per Client (horizontal bars sorted desc) ────────────
function ClaimRateChart({ data }: { data: ClientRow[] }) {
  const sorted = [...data]
    .map((d) => ({
      ...d,
      rate:
        d.total_qr > 0 ? Math.round((d.total_claims / d.total_qr) * 100) : 0,
    }))
    .sort((a, b) => b.rate - a.rate);

  if (!sorted.length) return null;

  const BAR_H = 32;
  const GAP = 10;
  const LABEL_W = 100;
  const CHART_W = 340;
  const svgH = sorted.length * (BAR_H + GAP) + 20;

  return (
    <div className="w-full overflow-x-auto">
      <svg
        width={LABEL_W + CHART_W + 60}
        height={svgH}
        aria-label="Claim rate per client"
      >
        {sorted.map((d, i) => {
          const y = i * (BAR_H + GAP) + 10;
          const barW = (d.rate / 100) * CHART_W;
          const color = claimRateColor(d.rate);
          const name =
            d.client_name.length > 12
              ? d.client_name.slice(0, 11) + "…"
              : d.client_name;
          return (
            <g key={d.client_id}>
              {/* label */}
              <text
                x={LABEL_W - 8}
                y={y + BAR_H / 2 + 4}
                textAnchor="end"
                fontSize={11}
                fill="#374151"
              >
                {name}
              </text>
              {/* track */}
              <rect
                x={LABEL_W}
                y={y}
                width={CHART_W}
                height={BAR_H}
                rx={6}
                fill="#f3f4f6"
              />
              {/* bar */}
              {barW > 0 && (
                <rect
                  x={LABEL_W}
                  y={y}
                  width={barW}
                  height={BAR_H}
                  rx={6}
                  fill={color}
                  fillOpacity={0.85}
                />
              )}
              {/* % label */}
              <text
                x={LABEL_W + CHART_W + 8}
                y={y + BAR_H / 2 + 4}
                fontSize={11}
                fontWeight="600"
                fill={color}
              >
                {d.rate}%
              </text>
            </g>
          );
        })}
      </svg>
      {/* Legend */}
      <div className="flex gap-5 mt-3 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-400 inline-block" />
          &lt;5% Low
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />
          5–15% Medium
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
          &gt;15% High
        </span>
      </div>
    </div>
  );
}

// ── Chart 3: Client Performance Leaderboard (ranked by engagement score) ─────
function ClientLeaderboardChart({ data }: { data: ClientRow[] }) {
  if (!data.length) return null;

  // Calculate engagement score: weighted combination of metrics
  const ranked = [...data]
    .map((d) => ({
      ...d,
      score:
        d.total_campaigns * 100 +
        d.total_qr * 10 +
        d.total_claims * 50 +
        d.unique_users * 25,
      rate: d.total_qr > 0 ? (d.total_claims / d.total_qr) * 100 : 0,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 6); // Top 6 clients

  if (!ranked.length) return null;

  const maxScore = ranked[0]?.score || 1;

  const getRankColor = (rank: number) => {
    if (rank === 1) return "from-yellow-400 to-yellow-600"; // Gold
    if (rank === 2) return "from-gray-300 to-gray-500"; // Silver
    if (rank === 3) return "from-amber-600 to-amber-800"; // Bronze
    return "from-teal-400 to-teal-600"; // Teal for others
  };

  const getRankTextColor = (rank: number) => {
    if (rank === 1) return "text-yellow-600";
    if (rank === 2) return "text-gray-600";
    if (rank === 3) return "text-amber-700";
    return "text-teal-600";
  };

  return (
    <div className="space-y-3">
      {ranked.map((client, idx) => {
        const rank = idx + 1;
        const scorePercent = (client.score / maxScore) * 100;

        return (
          <div
            key={client.client_id}
            className="flex items-center gap-3 group hover:bg-gray-50/50 dark:hover:bg-gray-700/20 rounded-lg p-2 transition-colors"
          >
            {/* Rank Badge */}
            <div
              className={`flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br ${getRankColor(rank)} flex items-center justify-center shadow-sm`}
            >
              <span className="text-white font-bold text-sm">{rank}</span>
            </div>

            {/* Client Info & Metrics */}
            <div className="flex-1 min-w-0">
              {/* Client Name & Score */}
              <div className="flex items-center justify-between mb-1.5">
                <h4 className="font-semibold text-sm text-gray-800 dark:text-gray-100 truncate">
                  {client.client_name}
                </h4>
                <span
                  className={`text-xs font-bold ${getRankTextColor(rank)} ml-2`}
                >
                  {client.score.toLocaleString()} pts
                </span>
              </div>

              {/* Progress Bar */}
              <div className="relative h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-1.5">
                <div
                  className={`absolute inset-y-0 left-0 bg-gradient-to-r ${getRankColor(rank)} transition-all duration-500 rounded-full`}
                  style={{ width: `${scorePercent}%` }}
                />
              </div>

              {/* Mini Stats */}
              <div className="flex gap-3 text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  {client.total_campaigns} campaigns
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  {client.total_qr.toLocaleString()} QR
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  {client.total_claims} claims
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  {client.rate.toFixed(1)}% rate
                </span>
              </div>
            </div>
          </div>
        );
      })}

      {/* Legend */}
      <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-400 text-center">
          Engagement score = campaigns + QR volume + claims + unique users
          (weighted)
        </p>
      </div>
    </div>
  );
}

// ── Dashboard Page ─────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [platformRevenue, setPlatformRevenue] = useState<number>(0);

  const totalClients = clients.length;
  const totalCampaigns = clients.reduce(
    (s, c) => s + Number(c.total_campaigns || 0),
    0,
  );
  const totalQR = clients.reduce((s, c) => s + Number(c.total_qr || 0), 0);
  const totalClaims = clients.reduce(
    (s, c) => s + Number(c.total_claims || 0),
    0,
  );
  const uniqueUsers = clients.reduce(
    (s, c) => s + Number(c.unique_users || 0),
    0,
  );

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const supabase = createClient();
        const [
          { data: viewData, error: viewErr },
          { data: clientsData },
          statsRes,
        ] = await Promise.all([
          supabase.from("client_dashboard_v1").select("*"),
          supabase.from("clients").select("id, client_name"),
          // Fetch platform revenue from server-side API (uses supabaseAdmin — bypasses RLS)
          // The client-side join query `campaigns(minimum_order_value)` was returning null
          // because RLS on the campaigns table blocks the browser client from reading it.
          fetch("/api/admin/stats").then((r) => r.json()),
        ]);
        if (viewErr) throw viewErr;

        // Revenue comes from the server-side API (supabaseAdmin bypasses RLS)
        setPlatformRevenue(Number(statsRes?.platform_revenue || 0));

        const nameMap: Record<string, string> = {};
        (clientsData || []).forEach((c) => {
          nameMap[c.id] = c.client_name;
        });

        const merged: ClientRow[] = (viewData || []).map((row) => ({
          client_id: row.client_id,
          client_name: nameMap[row.client_id] || "Unknown",
          total_campaigns: Number(row.total_campaigns || 0),
          total_qr: Number(row.total_qr || 0),
          total_claims: Number(row.total_claims || 0),
          unique_users: Number(row.unique_users || 0),
        }));
        setClients(merged);
      } catch (err: { message?: string } | Error | string | unknown) {
        const msg =
          err instanceof Error
            ? err.message
            : (typeof err === "object" && err !== null && "message" in err
                ? (err as { message: string }).message
                : null) || "Unknown error";
        console.error("[AdminDashboard]", err);
        setError(msg);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (error)
    return <div className="p-8 text-center text-red-500">Error: {error}</div>;

  const chartSkeleton = (
    <div className="h-52 bg-gray-100/50 dark:bg-white/5 rounded-xl animate-pulse" />
  );

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Dashboard"
        description="Platform-wide analytics and insights across all clients"
        actions={
          <AdminBadge variant="success" size="md">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
            Live Data
          </AdminBadge>
        }
      />

      {/* Stat Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-40 bg-white/20 dark:bg-white/5 rounded-2xl animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          <AdminStatCard
            label="Total Clients"
            value={totalClients}
            icon={<Users className="h-5 w-5" strokeWidth={2.5} />}
            iconColor="text-blue-600 dark:text-blue-400"
            description="Active clients"
          />
          <AdminStatCard
            label="Campaigns"
            value={totalCampaigns}
            icon={<Megaphone className="h-5 w-5" strokeWidth={2.5} />}
            iconColor="text-purple-600 dark:text-purple-400"
            description="All campaigns"
          />
          <AdminStatCard
            label="QR Generated"
            value={totalQR}
            icon={<QrCode className="h-5 w-5" strokeWidth={2.5} />}
            iconColor="text-indigo-600 dark:text-indigo-400"
            description="Total codes"
          />
          <AdminStatCard
            label="Total Claims"
            value={totalClaims}
            icon={<Ticket className="h-5 w-5" strokeWidth={2.5} />}
            iconColor="text-green-600 dark:text-green-400"
            description="Successful claims"
          />
          <AdminStatCard
            label="Unique Users"
            value={uniqueUsers}
            icon={<UserCheck className="h-5 w-5" strokeWidth={2.5} />}
            iconColor="text-amber-600 dark:text-amber-400"
            description="Distinct users"
          />
          <AdminStatCard
            label="Revenue Impact"
            value={formatINR(platformRevenue)}
            icon={<DollarSign className="h-5 w-5" strokeWidth={2.5} />}
            iconColor="text-emerald-600 dark:text-emerald-400"
            description="Estimated revenue"
          />
        </div>
      )}

      {/* Chart 1 - QR vs Claims */}
      <AdminCard className="p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
            <BarChart2
              className="h-6 w-6 text-blue-600 dark:text-blue-400"
              strokeWidth={2.5}
            />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              QR Generated vs Claims — Per Client
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Side-by-side volume comparison across all clients
            </p>
          </div>
        </div>
        {loading ? (
          chartSkeleton
        ) : clients.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-sm text-gray-400">
            No data yet.
          </div>
        ) : (
          <QRvsClaimsChart data={clients} />
        )}
      </AdminCard>

      {/* Chart 2 - Claim Rate % per Client */}
      <AdminCard className="p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
            <TrendingUp
              className="h-6 w-6 text-amber-600 dark:text-amber-400"
              strokeWidth={2.5}
            />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Claim Rate % — Conversion per Client
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Sorted best to worst ·{" "}
              <span className="text-red-500">&lt;5% Low</span> ·{" "}
              <span className="text-amber-500">5–15% Medium</span> ·{" "}
              <span className="text-emerald-500">&gt;15% High</span>
            </p>
          </div>
        </div>
        {loading ? (
          chartSkeleton
        ) : clients.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-sm text-gray-400">
            No data yet.
          </div>
        ) : (
          <ClaimRateChart data={clients} />
        )}
      </AdminCard>

      {/* Chart 3 — Client Performance Leaderboard */}
      <AdminCard className="p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-gradient-to-br from-teal-400 to-teal-600 rounded-xl shadow-sm">
            <Activity className="h-6 w-6 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Client Performance Leaderboard
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Top clients ranked by engagement score
            </p>
          </div>
        </div>
        {loading ? (
          chartSkeleton
        ) : clients.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-sm text-gray-400">
            No data yet.
          </div>
        ) : (
          <ClientLeaderboardChart data={clients} />
        )}
      </AdminCard>
    </div>
  );
}
