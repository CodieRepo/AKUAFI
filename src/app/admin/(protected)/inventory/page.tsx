"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Package,
  Plus,
  Box,
  Boxes,
  TrendingDown,
  CheckCircle,
  AlertCircle,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { formatToISTDate } from "@/lib/formatTimestamp";
import { AdminPageHeader } from "@/components/admin/ui/AdminPageHeader";
import { AdminButton } from "@/components/admin/ui/AdminButton";
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
import { AdminLoadingState } from "@/components/admin/ui/AdminLoadingState";
import { AdminEmptyState } from "@/components/admin/ui/AdminEmptyState";
import { AdminInput } from "@/components/admin/ui/AdminInput";

type BatchRow = {
  id: string;
  batch_name: string;
  total_bottles: number;
  remaining_bottles: number;
  dispatched_at: string;
  status: "active" | "completed";
  client_name?: string;
  client_id: string;
};

type MetricCard = {
  label: string;
  value: number | string;
  color: string;
  icon: string;
};

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
    client_id: clients[0]?.id ?? "",
    batch_name: "",
    total_bottles: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.batch_name.trim() || !form.total_bottles || !form.client_id) {
      setError("All fields are required.");
      return;
    }
    const qty = parseInt(form.total_bottles);
    if (isNaN(qty) || qty <= 0) {
      setError("Total bottles must be a positive number.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const supabase = createClient();

      // INSERT and immediately return the new row's id
      const { data: newBatch, error: batchErr } = await supabase
        .from("inventory_batches")
        .insert({
          client_id: form.client_id,
          batch_name: form.batch_name.trim(),
          total_bottles: qty,
          remaining_bottles: qty,
          status: "active",
        })
        .select("id")
        .single();

      if (batchErr) {
        // Log full Supabase error for debugging
        console.error(
          "[Inventory] batch insert error:",
          JSON.stringify(batchErr, null, 2),
        );
        const detail = batchErr.code ? ` (code: ${batchErr.code})` : "";
        const hint = batchErr.hint ? ` — ${batchErr.hint}` : "";
        throw new Error(`${batchErr.message}${detail}${hint}`);
      }

      // Log the initial dispatch using the returned id (no race condition)
      if (newBatch?.id) {
        const { error: logErr } = await supabase.from("inventory_logs").insert({
          batch_id: newBatch.id,
          action_type: "dispatched",
          quantity: qty,
          note: "Initial dispatch",
        });
        if (logErr) {
          // Non-fatal: batch was created, just log the error
          console.error(
            "[Inventory] dispatch log error:",
            JSON.stringify(logErr, null, 2),
          );
        }
      }

      onCreated();
      onClose();
    } catch (err:
      | { code?: string; hint?: string; message?: string }
      | Error
      | string
      | unknown) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : (typeof err === "object" && err !== null && "message" in err
              ? (err as { message: string }).message
              : null) || "Failed to create batch. Check console for details.";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            New Inventory Batch
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl font-bold"
          >
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Client
            </label>
            <select
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              value={form.client_id}
              onChange={(e) =>
                setForm((p) => ({ ...p, client_id: e.target.value }))
              }
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.client_name}
                </option>
              ))}
            </select>
          </div>
          <AdminInput
            label="Batch Name"
            type="text"
            placeholder="e.g. Feb 2026 – Delhi Restaurant"
            value={form.batch_name}
            onChange={(e) =>
              setForm((p) => ({ ...p, batch_name: e.target.value }))
            }
          />
          <AdminInput
            label="Total Bottles"
            type="number"
            placeholder="500"
            value={form.total_bottles}
            onChange={(e) =>
              setForm((p) => ({ ...p, total_bottles: e.target.value }))
            }
            min={1}
          />
          {error && (
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <AdminButton
              type="button"
              onClick={onClose}
              variant="secondary"
              fullWidth
            >
              Cancel
            </AdminButton>
            <AdminButton
              type="submit"
              disabled={loading}
              loading={loading}
              icon={!loading ? <Plus className="h-4 w-4" /> : undefined}
              fullWidth
            >
              Create Batch
            </AdminButton>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function InventoryPage() {
  const [batches, setBatches] = useState<BatchRow[]>([]);
  const [clients, setClients] = useState<{ id: string; client_name: string }[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      const [
        { data: batchData, error: bErr },
        { data: clientData, error: cErr },
      ] = await Promise.all([
        supabase
          .from("inventory_batches")
          .select("*, clients(client_name)")
          .order("dispatched_at", { ascending: false }),
        supabase.from("clients").select("id, client_name").order("client_name"),
      ]);
      if (bErr) throw bErr;
      if (cErr) throw cErr;

      const rows: BatchRow[] = (batchData || []).map(
        (b: {
          id: string;
          client_id: string;
          batch_name: string;
          total_bottles: number | string;
          remaining_bottles: number | string;
          dispatched_at: string;
          status: "active" | "completed";
          clients?: { client_name?: string };
        }) => ({
          id: b.id,
          client_id: b.client_id,
          batch_name: b.batch_name,
          total_bottles: Number(b.total_bottles),
          remaining_bottles: Number(b.remaining_bottles),
          dispatched_at: b.dispatched_at,
          status: b.status,
          client_name: b.clients?.client_name ?? "—",
        }),
      );

      setBatches(rows);
      setClients(clientData || []);
    } catch (err: { message?: string } | Error | string | unknown) {
      // Show the actual Supabase error message if available
      const msg =
        err instanceof Error
          ? err.message
          : (typeof err === "object" && err !== null && "message" in err
              ? (err as { message: string }).message
              : null) || "Failed to load inventory data.";
      setError(msg);
      console.error("[Inventory] load error:", JSON.stringify(err, null, 2));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalDispatched = batches.reduce((s, b) => s + b.total_bottles, 0);
  const totalRemaining = batches.reduce((s, b) => s + b.remaining_bottles, 0);
  const activeBatches = batches.filter((b) => b.status === "active").length;
  const completedBatches = batches.filter(
    (b) => b.status === "completed",
  ).length;

  const metrics: MetricCard[] = [
    {
      label: "Total Dispatched",
      value: totalDispatched.toLocaleString(),
      color: "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400",
      icon: "📦",
    },
    {
      label: "Total Remaining",
      value: totalRemaining.toLocaleString(),
      color:
        "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400",
      icon: "🗄️",
    },
    {
      label: "Active Batches",
      value: activeBatches,
      color:
        "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400",
      icon: "🟢",
    },
    {
      label: "Completed Batches",
      value: completedBatches,
      color: "bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300",
      icon: "✅",
    },
  ];

  if (loading) {
    return <AdminLoadingState />;
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <AdminPageHeader
        title="Inventory"
        description="Track water bottle stock dispatched to clients"
        actions={
          <AdminButton onClick={() => setShowModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Batch
          </AdminButton>
        }
      />

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 dark:bg-red-900/20 rounded-xl px-4 py-3 border border-red-100 dark:border-red-900/30 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <AdminStatCard
          label="Total Dispatched"
          value={totalDispatched.toLocaleString()}
          icon={Box}
          iconColor="text-blue-600 dark:text-blue-400"
          description="Bottles sent to clients"
        />
        <AdminStatCard
          label="Total Remaining"
          value={totalRemaining.toLocaleString()}
          icon={Boxes}
          iconColor="text-green-600 dark:text-green-400"
          description="Available in stock"
        />
        <AdminStatCard
          label="Active Batches"
          value={activeBatches}
          icon={Package}
          iconColor="text-amber-600 dark:text-amber-400"
          description="Currently in use"
        />
        <AdminStatCard
          label="Completed Batches"
          value={completedBatches}
          icon={CheckCircle}
          iconColor="text-gray-600 dark:text-gray-400"
          description="Fully dispatched"
        />
      </div>

      {/* Batches Table */}
      {batches.length === 0 ? (
        <AdminEmptyState
          icon={Package}
          title="No batches yet"
          description="Create your first batch to start tracking inventory"
          action={
            <AdminButton onClick={() => setShowModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Batch
            </AdminButton>
          }
        />
      ) : (
        <AdminTable>
          <AdminTableHeader>
            <AdminTableRow>
              <AdminTableHeadCell>Client</AdminTableHeadCell>
              <AdminTableHeadCell>Batch Name</AdminTableHeadCell>
              <AdminTableHeadCell align="right">Total</AdminTableHeadCell>
              <AdminTableHeadCell align="right">Remaining</AdminTableHeadCell>
              <AdminTableHeadCell>Dispatched</AdminTableHeadCell>
              <AdminTableHeadCell>Status</AdminTableHeadCell>
              <AdminTableHeadCell> </AdminTableHeadCell>
            </AdminTableRow>
          </AdminTableHeader>
          <AdminTableBody>
            {batches.map((b) => {
              const usedPct =
                b.total_bottles > 0
                  ? Math.round(
                      ((b.total_bottles - b.remaining_bottles) /
                        b.total_bottles) *
                        100,
                    )
                  : 0;
              return (
                <AdminTableRow key={b.id}>
                  <AdminTableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                        <Package className="h-5 w-5 text-white" />
                      </div>
                      <span className="font-semibold">{b.client_name}</span>
                    </div>
                  </AdminTableCell>
                  <AdminTableCell>
                    <span className="text-gray-700 dark:text-gray-300">
                      {b.batch_name}
                    </span>
                  </AdminTableCell>
                  <AdminTableCell align="right">
                    <span className="font-mono font-semibold">
                      {b.total_bottles.toLocaleString()}
                    </span>
                  </AdminTableCell>
                  <AdminTableCell align="right">
                    <div className="flex flex-col items-end gap-1">
                      <span className="font-mono font-semibold">
                        {b.remaining_bottles.toLocaleString()}
                      </span>
                      <div className="w-20 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${100 - usedPct}%` }}
                        />
                      </div>
                    </div>
                  </AdminTableCell>
                  <AdminTableCell>
                    <span className="text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {formatToISTDate(b.dispatched_at)}
                    </span>
                  </AdminTableCell>
                  <AdminTableCell>
                    <AdminBadge
                      variant={b.status === "active" ? "success" : "default"}
                    >
                      {b.status}
                    </AdminBadge>
                  </AdminTableCell>
                  <AdminTableCell>
                    <Link
                      href={`/admin/inventory/${b.id}`}
                      className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-xs font-medium transition-colors"
                    >
                      View <ChevronRight className="h-3 w-3" />
                    </Link>
                  </AdminTableCell>
                </AdminTableRow>
              );
            })}
          </AdminTableBody>
        </AdminTable>
      )}

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
