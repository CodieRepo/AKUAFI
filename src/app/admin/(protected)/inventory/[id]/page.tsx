"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Package,
  ArrowLeft,
  Plus,
  CheckCircle,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";

type Batch = {
  id: string;
  client_id: string;
  batch_name: string;
  total_bottles: number;
  remaining_bottles: number;
  dispatched_at: string;
  status: "active" | "completed";
  client_name?: string;
};

type LogRow = {
  id: string;
  action_type: string;
  quantity: number;
  note: string | null;
  created_at: string;
};

const ACTION_COLORS: Record<string, string> = {
  dispatched:
    "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
  used: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300",
  returned:
    "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300",
  damaged: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300",
};

export default function InventoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const batchId = params?.id as string;

  const [batch, setBatch] = useState<Batch | null>(null);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Add log form
  const [showForm, setShowForm] = useState(false);
  const [actionType, setActionType] = useState<string>("used");
  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formErr, setFormErr] = useState("");

  const fetchData = useCallback(async () => {
    if (!batchId) return;
    try {
      setLoading(true);
      const supabase = createClient();
      const [{ data: bData, error: bErr }, { data: lData, error: lErr }] =
        await Promise.all([
          supabase
            .from("inventory_batches")
            .select("*, clients(client_name)")
            .eq("id", batchId)
            .maybeSingle(),
          supabase
            .from("inventory_logs")
            .select("*")
            .eq("batch_id", batchId)
            .order("created_at", { ascending: false }),
        ]);
      if (bErr) throw bErr;
      if (lErr) throw lErr;
      if (!bData) {
        setError("Batch not found.");
        return;
      }

      setBatch({
        ...bData,
        total_bottles: Number(bData.total_bottles),
        remaining_bottles: Number(bData.remaining_bottles),
        client_name: bData.clients?.client_name,
      });
      setLogs(lData || []);
    } catch (err: Error | string | unknown) {
      setError("Failed to load batch.");
      console.error("[InventoryDetail]", err);
    } finally {
      setLoading(false);
    }
  }, [batchId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddLog = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) {
      setFormErr("Quantity must be a positive number.");
      return;
    }
    if (!batch) return;

    // Validate remaining (only for 'used' and 'damaged')
    const reducingTypes = ["used", "damaged"];
    if (reducingTypes.includes(actionType) && qty > batch.remaining_bottles) {
      setFormErr(`Only ${batch.remaining_bottles} bottles remaining.`);
      return;
    }

    setSubmitting(true);
    setFormErr("");
    try {
      const supabase = createClient();

      // Insert log and return inserted row for immediate UI state sync
      const { data: insertedLog, error: logErr } = await supabase
        .from("inventory_logs")
        .insert({
          batch_id: batchId,
          action_type: actionType,
          quantity: qty,
          note: note.trim() || null,
        })
        .select("id, action_type, quantity, note, created_at")
        .single();

      if (logErr) {
        console.error(
          "[InventoryDetail] log insert error:",
          JSON.stringify(logErr, null, 2),
        );
        const detail = logErr.code ? ` (code: ${logErr.code})` : "";
        const hint = logErr.hint ? ` — ${logErr.hint}` : "";
        throw new Error(`${logErr.message}${detail}${hint}`);
      }

      // Update remaining_bottles
      let newRemaining = batch.remaining_bottles;
      if (actionType === "used" || actionType === "damaged")
        newRemaining -= qty;
      if (actionType === "returned") newRemaining += qty;

      // Auto-complete if fully used
      const newStatus = newRemaining <= 0 ? "completed" : batch.status;
      newRemaining = Math.max(0, newRemaining);

      const { error: updErr } = await supabase
        .from("inventory_batches")
        .update({ remaining_bottles: newRemaining, status: newStatus })
        .eq("id", batchId);

      if (updErr) {
        console.error(
          "[InventoryDetail] batch update error:",
          JSON.stringify(updErr, null, 2),
        );
        // We log this but don't strictly crash since the log entry WAS created.
        // Although the UI might be inconsistent until refresh.
        await fetchData();
      } else {
        const normalizedLog: LogRow | null = insertedLog
          ? {
              id: String(insertedLog.id),
              action_type: String(insertedLog.action_type),
              quantity: Number(insertedLog.quantity),
              note: insertedLog.note ? String(insertedLog.note) : null,
              created_at: String(insertedLog.created_at),
            }
          : null;

        setBatch((prev) =>
          prev
            ? {
                ...prev,
                remaining_bottles: newRemaining,
                status: newStatus,
              }
            : prev,
        );
        if (normalizedLog) {
          setLogs((prev) => [normalizedLog, ...prev]);
        }
      }

      setQuantity("");
      setNote("");
      setShowForm(false);
    } catch (err: { message?: string } | Error | string | unknown) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : (err as any)?.message || "Failed to save log. Check console.";
      setFormErr(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkCompleted = async () => {
    if (!batch) return;
    try {
      const supabase = createClient();
      const { error: updErr } = await supabase
        .from("inventory_batches")
        .update({ status: "completed" })
        .eq("id", batchId);
      if (updErr) throw updErr;
      await fetchData();
    } catch (err: { message?: string } | Error | string | unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : (err as any)?.message || "Failed to mark completed.";
      console.error(
        "[InventoryDetail] mark completed error:",
        JSON.stringify(err, null, 2),
      );
      setError(msg);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error || !batch) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 text-red-600 bg-red-50 dark:bg-red-900/20 rounded-xl px-4 py-3 border border-red-100 dark:border-red-900/30 text-sm mb-4">
          <AlertCircle className="h-4 w-4" />
          {error || "Batch not found."}
        </div>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Inventory
        </button>
      </div>
    );
  }

  const usedCount = Math.max(0, batch.total_bottles - batch.remaining_bottles);
  const remainingCount = Math.max(0, batch.remaining_bottles);
  const usedPct =
    batch.total_bottles > 0
      ? Math.round((usedCount / batch.total_bottles) * 100)
      : 0;
  const remainingPct = Math.max(0, 100 - usedPct);

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Back */}
      <button
        onClick={() => router.push("/admin/inventory")}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Inventory
      </button>

      {/* Batch Header */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Package className="h-5 w-5 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {batch.batch_name}
              </h1>
              <span
                className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase ${
                  batch.status === "active"
                    ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                }`}
              >
                {batch.status}
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Client:{" "}
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {batch.client_name}
              </span>
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Dispatched:{" "}
              {new Date(batch.dispatched_at).toLocaleDateString("en-IN")}
            </p>
          </div>

          <div className="flex gap-3">
            {batch.status === "active" && (
              <>
                <button
                  onClick={() => setShowForm((s) => !s)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#0A66C2] hover:bg-[#004182] text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
                >
                  <Plus className="h-4 w-4" /> Add Entry
                </button>
                <button
                  onClick={handleMarkCompleted}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
                >
                  <CheckCircle className="h-4 w-4" /> Mark Completed
                </button>
              </>
            )}
          </div>
        </div>

        {/* Usage bar */}
        <div className="mt-6 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {batch.total_bottles.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-0.5">
              Total
            </p>
          </div>
          <div>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-300">
              {remainingCount.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-0.5">
              Remaining
            </p>
          </div>
          <div>
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-300">
              {usedCount.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-0.5">
              Used
            </p>
          </div>
        </div>
        <div className="mt-4 h-3 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden border border-gray-300 dark:border-gray-700">
          <div className="h-full flex">
            <div
              className="h-full bg-orange-500 dark:bg-orange-400 transition-all"
              style={{ width: `${usedPct}%` }}
            />
            <div
              className="h-full bg-emerald-500 dark:bg-emerald-400 transition-all"
              style={{ width: `${remainingPct}%` }}
            />
          </div>
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-300 mt-2">
          {batch.total_bottles.toLocaleString()} dispatched |{" "}
          <span className="font-semibold text-orange-600 dark:text-orange-300">
            {usedCount.toLocaleString()} used
          </span>{" "}
          |{" "}
          <span className="font-semibold text-emerald-600 dark:text-emerald-300">
            {remainingCount.toLocaleString()} remaining
          </span>
        </p>
      </div>

      {/* Add Entry Form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
          <h2 className="font-bold text-gray-900 dark:text-white mb-4">
            Add Inventory Entry
          </h2>
          <form onSubmit={handleAddLog} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Action Type
                </label>
                <select
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  value={actionType}
                  onChange={(e) => setActionType(e.target.value)}
                >
                  <option value="used">Used</option>
                  <option value="returned">Returned</option>
                  <option value="damaged">Damaged</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Quantity
                </label>
                <input
                  type="number"
                  min={1}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="50"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Note{" "}
                <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="e.g. Dinner service usage"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
            {formErr && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2 text-sm">
                <AlertCircle className="h-4 w-4" />
                {formErr}
              </div>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2 rounded-lg bg-[#0A66C2] hover:bg-[#004182] text-white text-sm font-medium transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Save Entry
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Logs Table */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="font-bold text-gray-900 dark:text-white">
            Activity Log
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-800/60 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3">Action</th>
                <th className="px-6 py-3 text-right">Quantity</th>
                <th className="px-6 py-3">Note</th>
                <th className="px-6 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {logs.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-10 text-center text-gray-400 dark:text-gray-500"
                  >
                    No activity logged yet.
                  </td>
                </tr>
              ) : (
                logs.map((l) => (
                  <tr
                    key={l.id}
                    className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase ${ACTION_COLORS[l.action_type] || ""}`}
                      >
                        {l.action_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-semibold text-gray-900 dark:text-white">
                      {l.quantity.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                      {l.note || "—"}
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {new Date(l.created_at).toLocaleString("en-IN")}
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
