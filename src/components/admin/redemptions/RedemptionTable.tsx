"use client";

import { motion } from "framer-motion";
import {
  AdminTable,
  AdminTableHeader,
  AdminTableHeadCell,
  AdminTableBody,
  AdminTableRow,
  AdminTableCell,
} from "@/components/admin/ui/AdminTable";
import { AdminEmptyState } from "@/components/admin/ui/AdminEmptyState";
import { AdminLoadingState } from "@/components/admin/ui/AdminLoadingState";
import { AdminBadge } from "@/components/admin/ui/AdminBadge";
import { StatusBadge } from "@/components/admin/ui/StatusBadge";
import { QrCode, User, Calendar, Tag, Ticket } from "lucide-react";
import { formatToISTCompact } from "@/lib/formatTimestamp";

export interface Redemption {
  id: string;
  qr_token: string;
  campaign_name: string;
  phone: string;
  coupon_code: string;
  coupon_status?: string;
  discount_value?: number;
  redeemed_at: string;
  user_name?: string; // If available
  bottle_id?: string;
}

interface RedemptionTableProps {
  redemptions: Redemption[];
  loading?: boolean;
}

function formatINR(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export default function RedemptionTable({
  redemptions,
  loading,
}: RedemptionTableProps) {
  // TEMPORARY DEBUG LOGS - IST CONVERSION DEBUGGING
  if (redemptions.length > 0) {
    const firstRedemption = redemptions[0];
    console.log(
      "[DEBUG] RedemptionTable.tsx - RAW redeemed_at:",
      firstRedemption.redeemed_at,
      "typeof:",
      typeof firstRedemption.redeemed_at,
    );
    console.log(
      "[DEBUG] RedemptionTable.tsx - Formatted IST:",
      formatToISTCompact(firstRedemption.redeemed_at),
    );
  }

  if (loading && redemptions.length === 0) {
    return <AdminLoadingState text="Scanning for redemptions..." />;
  }

  if (redemptions.length === 0) {
    return (
      <AdminEmptyState
        icon={QrCode}
        title="No redemptions found"
        description="Try adjusting your filters or wait for new scans to appear"
      />
    );
  }

  return (
    <AdminTable>
      <AdminTableHeader>
        <tr>
          <AdminTableHeadCell>Time</AdminTableHeadCell>
          <AdminTableHeadCell>Campaign</AdminTableHeadCell>
          <AdminTableHeadCell>User Details</AdminTableHeadCell>
          <AdminTableHeadCell>Coupon</AdminTableHeadCell>
          <AdminTableHeadCell align="right">Status</AdminTableHeadCell>
        </tr>
      </AdminTableHeader>
      <AdminTableBody>
        {redemptions.map((r, idx) => (
          <AdminTableRow key={r.id + r.qr_token}>
            <AdminTableCell>
              <div className="flex items-center gap-2.5 text-gray-600 dark:text-gray-400">
                <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="font-medium">
                  {formatToISTCompact(r.redeemed_at)}
                </span>
              </div>
            </AdminTableCell>
            <AdminTableCell>
              <div className="flex items-center gap-2.5">
                <Tag className="h-4 w-4 text-purple-500" />
                <span className="font-semibold text-gray-900 dark:text-white">
                  {r.campaign_name || "Unknown"}
                </span>
              </div>
            </AdminTableCell>
            <AdminTableCell>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-400 shadow-sm">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {r.user_name || r.phone}
                  </div>
                  {r.user_name && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                      {r.phone}
                    </div>
                  )}
                </div>
              </div>
            </AdminTableCell>
            <AdminTableCell>
              <div className="flex items-center gap-2.5">
                <Ticket className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
                {r.coupon_code && r.coupon_code !== "-" ? (
                  <div className="flex items-center gap-2">
                    <AdminBadge variant="success" size="md">
                      {r.coupon_code}
                    </AdminBadge>
                    {r.discount_value && (
                      <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                        {formatINR(r.discount_value)}
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-gray-400 dark:text-gray-600 text-sm">
                    —
                  </span>
                )}
              </div>
            </AdminTableCell>
            <AdminTableCell align="right">
              <StatusBadge status="redeemed" />
            </AdminTableCell>
          </AdminTableRow>
        ))}
      </AdminTableBody>
    </AdminTable>
  );
}
