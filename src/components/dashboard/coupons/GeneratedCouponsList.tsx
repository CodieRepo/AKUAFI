"use client";

import { useState, useMemo } from "react";
import {
  Search,
  Filter,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  QrCode,
  Copy,
} from "lucide-react";
import { formatToISTCompact } from "@/lib/formatTimestamp";

export interface CouponData {
  id: string;
  coupon_code: string;
  status: "active" | "redeemed" | "expired" | "claimed";
  discount_value?: number | null; // Issue 3: discount amount assigned at generation
  generated_at: string;
  redeemed_at?: string | null;
  expires_at?: string | null;
  campaign_id?: string;
  location?: string | null;
  campaign_date?: string | null;
}

interface GeneratedCouponsListProps {
  coupons: CouponData[];
}

export default function GeneratedCouponsList({
  coupons = [],
}: GeneratedCouponsListProps) {
  const [filterStatus, setFilterStatus] = useState<
    "all" | "active" | "redeemed" | "expired"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [claimingId, setClaimingId] = useState<string | null>(null);

  // TEMPORARY DEBUG: Log raw coupon data on mount
  if (coupons.length > 0) {
    console.log("[DEBUG] GeneratedCouponsList - RAW coupons[0]:", coupons[0]);
    console.log(
      "[DEBUG] GeneratedCouponsList - redeemed_at type:",
      typeof coupons[0].redeemed_at,
      "value:",
      coupons[0].redeemed_at,
    );
  }

  // 1. Summary Metrics
  const summary = useMemo(() => {
    const totalDiscount = coupons.reduce(
      (sum, c) => sum + Number(c.discount_value || 0),
      0,
    );
    return {
      total: coupons.length,
      active: coupons.filter((c) => c.status === "active").length,
      redeemed: coupons.filter(
        (c) => c.status === "redeemed" || c.status === "claimed",
      ).length,
      expired: coupons.filter((c) => c.status === "expired").length,
      totalDiscount,
    };
  }, [coupons]);

  // 2. Filter & Search Logic
  const filteredCoupons = useMemo(() => {
    return coupons.filter((coupon) => {
      // Status Filter
      if (filterStatus !== "all") {
        if (filterStatus === "redeemed") {
          if (coupon.status !== "redeemed" && coupon.status !== "claimed")
            return false;
        } else {
          if (coupon.status !== filterStatus) return false;
        }
      }

      // Search Filter
      if (
        searchQuery &&
        !coupon.coupon_code.toLowerCase().includes(searchQuery.toLowerCase())
      )
        return false;

      return true;
    });
  }, [coupons, filterStatus, searchQuery]);

  const handleClaim = async (coupon: CouponData) => {
    if (
      !confirm(
        `Are you sure you want to mark coupon ${coupon.coupon_code} as claimed?`,
      )
    )
      return;

    setClaimingId(coupon.id);
    try {
      const res = await fetch("/api/coupons/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coupon_code: coupon.coupon_code }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to claim");

      alert("Coupon successfully marked as claimed!");
      window.location.reload();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setClaimingId(null);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-6 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <QrCode className="h-5 w-5 text-pink-500" />
            Generated Coupons
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Track issued QR coupons and their status.
          </p>
        </div>

        {/* Summary Pills */}
        <div className="flex flex-wrap gap-2">
          <div className="px-3 py-1 rounded-full bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-xs text-gray-600 dark:text-slate-300">
            Total:{" "}
            <span className="text-gray-900 dark:text-white font-bold">
              {summary.total}
            </span>
          </div>
          <div className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-slate-800 border border-emerald-100 dark:border-slate-700 text-xs text-gray-600 dark:text-slate-300">
            Redeemed:{" "}
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
              {summary.redeemed}
            </span>
          </div>
          <div className="px-3 py-1 rounded-full bg-blue-50 dark:bg-slate-800 border border-blue-100 dark:border-slate-700 text-xs text-gray-600 dark:text-slate-300">
            Active:{" "}
            <span className="text-blue-600 dark:text-blue-400 font-bold">
              {summary.active}
            </span>
          </div>
          {summary.totalDiscount > 0 && (
            <div className="px-3 py-1 rounded-full bg-green-50 dark:bg-slate-800 border border-green-100 dark:border-slate-700 text-xs text-gray-600 dark:text-slate-300">
              Discount Issued:{" "}
              <span className="text-green-700 dark:text-green-400 font-bold">
                ₹{summary.totalDiscount.toLocaleString()}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Controls: Search & Tabs */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search coupon code..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-slate-950/50 border border-gray-200 dark:border-slate-800 rounded-lg text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Tabs */}
        <div className="flex p-1 bg-gray-100 dark:bg-slate-950/50 rounded-lg border border-gray-200 dark:border-slate-800 w-full md:w-auto">
          {(["all", "active", "redeemed", "expired"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`flex-1 md:flex-none px-4 py-1.5 text-xs font-medium rounded-md transition-all ${
                filterStatus === status
                  ? "bg-white dark:bg-slate-800 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-500 dark:text-slate-500 hover:text-gray-900 dark:hover:text-slate-300"
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table Area */}
      <div className="rounded-xl border border-gray-200 dark:border-slate-800/50 overflow-hidden bg-gray-50 dark:bg-slate-950/30">
        {/* Zero State */}
        {coupons.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-slate-900 flex items-center justify-center mb-4">
              <QrCode className="h-6 w-6 text-gray-500 dark:text-slate-600" />
            </div>
            <h4 className="text-gray-900 dark:text-white font-medium mb-1">
              No coupons generated yet
            </h4>
            <p className="text-sm text-gray-500 dark:text-slate-500">
              Create a campaign to generate QR coupons.
            </p>
          </div>
        ) : filteredCoupons.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-slate-500 text-sm">
              No coupons match your filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-slate-800 scrollbar-track-transparent">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-100 dark:bg-slate-900/80 sticky top-0 backdrop-blur-sm z-10 text-gray-500 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider">
                    Coupon Code
                  </th>
                  <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider">
                    Discount
                  </th>
                  <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider">
                    Generated
                  </th>
                  <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider">
                    Redeemed
                  </th>
                  <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-slate-800/50">
                {filteredCoupons.map((coupon) => {
                  // Status Badging Logic
                  let statusBadgex;
                  if (coupon.status === "active") {
                    statusBadgex = (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border uppercase tracking-wider text-blue-400 bg-blue-500/10 border-blue-500/20">
                        Active
                      </span>
                    );
                  } else if (
                    coupon.status === "claimed" ||
                    coupon.status === "redeemed"
                  ) {
                    // Handle both claimed/redeemed as semantic 'redeemed'
                    statusBadgex = (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border-emerald-500/20">
                        Claimed
                      </span>
                    );
                  } else {
                    statusBadgex = (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border uppercase tracking-wider text-red-400 bg-red-500/10 border-red-500/20">
                        {coupon.status}
                      </span>
                    );
                  }

                  // Format Location Tag
                  const locTag = coupon.location || "-";

                  return (
                    <tr
                      key={coupon.id}
                      className="group hover:bg-gray-50 dark:hover:bg-slate-900/50 transition-colors"
                    >
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-gray-900 dark:text-white tracking-wide">
                            {coupon.coupon_code}
                          </span>
                          <button
                            onClick={() =>
                              navigator.clipboard.writeText(coupon.coupon_code)
                            }
                            className="opacity-0 group-hover:opacity-100 p-1 hover:text-gray-900 dark:hover:text-white text-gray-400 dark:text-slate-500 transition-opacity"
                            title="Copy"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <span className="text-gray-900 dark:text-white text-xs font-medium">
                          {locTag}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                        {coupon.discount_value != null
                          ? `₹${coupon.discount_value}`
                          : "—"}
                      </td>
                      <td className="px-6 py-3">{statusBadgex}</td>
                      <td className="px-6 py-3 text-gray-500 dark:text-slate-400 text-xs">
                        {formatToISTCompact(coupon.generated_at)}
                      </td>
                      <td className="px-6 py-3 text-gray-500 dark:text-slate-400 text-xs">
                        {coupon.redeemed_at
                          ? formatToISTCompact(coupon.redeemed_at)
                          : "-"}
                      </td>
                      <td className="px-6 py-3 text-gray-500 dark:text-slate-400 text-xs">
                        {coupon.status === "active" ? (
                          <button
                            onClick={() => handleClaim(coupon)}
                            disabled={claimingId === coupon.id}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[10px] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                          >
                            {claimingId === coupon.id ? (
                              <>Processing...</>
                            ) : (
                              <>Mark as Claimed</>
                            )}
                          </button>
                        ) : (
                          <span className="text-slate-600 text-[10px]">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
