"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import { Search, RefreshCw, Smartphone, QrCode } from "lucide-react";
import RedemptionTable, {
  Redemption,
} from "@/components/admin/redemptions/RedemptionTable";
import { AdminPageHeader } from "@/components/admin/ui/AdminPageHeader";
import { AdminStatCard } from "@/components/admin/ui/AdminStatCard";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import { AdminCard } from "@/components/admin/ui/AdminCard";
import { AdminBadge } from "@/components/admin/ui/AdminBadge";
import { istDateKey } from "@/lib/formatTimestamp";

export default function RedemptionsPage() {
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<"all" | "today" | "7days">("all");
  const [selectedCampaign, setSelectedCampaign] = useState<string>("all");

  // Fetch Data Function
  const fetchRedemptions = async (silent = false) => {
    if (!silent) setLoading(true);
    else setIsRefreshing(true);

    try {
      const supabase = createClient();

      // Use campaign_user_details_v1 — guaranteed to have campaign_name (no UUID fallback)
      const { data, error } = await supabase
        .from("campaign_user_details_v1")
        .select(
          "campaign_name, user_name, phone, coupon_code, discount_value, status, redeemed_at",
        )
        .eq("status", "claimed")
        .order("redeemed_at", { ascending: false });

      if (error) {
        console.error("[Redemptions] fetch error:", error);
        setRedemptions([]);
      } else {
        console.log(
          "[Redemptions] fetched from campaign_user_details_v1:",
          data?.length,
        );
        // TEMPORARY DEBUG: Log raw DB value for first record
        if (data && data.length > 0) {
          console.log(
            "[DEBUG] RAW DB redeemed_at (first record):",
            data[0].redeemed_at,
            "typeof:",
            typeof data[0].redeemed_at,
          );
        }
        const mapped = (data || []).map(
          (
            row: {
              campaign_name?: string;
              phone?: string;
              coupon_code?: string;
              status?: string;
              discount_value?: number | null;
              redeemed_at?: string | null;
              user_name?: string;
            },
            idx: number,
          ) => ({
            id: String(idx), // no raw ID needed
            qr_token: "", // not shown in UI
            campaign_name: row.campaign_name || "Unknown Campaign",
            phone: row.phone || "N/A",
            coupon_code: row.coupon_code || "-",
            coupon_status: row.status || "claimed",
            discount_value: row.discount_value ?? undefined,
            redeemed_at: row.redeemed_at || "",
            user_name: row.user_name,
          }),
        );
        setRedemptions(mapped);
      }
    } catch (err) {
      console.error("[Redemptions] unexpected error:", err);
    } finally {
      if (!silent) setLoading(false);
      else setIsRefreshing(false);
    }
  };

  // Initial Fetch & Auto Refresh
  useEffect(() => {
    fetchRedemptions();

    const interval = setInterval(() => {
      fetchRedemptions(true);
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, []);

  // Filter Logic
  const filteredData = useMemo(() => {
    let filtered = redemptions;

    // 1. Search (Name, Phone, QR, Coupon)
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.phone?.includes(q) ||
          r.campaign_name?.toLowerCase().includes(q) ||
          r.qr_token?.toLowerCase().includes(q) ||
          r.coupon_code?.toLowerCase().includes(q),
      );
    }

    // 2. Campaign Filter
    if (selectedCampaign !== "all") {
      filtered = filtered.filter((r) => r.campaign_name === selectedCampaign);
    }

    // 3. Date Range
    if (dateRange !== "all") {
      const todayKey = istDateKey(new Date());
      const last7Keys = new Set<string>();
      for (let i = 0; i <= 7; i++) {
        const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        const key = istDateKey(d);
        if (key) last7Keys.add(key);
      }

      filtered = filtered.filter((r) => {
        const key = istDateKey(r.redeemed_at);
        if (dateRange === "today") return key === todayKey;
        if (dateRange === "7days") return last7Keys.has(key);
        return true;
      });
    }

    return filtered;
  }, [redemptions, searchQuery, selectedCampaign, dateRange]);

  // Derived Stats
  const totalScans = filteredData.length;
  const uniqueUsers = new Set(filteredData.map((r) => r.phone)).size;
  // Unique campaigns for filter dropdown
  const campaigns = Array.from(new Set(redemptions.map((r) => r.campaign_name)))
    .filter(Boolean)
    .sort();

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Redemptions Monitor"
        description="Real-time view of coupon claims and user activity"
        actions={
          <div className="flex items-center gap-3">
            {isRefreshing && (
              <AdminBadge variant="info" size="md">
                <RefreshCw className="h-3 w-3 mr-1.5 animate-spin" />
                Syncing...
              </AdminBadge>
            )}
            <AdminButton
              variant="secondary"
              size="sm"
              onClick={() => fetchRedemptions()}
              disabled={isRefreshing || loading}
              icon={
                <RefreshCw
                  className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
                />
              }
            >
              Refresh
            </AdminButton>
          </div>
        }
      />

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <AdminStatCard
          label="Total Redemptions"
          value={totalScans}
          icon={<QrCode className="h-5 w-5" strokeWidth={2.5} />}
          iconColor="text-blue-600 dark:text-blue-400"
          loading={loading}
          description="All-time claims"
        />
        <AdminStatCard
          label="Unique Users"
          value={uniqueUsers}
          icon={<Smartphone className="h-5 w-5" strokeWidth={2.5} />}
          iconColor="text-purple-600 dark:text-purple-400"
          loading={loading}
          description="Distinct phone numbers"
        />
        <AdminCard hover className="p-6">
          <div className="flex flex-col items-center justify-center text-center h-full">
            <div className="flex items-center gap-2 mb-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
              </span>
              <span className="text-base font-bold text-green-600 dark:text-green-400">
                Live System
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Auto-refreshing every 10 seconds
            </p>
          </div>
        </AdminCard>
      </div>

      {/* Filters Bar */}
      <AdminCard className="p-5" noPadding={false}>
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search phone, campaign, code..."
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white transition-all duration-200"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto">
            <select
              className="h-10 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-gray-300 transition-all duration-200"
              value={selectedCampaign}
              onChange={(e) => setSelectedCampaign(e.target.value)}
            >
              <option value="all">All Campaigns</option>
              {campaigns.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setDateRange("all")}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
                  dateRange === "all"
                    ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                }`}
              >
                All Time
              </button>
              <button
                onClick={() => setDateRange("7days")}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
                  dateRange === "7days"
                    ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                }`}
              >
                7 Days
              </button>
              <button
                onClick={() => setDateRange("today")}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
                  dateRange === "today"
                    ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                }`}
              >
                Today
              </button>
            </div>
          </div>
        </div>
      </AdminCard>

      <RedemptionTable
        redemptions={filteredData}
        loading={loading && !isRefreshing}
      />
    </div>
  );
}
