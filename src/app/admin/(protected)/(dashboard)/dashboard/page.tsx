'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { Users, Megaphone, QrCode, ScanLine, ChevronRight } from 'lucide-react';

type ClientRow = {
  client_id: string;
  client_name: string;
  total_campaigns: number;
  total_qr: number;
  total_claims: number;
  unique_users: number;
  conversion_rate: number;
};

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
    </div>
  );
}

export default function AdminDashboard() {
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Derived totals — computed directly from the clients array, no complex reduce
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

        // Fetch all client analytics in one query from the view
        const { data: viewData, error: viewErr } = await supabase
          .from('client_dashboard_v1')
          .select('*');

        if (viewErr) throw viewErr;

        // Enrich with client names — join clients table
        const { data: clientsData, error: clientsErr } = await supabase
          .from('clients')
          .select('id, client_name');

        if (clientsErr) throw clientsErr;

        // Build a lookup: client_id → client_name
        const nameMap: Record<string, string> = {};
        (clientsData || []).forEach(c => { nameMap[c.id] = c.client_name; });

        // Merge name into view rows
        const merged: ClientRow[] = (viewData || []).map(row => ({
          client_id:       row.client_id,
          client_name:     nameMap[row.client_id] || 'Unknown Client',
          total_campaigns: Number(row.total_campaigns || 0),
          total_qr:        Number(row.total_qr        || 0),
          total_claims:    Number(row.total_claims    || 0),
          unique_users:    Number(row.unique_users    || 0),
          conversion_rate: Number(row.conversion_rate || 0),
        }));

        console.log('[AdminDashboard] clients merged:', merged);
        setClients(merged);
      } catch (err: any) {
        console.error('[AdminDashboard] error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (error) {
    return <div className="p-8 text-center text-red-500">Error: {error}</div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 py-2">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard Overview</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">All clients and their campaign analytics</p>
      </div>

      {/* Top Stats */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-28 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard label="Total Clients"    value={totalClients}   />
          <StatCard label="Total Campaigns"  value={totalCampaigns} />
          <StatCard label="Total QR"         value={totalQR}        />
          <StatCard label="Total Claims"     value={totalClaims}    />
          <StatCard label="Unique Users"     value={uniqueUsers}    />
        </div>
      )}

      {/* Clients Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="font-bold text-gray-900 dark:text-white">Clients</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400">
              <tr>
                <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider">Client Name</th>
                <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider">Campaigns</th>
                <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider">QR Generated</th>
                <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider">Claims</th>
                <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider">Unique Users</th>
                <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {[...Array(6)].map((__, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : clients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    <Users className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                    No clients found.
                  </td>
                </tr>
              ) : (
                clients.map(client => (
                  <tr key={client.client_id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">
                      {client.client_name}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                      {client.total_campaigns.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                      {client.total_qr.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                      {client.total_claims.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                      {client.unique_users.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/clients/${client.client_id}`}
                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 text-sm font-medium"
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
