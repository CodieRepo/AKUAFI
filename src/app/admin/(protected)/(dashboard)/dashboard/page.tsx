'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { BarChart2 } from 'lucide-react';

type ClientRow = {
  client_id: string;
  client_name: string;
  total_campaigns: number;
  total_qr: number;
  total_claims: number;
  unique_users: number;
};

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

// ── Pure SVG bar chart — zero dependencies ─────────────────────────────────
function BarChart({ data }: { data: ClientRow[] }) {
  if (!data.length) return null;

  const BAR_W   = 28;   // width of each bar group pair
  const GAP     = 20;   // gap between groups
  const HEIGHT  = 220;  // chart area height
  const PADDING = { top: 16, bottom: 40, left: 48, right: 16 };

  const maxVal = Math.max(...data.flatMap(d => [d.total_qr, d.total_claims]), 1);

  const totalW = data.length * (BAR_W * 2 + GAP) + PADDING.left + PADDING.right;
  const svgW   = Math.max(totalW, 400);
  const svgH   = HEIGHT + PADDING.top + PADDING.bottom;

  const scale = (v: number) => (v / maxVal) * HEIGHT;

  // Y-axis ticks
  const ticks = [0, 0.25, 0.5, 0.75, 1].map(t => Math.round(t * maxVal));

  const COLORS = { qr: '#3b82f6', claims: '#10b981' };

  return (
    <div className="w-full overflow-x-auto">
      <svg width={svgW} height={svgH} aria-label="QR vs Claims bar chart">
        {/* Y-axis gridlines + labels */}
        {ticks.map((tick, i) => {
          const y = PADDING.top + HEIGHT - scale(tick);
          return (
            <g key={i}>
              <line
                x1={PADDING.left} x2={svgW - PADDING.right}
                y1={y} y2={y}
                stroke="#e5e7eb" strokeWidth={1}
              />
              <text x={PADDING.left - 6} y={y + 4} textAnchor="end" fontSize={10} fill="#9ca3af">
                {tick >= 1000 ? `${(tick / 1000).toFixed(0)}k` : tick}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {data.map((d, i) => {
          const x = PADDING.left + i * (BAR_W * 2 + GAP);
          const qrH     = scale(d.total_qr);
          const claimsH = scale(d.total_claims);

          return (
            <g key={d.client_id}>
              {/* QR bar */}
              <rect
                x={x} y={PADDING.top + HEIGHT - qrH}
                width={BAR_W} height={qrH}
                rx={4} fill={COLORS.qr} fillOpacity={0.85}
              />
              <text
                x={x + BAR_W / 2} y={PADDING.top + HEIGHT - qrH - 4}
                textAnchor="middle" fontSize={9} fill={COLORS.qr}
              >
                {d.total_qr > 0 ? d.total_qr.toLocaleString() : ''}
              </text>

              {/* Claims bar */}
              <rect
                x={x + BAR_W + 2} y={PADDING.top + HEIGHT - claimsH}
                width={BAR_W} height={claimsH}
                rx={4} fill={COLORS.claims} fillOpacity={0.85}
              />
              <text
                x={x + BAR_W + 2 + BAR_W / 2}
                y={PADDING.top + HEIGHT - claimsH - 4}
                textAnchor="middle" fontSize={9} fill={COLORS.claims}
              >
                {d.total_claims > 0 ? d.total_claims.toLocaleString() : ''}
              </text>

              {/* Client name label */}
              <text
                x={x + BAR_W}
                y={svgH - 8}
                textAnchor="middle" fontSize={10} fill="#6b7280"
              >
                {d.client_name.length > 10 ? d.client_name.slice(0, 9) + '…' : d.client_name}
              </text>
            </g>
          );
        })}

        {/* X-axis baseline */}
        <line
          x1={PADDING.left} x2={svgW - PADDING.right}
          y1={PADDING.top + HEIGHT} y2={PADDING.top + HEIGHT}
          stroke="#d1d5db" strokeWidth={1}
        />
      </svg>

      {/* Legend */}
      <div className="flex gap-6 mt-3 ml-12">
        <span className="flex items-center gap-2 text-xs text-gray-500">
          <span className="inline-block w-3 h-3 rounded-sm bg-blue-500" />
          QR Generated
        </span>
        <span className="flex items-center gap-2 text-xs text-gray-500">
          <span className="inline-block w-3 h-3 rounded-sm bg-emerald-500" />
          Claims
        </span>
      </div>
    </div>
  );
}

// ── Dashboard ──────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);

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

        const [{ data: viewData, error: viewErr }, { data: clientsData, error: clientsErr }] =
          await Promise.all([
            supabase.from('client_dashboard_v1').select('*'),
            supabase.from('clients').select('id, client_name'),
          ]);

        if (viewErr)    throw viewErr;
        if (clientsErr) throw clientsErr;

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

  return (
    <div className="max-w-7xl mx-auto space-y-8 py-2">

      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard Overview</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Platform-wide analytics across all clients
        </p>
      </div>

      {/* Top Stat Cards */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatCard label="Total Clients"   value={totalClients}   />
          <StatCard label="Total Campaigns" value={totalCampaigns} />
          <StatCard label="QR Generated"    value={totalQR}        />
          <StatCard label="Total Claims"    value={totalClaims}    />
          <StatCard label="Unique Users"    value={uniqueUsers}    />
        </div>
      )}

      {/* Analytics Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-6">
          <BarChart2 className="h-5 w-5 text-blue-500" />
          <h2 className="font-bold text-gray-900 dark:text-white">QR Generated vs Claims — Per Client</h2>
        </div>

        {loading ? (
          <div className="h-64 bg-gray-50 dark:bg-gray-700/30 rounded-lg animate-pulse" />
        ) : clients.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-sm text-gray-400">
            No client data available yet.
          </div>
        ) : (
          <BarChart data={clients} />
        )}
      </div>
    </div>
  );
}
