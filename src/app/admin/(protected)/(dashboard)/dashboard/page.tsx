'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { BarChart2, TrendingUp, Activity } from 'lucide-react';

type ClientRow = {
  client_id: string;
  client_name: string;
  total_campaigns: number;
  total_qr: number;
  total_claims: number;
  unique_users: number;
};

type PlatformRevenue = {
  total: number;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function claimRateColor(rate: number) {
  if (rate >= 15) return '#10b981'; // green
  if (rate >= 5)  return '#f59e0b'; // amber
  return '#ef4444';                  // red
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
    </div>
  );
}

// ── Chart 1: QR vs Claims per Client (vertical bars) ──────────────────────────
function QRvsClaimsChart({ data }: { data: ClientRow[] }) {
  if (!data.length) return null;

  const BAR_W  = 26;
  const GAP    = 22;
  const H      = 200;
  const PAD    = { top: 20, bottom: 44, left: 52, right: 16 };
  const maxVal = Math.max(...data.flatMap(d => [d.total_qr, d.total_claims]), 1);
  const totalW = data.length * (BAR_W * 2 + GAP) + PAD.left + PAD.right;
  const svgW   = Math.max(totalW, 420);
  const svgH   = H + PAD.top + PAD.bottom;
  const scale  = (v: number) => (v / maxVal) * H;
  const ticks  = [0, 0.5, 1].map(t => Math.round(t * maxVal));

  return (
    <div className="w-full overflow-x-auto">
      <svg width={svgW} height={svgH} aria-label="QR vs Claims per client">
        {ticks.map((tick, i) => {
          const y = PAD.top + H - scale(tick);
          return (
            <g key={i}>
              <line x1={PAD.left} x2={svgW - PAD.right} y1={y} y2={y} stroke="#e5e7eb" strokeWidth={1} />
              <text x={PAD.left - 6} y={y + 4} textAnchor="end" fontSize={10} fill="#9ca3af">
                {tick >= 1000 ? `${(tick / 1000).toFixed(0)}k` : tick}
              </text>
            </g>
          );
        })}
        {data.map((d, i) => {
          const x    = PAD.left + i * (BAR_W * 2 + GAP);
          const qrH  = scale(d.total_qr);
          const clH  = scale(d.total_claims);
          return (
            <g key={d.client_id}>
              <rect x={x}          y={PAD.top + H - qrH} width={BAR_W} height={qrH} rx={4} fill="#3b82f6" fillOpacity={0.85} />
              {d.total_qr > 0 && <text x={x + BAR_W/2}            y={PAD.top + H - qrH - 4}  textAnchor="middle" fontSize={9} fill="#3b82f6">{d.total_qr >= 1000 ? `${(d.total_qr/1000).toFixed(1)}k` : d.total_qr}</text>}
              <rect x={x+BAR_W+2}  y={PAD.top + H - clH} width={BAR_W} height={clH} rx={4} fill="#10b981" fillOpacity={0.85} />
              {d.total_claims > 0 && <text x={x+BAR_W+2+BAR_W/2} y={PAD.top + H - clH - 4}  textAnchor="middle" fontSize={9} fill="#10b981">{d.total_claims}</text>}
              <text x={x + BAR_W} y={svgH - 10} textAnchor="middle" fontSize={10} fill="#6b7280">
                {d.client_name.length > 9 ? d.client_name.slice(0,8)+'…' : d.client_name}
              </text>
            </g>
          );
        })}
        <line x1={PAD.left} x2={svgW - PAD.right} y1={PAD.top + H} y2={PAD.top + H} stroke="#d1d5db" strokeWidth={1} />
      </svg>
      <div className="flex gap-6 mt-2 ml-12">
        <span className="flex items-center gap-2 text-xs text-gray-500"><span className="w-3 h-3 rounded-sm bg-blue-500 inline-block"/>QR Generated</span>
        <span className="flex items-center gap-2 text-xs text-gray-500"><span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block"/>Claims</span>
      </div>
    </div>
  );
}

