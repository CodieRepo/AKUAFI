"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  MessageSquare,
  Loader2,
  AlertCircle,
  CheckCircle,
  Mail,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { formatUtcToIst } from "@/lib/formatTimestamp";

type QueryDetail = {
  id: string;
  full_name: string;
  company: string | null;
  email: string;
  interest: string;
  message: string;
  status: "new" | "read" | "replied";
  created_at: string;
};

const STATUS_STYLES: Record<string, string> = {
  new: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
  read: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300",
  replied:
    "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300",
};

export default function ContactQueryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryId = params?.id as string;

  const [query, setQuery] = useState<QueryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);
  const [toast, setToast] = useState("");

  const fetchQuery = useCallback(async () => {
    if (!queryId) return;
    try {
      setLoading(true);
      const supabase = createClient();
      const { data, error: err } = await supabase
        .from("contact_queries")
        .select("*")
        .eq("id", queryId)
        .maybeSingle();
      if (err) throw err;
      if (!data) {
        setError("Query not found.");
        return;
      }
      setQuery(data);

      // Auto-mark as read when opened (if currently new)
      if (data.status === "new") {
        await supabase
          .from("contact_queries")
          .update({ status: "read" })
          .eq("id", queryId);
        setQuery((prev) => (prev ? { ...prev, status: "read" } : prev));
      }
    } catch (err: Error | string | unknown) {
      setError("Failed to load query.");
      console.error("[ContactQueryDetail]", err);
    } finally {
      setLoading(false);
    }
  }, [queryId]);

  useEffect(() => {
    fetchQuery();
  }, [fetchQuery]);

  const updateStatus = async (newStatus: "read" | "replied") => {
    if (!query) return;
    setUpdating(true);
    try {
      const supabase = createClient();
      const { error: err } = await supabase
        .from("contact_queries")
        .update({ status: newStatus })
        .eq("id", queryId);
      if (err) throw err;
      setQuery((prev) => (prev ? { ...prev, status: newStatus } : prev));
      setToast(`Marked as ${newStatus}.`);
      setTimeout(() => setToast(""), 3000);
    } catch (err: { message?: string } | Error | string | unknown) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : (err as any)?.message || "Failed to update status.";
      setError(errorMsg);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error || !query) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 text-red-600 bg-red-50 dark:bg-red-900/20 rounded-xl px-4 py-3 text-sm mb-4 border border-red-100 dark:border-red-900/30">
          <AlertCircle className="h-4 w-4" />
          {error || "Query not found."}
        </div>
        <button
          onClick={() => router.push("/admin/contact-queries")}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      {/* Toast */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-800 px-4 py-3 rounded-xl shadow-xl text-sm font-medium">
          <CheckCircle className="h-4 w-4 text-emerald-500" />
          {toast}
        </div>
      )}

      {/* Back */}
      <button
        onClick={() => router.push("/admin/contact-queries")}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Contact Queries
      </button>

      {/* Detail Card */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        {/* Card Header */}
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-blue-500 to-violet-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
              {query.full_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                {query.full_name}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {query.company || "No company"}
              </p>
            </div>
          </div>
          <span
            className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold uppercase shrink-0 ${STATUS_STYLES[query.status]}`}
          >
            {query.status}
          </span>
        </div>

        {/* Fields */}
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
                Email
              </p>
              <a
                href={`mailto:${query.email}`}
                className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium flex items-center gap-1"
              >
                <Mail className="h-3.5 w-3.5" />
                {query.email}
              </a>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
                Interest
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {query.interest}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
                Received
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {formatUtcToIst(query.created_at)}
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
              Message
            </p>
            <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl px-5 py-4 text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed border border-gray-100 dark:border-gray-700">
              {query.message}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40 flex flex-wrap gap-3">
          <a
            href={`mailto:${query.email}?subject=Re: ${encodeURIComponent(query.interest)} – Akuafi`}
            className="flex items-center gap-2 px-4 py-2 bg-[#0A66C2] hover:bg-[#004182] text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Mail className="h-4 w-4" /> Reply via Email
          </a>
          {query.status !== "read" && (
            <button
              disabled={updating}
              onClick={() => updateStatus("read")}
              className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/30 rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
            >
              {updating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MessageSquare className="h-4 w-4" />
              )}
              Mark as Read
            </button>
          )}
          {query.status !== "replied" && (
            <button
              disabled={updating}
              onClick={() => updateStatus("replied")}
              className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-900/30 rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
            >
              {updating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              Mark as Replied
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
