"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  MessageSquare,
  ChevronRight,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";

type QueryRow = {
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

export default function ContactQueriesPage() {
  const [queries, setQueries] = useState<QueryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<string>("all");

  const fetchQueries = useCallback(async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      const { data, error: err } = await supabase
        .from("contact_queries")
        .select(
          "id, full_name, company, email, interest, message, status, created_at",
        )
        .order("created_at", { ascending: false });
      if (err) throw err;
      setQueries(data || []);
    } catch (err: Error | string | unknown) {
      setError("Failed to load contact queries.");
      console.error("[ContactQueries]", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQueries();
  }, [fetchQueries]);

  const today = new Date().toDateString();
  const totalQueries = queries.length;
  const todayQueries = queries.filter(
    (q) => new Date(q.created_at).toDateString() === today,
  ).length;
  const unreadQueries = queries.filter((q) => q.status === "new").length;
  const repliedQueries = queries.filter((q) => q.status === "replied").length;

  const filtered =
    filter === "all" ? queries : queries.filter((q) => q.status === filter);

  const metrics = [
    {
      label: "Total Queries",
      value: totalQueries,
      icon: "📬",
      color: "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400",
    },
    {
      label: "Today's Queries",
      value: todayQueries,
      icon: "📅",
      color:
        "bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400",
    },
    {
      label: "Unread",
      value: unreadQueries,
      icon: "🔵",
      color:
        "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400",
    },
    {
      label: "Replied",
      value: repliedQueries,
      icon: "✅",
      color:
        "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400",
    },
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <MessageSquare className="h-6 w-6 text-blue-600" /> Contact Queries
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Inquiries submitted through the Akuafi website
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 dark:bg-red-900/20 rounded-xl px-4 py-3 text-sm">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <div
            key={m.label}
            className={`rounded-xl p-4 ${m.color} border border-current/10`}
          >
            <div className="text-2xl mb-1">{m.icon}</div>
            <p className="text-xs font-semibold uppercase tracking-wider opacity-70">
              {m.label}
            </p>
            <p className="text-3xl font-bold mt-0.5">{m.value}</p>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {["all", "new", "read", "replied"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
              filter === f
                ? "bg-[#0A66C2] text-white border-[#0A66C2]"
                : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Queries Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-800/60 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Company</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Interest</th>
                <th className="px-6 py-3">Received</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-gray-400 dark:text-gray-500"
                  >
                    No queries{" "}
                    {filter !== "all" ? `with status "${filter}"` : "yet"}.
                  </td>
                </tr>
              ) : (
                filtered.map((q) => (
                  <tr
                    key={q.id}
                    className={`hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors ${q.status === "new" ? "font-medium" : ""}`}
                  >
                    <td className="px-6 py-4 text-gray-900 dark:text-white">
                      {q.full_name}
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                      {q.company || "—"}
                    </td>
                    <td className="px-6 py-4">
                      <a
                        href={`mailto:${q.email}`}
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {q.email}
                      </a>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                      {q.interest}
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {new Date(q.created_at).toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase ${STATUS_STYLES[q.status] || ""}`}
                      >
                        {q.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/contact-queries/${q.id}`}
                        className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-xs font-medium transition-colors"
                      >
                        View <ChevronRight className="h-3 w-3" />
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