// ── Chart 2: Claim Rate % per Client (horizontal bars sorted desc) ────────────
function ClaimRateChart({ data }: { data: ClientRow[] }) {
  const sorted = [...data]
    .map(d => ({
      ...d,
      rate: d.total_qr > 0 ? Math.round((d.total_claims / d.total_qr) * 100) : 0,
    }))
    .sort((a, b) => b.rate - a.rate);

  if (!sorted.length) return null;

  const BAR_H   = 32;
  const GAP     = 10;
  const LABEL_W = 100;
  const CHART_W = 340;
  const svgH    = sorted.length * (BAR_H + GAP) + 20;

  return (
    <div className="w-full overflow-x-auto">
      <svg width={LABEL_W + CHART_W + 60} height={svgH} aria-label="Claim rate per client">
        {sorted.map((d, i) => {
          const y    = i * (BAR_H + GAP) + 10;
          const barW = (d.rate / 100) * CHART_W;
          const color = claimRateColor(d.rate);
          const name  = d.client_name.length > 12 ? d.client_name.slice(0,11)+'…' : d.client_name;
          return (
            <g key={d.client_id}>
              {/* label */}
              <text x={LABEL_W - 8} y={y + BAR_H/2 + 4} textAnchor="end" fontSize={11} fill="#374151">{name}</text>
              {/* track */}
              <rect x={LABEL_W} y={y} width={CHART_W} height={BAR_H} rx={6} fill="#f3f4f6" />
              {/* bar */}
              {barW > 0 && <rect x={LABEL_W} y={y} width={barW} height={BAR_H} rx={6} fill={color} fillOpacity={0.85} />}
              {/* % label */}
              <text x={LABEL_W + CHART_W + 8} y={y + BAR_H/2 + 4} fontSize={11} fontWeight="600" fill={color}>{d.rate}%</text>
            </g>
          );
        })}
      </svg>
      {/* Legend */}
      <div className="flex gap-5 mt-3 text-xs text-gray-500">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-400 inline-block"/>&lt;5% Low</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-400 inline-block"/>5–15% Medium</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"/>&gt;15% High</span>
      </div>
    </div>
  );
}

