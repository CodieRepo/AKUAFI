"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  MessageSquare,
  ChevronRight,
  Loader2,
  AlertCircle,
  Mail,
  Calendar,
  CheckCircle,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { formatToISTDate, istDateKey } from "@/lib/formatTimestamp";
import { AdminPageHeader } from "@/components/admin/ui/AdminPageHeader";
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

  const today = istDateKey(new Date());
  const totalQueries = queries.length;
  const todayQueries = queries.filter(
    (q) => istDateKey(q.created_at) === today,
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
    return <AdminLoadingState />;
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <AdminPageHeader
        title="Contact Queries"
        description="Inquiries submitted through the Akuafi website"
      />

      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 dark:bg-red-900/20 rounded-xl px-4 py-3 text-sm">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <AdminStatCard
          label="Total Queries"
          value={totalQueries}
          icon={<MessageSquare className="h-5 w-5" strokeWidth={2.5} />}
          iconColor="text-blue-600 dark:text-blue-400"
          description="All time inquiries"
        />
        <AdminStatCard
          label="Today's Queries"
          value={todayQueries}
          icon={<Calendar className="h-5 w-5" strokeWidth={2.5} />}
          iconColor="text-violet-600 dark:text-violet-400"
          description="Received today"
        />
        <AdminStatCard
          label="Unread"
          value={unreadQueries}
          icon={<Mail className="h-5 w-5" strokeWidth={2.5} />}
          iconColor="text-amber-600 dark:text-amber-400"
          description="Awaiting review"
        />
        <AdminStatCard
          label="Replied"
          value={repliedQueries}
          icon={<CheckCircle className="h-5 w-5" strokeWidth={2.5} />}
          iconColor="text-green-600 dark:text-green-400"
          description="Response sent"
        />
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
      {filtered.length === 0 ? (
        <AdminEmptyState
          icon={<MessageSquare className="h-8 w-8" strokeWidth={1.5} />}
          title={filter === "all" ? "No queries yet" : `No ${filter} queries`}
          description={
            filter === "all"
              ? "Contact queries from your website will appear here"
              : `No queries with status "${filter}" at the moment`
          }
        />
      ) : (
        <AdminTable>
          <AdminTableHeader>
            <AdminTableRow>
              <AdminTableHeadCell>Name</AdminTableHeadCell>
              <AdminTableHeadCell>Company</AdminTableHeadCell>
              <AdminTableHeadCell>Email</AdminTableHeadCell>
              <AdminTableHeadCell>Interest</AdminTableHeadCell>
              <AdminTableHeadCell>Received</AdminTableHeadCell>
              <AdminTableHeadCell>Status</AdminTableHeadCell>
              <AdminTableHeadCell> </AdminTableHeadCell>
            </AdminTableRow>
          </AdminTableHeader>
          <AdminTableBody>
            {filtered.map((q) => (
              <AdminTableRow
                key={q.id}
                className={q.status === "new" ? "font-medium" : ""}
              >
                <AdminTableCell>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                      <MessageSquare className="h-5 w-5 text-white" />
                    </div>
                    <span className="font-semibold">{q.full_name}</span>
                  </div>
                </AdminTableCell>
                <AdminTableCell>
                  <span className="text-gray-500 dark:text-gray-400">
                    {q.company || "—"}
                  </span>
                </AdminTableCell>
                <AdminTableCell>
                  <a
                    href={`mailto:${q.email}`}
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {q.email}
                  </a>
                </AdminTableCell>
                <AdminTableCell>
                  <span className="text-gray-600 dark:text-gray-300">
                    {q.interest}
                  </span>
                </AdminTableCell>
                <AdminTableCell>
                  <span className="text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {formatToISTDate(q.created_at)}
                  </span>
                </AdminTableCell>
                <AdminTableCell>
                  <AdminBadge
                    variant={
                      q.status === "new"
                        ? "info"
                        : q.status === "replied"
                          ? "success"
                          : "warning"
                    }
                  >
                    {q.status}
                  </AdminBadge>
                </AdminTableCell>
                <AdminTableCell>
                  <Link
                    href={`/admin/contact-queries/${q.id}`}
                    className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-xs font-medium transition-colors"
                  >
                    View <ChevronRight className="h-3 w-3" />
                  </Link>
                </AdminTableCell>
              </AdminTableRow>
            ))}
          </AdminTableBody>
        </AdminTable>
      )}
    </div>
  );
}
