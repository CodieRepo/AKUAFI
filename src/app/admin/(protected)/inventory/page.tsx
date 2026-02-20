'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Package, Plus, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

type BatchRow = {
  id: string;
  batch_name: string;
  total_bottles: number;
  remaining_bottles: number;
  dispatched_at: string;
  status: 'active' | 'completed';
  client_name?: string;
  client_id: string;
};

type MetricCard = { label: string; value: number | string; color: string; icon: string };

// ── Add Batch Modal ─────────────────────────────────────────────────────────
function AddBatchModal({
  clients,
  onClose,
  onCreated,
}: {
  clients: { id: string; client_name: string }[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    client_id: clients[0]?.id ?? '',
    batch_name: '',
    total_bottles: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.batch_name.trim() || !form.total_bottles || !form.client_id) {
      setError('All fields are required.');
      return;
    }
    const qty = parseInt(form.total_bottles);
    if (isNaN(qty) || qty <= 0) { setError('Total bottles must be a positive number.'); return; }

    setLoading(true);
    setError('');
    try {
      const supabase = createClient();
      const { error: err } = await supabase.from('inventory_batches').insert({
        client_id: form.client_id,
        batch_name: form.batch_name.trim(),
        total_bottles: qty,
        remaining_bottles: qty,
        status: 'active',
      });
      if (err) throw err;

      // Log as dispatched
      const { data: batch } = await supabase
        .from('inventory_batches')
        .select('id')
        .eq('client_id', form.client_id)
        .eq('batch_name', form.batch_name.trim())
        .maybeSingle();

      if (batch?.id) {
        await supabase.from('inventory_logs').insert({
          batch_id: batch.id,
          action_type: 'dispatched',
          quantity: qty,
          note: 'Initial dispatch',
        });
      }

      onCreated();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to create batch.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">New Inventory Batch</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl font-bold">×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Client</label>
            <select
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              value={form.client_id}
              onChange={e => setForm(p => ({ ...p, client_id: e.target.value }))}
            >
              {clients.map(c => <option key={c.id} value={c.id}>{c.client_name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Batch Name</label>
            <input
              type="text"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="e.g. Feb 2026 – Delhi Restaurant"
              value={form.batch_name}
              onChange={e => setForm(p => ({ ...p, batch_name: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Total Bottles</label>
            <input
              type="number"
              min={1}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="500"
              value={form.total_bottles}
              onChange={e => setForm(p => ({ ...p, total_bottles: e.target.value }))}
            />
          </div>
          {error && (
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
              <AlertCircle className="h-4 w-4 shrink-0" />{error}
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-2 rounded-lg bg-[#0A66C2] hover:bg-[#004182] text-white text-sm font-medium transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Create Batch
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function InventoryPage() {
  const [batches, setBatches]   = useState<BatchRow[]>([]);
  const [clients, setClients]   = useState<{ id: string; client_name: string }[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [showModal, setShowModal] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      const [{ data: batchData, error: bErr }, { data: clientData, error: cErr }] = await Promise.all([
        supabase
          .from('inventory_batches')
          .select('*, clients(client_name)')
          .order('dispatched_at', { ascending: false }),
        supabase.from('clients').select('id, client_name').order('client_name'),
      ]);
      if (bErr) throw bErr;
      if (cErr) throw cErr;

      const rows: BatchRow[] = (batchData || []).map((b: any) => ({
        id: b.id,
        client_id: b.client_id,
        batch_name: b.batch_name,
        total_bottles: Number(b.total_bottles),
        remaining_bottles: Number(b.remaining_bottles),
        dispatched_at: b.dispatched_at,
        status: b.status,
        client_name: b.clients?.client_name ?? '—',
      }));

      setBatches(rows);
      setClients(clientData || []);
    } catch (err: any) {
      setError('Failed to load inventory data.');
      console.error('[Inventory]', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalDispatched  = batches.reduce((s, b) => s + b.total_bottles, 0);
  const totalRemaining   = batches.reduce((s, b) => s + b.remaining_bottles, 0);
  const activeBatches    = batches.filter(b => b.status === 'active').length;
  const completedBatches = batches.filter(b => b.status === 'completed').length;

  const metrics: MetricCard[] = [
    { label: 'Total Dispatched',  value: totalDispatched.toLocaleString(),  color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400',    icon: '📦' },
    { label: 'Total Remaining',   value: totalRemaining.toLocaleString(),   color: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400', icon: '🗄️' },
    { label: 'Active Batches',    value: activeBatches,                     color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400', icon: '🟢' },
    { label: 'Completed Batches', value: completedBatches,                  color: 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300',        icon: '✅' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Package className="h-6 w-6 text-blue-600" /> Inventory
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Track water bottle stock dispatched to clients</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#0A66C2] hover:bg-[#004182] text-white rounded-lg font-medium transition-colors shadow-sm text-sm"
        >
          <Plus className="h-4 w-4" /> New Batch
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 dark:bg-red-900/20 rounded-xl px-4 py-3 border border-red-100 dark:border-red-900/30 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />{error}
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map(m => (
          <div key={m.label} className={`rounded-xl p-4 ${m.color} border border-current/10`}>
            <div className="text-2xl mb-1">{m.icon}</div>
            <p className="text-xs font-semibold uppercase tracking-wider opacity-70">{m.label}</p>
            <p className="text-3xl font-bold mt-0.5">{m.value}</p>
          </div>
        ))}
      </div>

      {/* Batches Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="font-bold text-gray-900 dark:text-white">Inventory Batches</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-800/60 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3">Client</th>
                <th className="px-6 py-3">Batch Name</th>
                <th className="px-6 py-3 text-right">Total</th>
                <th className="px-6 py-3 text-right">Remaining</th>
                <th className="px-6 py-3">Dispatched</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {batches.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400 dark:text-gray-500">
                    No batches yet. Create your first batch to start tracking.
                  </td>
                </tr>
              ) : batches.map(b => {
                const usedPct = b.total_bottles > 0 ? Math.round(((b.total_bottles - b.remaining_bottles) / b.total_bottles) * 100) : 0;
                return (
                  <tr key={b.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{b.client_name}</td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{b.batch_name}</td>
                    <td className="px-6 py-4 text-right font-mono text-gray-900 dark:text-white">{b.total_bottles.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex flex-col items-end gap-1">
                        <span className="font-mono font-semibold text-gray-900 dark:text-white">{b.remaining_bottles.toLocaleString()}</span>
                        <div className="w-20 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${100 - usedPct}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {new Date(b.dispatched_at).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase ${
                        b.status === 'active'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                      }`}>{b.status}</span>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/inventory/${b.id}`}
                        className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-xs font-medium transition-colors"
                      >
                        View <ChevronRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <AddBatchModal
          clients={clients}
          onClose={() => setShowModal(false)}
          onCreated={fetchData}
        />
      )}
    </div>
  );
}