// ── Chart 3: Platform Overview (stacked visual comparison) ───────────────────
function PlatformOverviewChart({ data }: { data: ClientRow[] }) {
  if (!data.length) return null;

  const totalQR     = data.reduce((s, d) => s + d.total_qr,     0);
  const totalClaims = data.reduce((s, d) => s + d.total_claims, 0);
  const claimRate   = totalQR > 0 ? ((totalClaims / totalQR) * 100).toFixed(1) : '0.0';
  const claimPct    = totalQR > 0 ? (totalClaims / totalQR) * 100 : 0;

  // Per-client cumulative area — build points across clients
  const W = 480; const H = 160; const PAD = { top: 12, bottom: 32, left: 8, right: 8 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const maxQR  = Math.max(...data.map(d => d.total_qr), 1);

  const points = (key: 'total_qr' | 'total_claims') =>
    data.map((d, i) => {
      const x = PAD.left + (i / Math.max(data.length - 1, 1)) * innerW;
      const y = PAD.top + innerH - (d[key] / maxQR) * innerH;
      return `${x},${y}`;
    }).join(' ');

  const qrPts     = points('total_qr');
  const claimsPts = points('total_claims');

  // Build filled polygon for area
  const areaPolygon = (pts: string, color: string) => {
    const first = pts.split(' ')[0];
    const last  = pts.split(' ').at(-1)!;
    const [lx]  = last.split(',');
    const [fx]  = first.split(',');
    return (
      <polygon
        points={`${fx},${PAD.top + innerH} ${pts} ${lx},${PAD.top + innerH}`}
        fill={color} fillOpacity={0.15}
      />
    );
  };

  return (
    <div className="space-y-4">
      {/* Summary tiles */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total QR', val: totalQR.toLocaleString(), color: 'text-blue-600' },
          { label: 'Total Claims', val: totalClaims.toLocaleString(), color: 'text-emerald-600' },
          {
            label: 'Platform Rate',
            val: `${claimRate}%`,
            color: claimPct >= 15 ? 'text-emerald-600' : claimPct >= 5 ? 'text-amber-600' : 'text-red-500',
          },
        ].map(item => (
          <div key={item.label} className="bg-gray-50 dark:bg-gray-700/40 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-400 mb-1">{item.label}</p>
            <p className={`text-xl font-bold ${item.color}`}>{item.val}</p>
          </div>
        ))}
      </div>

      {/* Area chart */}
      {data.length > 1 && (
        <div className="w-full overflow-x-auto">
          <svg width={W} height={H} aria-label="Platform QR vs Claims trend">
            {areaPolygon(qrPts, '#3b82f6')}
            {areaPolygon(claimsPts, '#10b981')}
            <polyline points={qrPts}     fill="none" stroke="#3b82f6" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            <polyline points={claimsPts} fill="none" stroke="#10b981" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            {/* Client name labels */}
            {data.map((d, i) => {
              const x = PAD.left + (i / Math.max(data.length - 1, 1)) * innerW;
              return (
                <text key={d.client_id} x={x} y={H - 6} textAnchor="middle" fontSize={10} fill="#9ca3af">
                  {d.client_name.length > 8 ? d.client_name.slice(0,7)+'…' : d.client_name}
                </text>
              );
            })}
          </svg>
          <div className="flex gap-6 mt-1">
            <span className="flex items-center gap-2 text-xs text-gray-500"><span className="w-3 h-1.5 rounded bg-blue-500 inline-block"/>QR Generated</span>
            <span className="flex items-center gap-2 text-xs text-gray-500"><span className="w-3 h-1.5 rounded bg-emerald-500 inline-block"/>Claims</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Dashboard Page ─────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);
  const [platformRevenue, setPlatformRevenue] = useState<number>(0);

  const totalClients   = clients.length;
  const totalCampaigns = clients.reduce((s, c) => s + Number(c.total_campaigns || 0), 0);
  const totalQR        = clients.reduce((s, c) => s + Number(c.total_qr        || 0), 0);
  const totalClaims    = clients.reduce((s, c) => s + Number(c.total_claims    || 0), 0);
  const uniqueUsers    = clients.reduce((s, c) => s + Number(c.unique_users    || 0), 0);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const supabase = createClient();
        const [{ data: viewData, error: viewErr }, { data: clientsData, error: clientsErr }, { data: revenueData }] =
          await Promise.all([
            supabase.from('client_dashboard_v1').select('*'),
            supabase.from('clients').select('id, client_name'),
            // Platform Revenue: sum of (claimed coupons × campaign.minimum_order_value)
            supabase
              .from('coupons')
              .select('status, campaigns(minimum_order_value)')
              .eq('status', 'claimed'),
          ]);
        if (viewErr)    throw viewErr;
        if (clientsErr) throw clientsErr;

        // Aggregate platform revenue from join result
        const rev = (revenueData || []).reduce((sum: number, c: any) =>
          sum + Number(c.campaigns?.minimum_order_value || 0), 0
        );
        setPlatformRevenue(rev);

        const nameMap: Record<string, string> = {};
        (clientsData || []).forEach(c => { nameMap[c.id] = c.client_name; });

        const merged: ClientRow[] = (viewData || []).map(row => ({
          client_id:       row.client_id,
          client_name:     nameMap[row.client_id] || 'Unknown',
          total_campaigns: Number(row.total_campaigns || 0),
          total_qr:        Number(row.total_qr        || 0),
          total_claims:    Number(row.total_claims    || 0),
          unique_users:    Number(row.unique_users    || 0),
        }));
        setClients(merged);
      } catch (err: any) {
        console.error('[AdminDashboard]', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;

  const chartSkeleton = <div className="h-52 bg-gray-50 dark:bg-gray-700/30 rounded-lg animate-pulse" />;

  return (
    <div className="max-w-7xl mx-auto space-y-8 py-2">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard Overview</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Platform-wide analytics across all clients</p>
      </div>

      {/* Stat Cards */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard label="Total Clients"   value={totalClients}   />
          <StatCard label="Total Campaigns" value={totalCampaigns} />
          <StatCard label="QR Generated"    value={totalQR}        />
          <StatCard label="Total Claims"    value={totalClaims}    />
          <StatCard label="Unique Users"    value={uniqueUsers}    />
          <StatCard label="Platform Revenue Impact" value={platformRevenue > 0 ? `₹${platformRevenue.toLocaleString()}` : '₹0'} />
        </div>
      )}

      {/* Chart 1 — QR vs Claims per Client */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-5">
          <BarChart2 className="h-5 w-5 text-blue-500" />
          <div>
            <h2 className="font-bold text-gray-900 dark:text-white">QR Generated vs Claims — Per Client</h2>
            <p className="text-xs text-gray-400 mt-0.5">Side-by-side volume comparison across all clients</p>
          </div>
        </div>
        {loading ? chartSkeleton : clients.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-sm text-gray-400">No data yet.</div>
        ) : <QRvsClaimsChart data={clients} />}
      </div>

      {/* Chart 2 — Claim Rate % per Client */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp className="h-5 w-5 text-amber-500" />
          <div>
            <h2 className="font-bold text-gray-900 dark:text-white">Claim Rate % — Conversion per Client</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Sorted best to worst · <span className="text-red-400">&lt;5% Low</span> · <span className="text-amber-500">5–15% Medium</span> · <span className="text-emerald-500">&gt;15% High</span>
            </p>
          </div>
        </div>
        {loading ? chartSkeleton : clients.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-sm text-gray-400">No data yet.</div>
        ) : <ClaimRateChart data={clients} />}
      </div>

      {/* Chart 3 — Platform Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-5">
          <Activity className="h-5 w-5 text-purple-500" />
          <div>
            <h2 className="font-bold text-gray-900 dark:text-white">Platform Growth Overview</h2>
            <p className="text-xs text-gray-400 mt-0.5">Cumulative QR vs Claims across all clients</p>
          </div>
        </div>
        {loading ? chartSkeleton : clients.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-sm text-gray-400">No data yet.</div>
        ) : <PlatformOverviewChart data={clients} />}
      </div>
    </div>
  );
}
