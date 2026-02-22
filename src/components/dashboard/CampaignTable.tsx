"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Eye,
  Pause,
  Play,
  CheckCircle,
  AlertTriangle,
  Loader2,
  QrCode,
} from "lucide-react";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import { AdminBadge } from "@/components/admin/ui/AdminBadge";
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
import { StatusBadge } from "@/components/admin/ui/StatusBadge";
import { motion, AnimatePresence } from "framer-motion";
import { formatUtcToIst } from "@/lib/formatTimestamp";

export interface Campaign {
  id: string;
  name: string;
  status: string;
  total_scans: number; // New Counter
  redeemed_count: number; // New Counter
  created_at: string;
  start_date: string;
  end_date: string;
  location: string | null;
  campaign_date: string | null;
  client_id?: string;
}

function formatDateTag(dateString: string | null) {
  if (!dateString) return "";
  return formatUtcToIst(dateString, {
    year: "numeric",
    day: undefined,
    hour: undefined,
    minute: undefined,
    second: undefined,
    month: "short",
  });
}

interface CampaignTableProps {
  campaigns: Campaign[];
  loading?: boolean;
  onRefresh?: () => void;
}

export default function CampaignTable({
  campaigns,
  loading,
  onRefresh,
}: CampaignTableProps) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [confirmData, setConfirmData] = useState<{
    id: string;
    status: string;
    name: string;
  } | null>(null);

  // Status Change Handler
  const handleStatusChange = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch("/api/admin/campaigns/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaign_id: id, status: newStatus }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to update status");
      } else {
        // Success
        if (onRefresh) onRefresh();
      }
    } catch (error) {
      console.error("Status update failed", error);
      alert("Network error. Please try again.");
    } finally {
      setUpdatingId(null);
      setConfirmData(null);
    }
  };

  if (loading) {
    return <AdminLoadingState text="Loading campaigns..." />;
  }

  if (campaigns.length === 0) {
    return (
      <AdminEmptyState
        icon={QrCode}
        title="No campaigns yet"
        description="Create your first campaign to get started with QR code generation"
      />
    );
  }

  return (
    <>
      {/* Simple Confirmation Modal Overlay */}
      <AnimatePresence>
        {confirmData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-8 border border-gray-200 dark:border-gray-700"
            >
              <div className="mb-6">
                <div className="h-14 w-14 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                  <AlertTriangle className="h-7 w-7" strokeWidth={2.5} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Confirm Status Change
                </h3>
                <p className="text-base text-gray-600 dark:text-gray-400 mt-3">
                  Change{" "}
                  <strong className="text-gray-900 dark:text-white">
                    {confirmData.name}
                  </strong>{" "}
                  to{" "}
                  <span className="uppercase font-semibold text-blue-600 dark:text-blue-400">
                    {confirmData.status}
                  </span>
                  ?
                </p>
              </div>
              <div className="flex justify-end gap-3">
                <AdminButton
                  variant="secondary"
                  onClick={() => setConfirmData(null)}
                  disabled={!!updatingId}
                >
                  Cancel
                </AdminButton>
                <AdminButton
                  variant="primary"
                  onClick={() =>
                    handleStatusChange(confirmData.id, confirmData.status)
                  }
                  loading={!!updatingId}
                >
                  Confirm Change
                </AdminButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AdminTable>
        <AdminTableHeader>
          <tr>
            <AdminTableHeadCell>Campaign Name</AdminTableHeadCell>
            <AdminTableHeadCell>Location / Tag</AdminTableHeadCell>
            <AdminTableHeadCell>Status</AdminTableHeadCell>
            <AdminTableHeadCell align="right">Total Scans</AdminTableHeadCell>
            <AdminTableHeadCell align="right">Redeemed</AdminTableHeadCell>
            <AdminTableHeadCell>Claim Rate</AdminTableHeadCell>
            <AdminTableHeadCell align="center">Actions</AdminTableHeadCell>
          </tr>
        </AdminTableHeader>
        <AdminTableBody>
          {campaigns.map((campaign, idx) => {
            const status = campaign.status || "draft";
            const isUpdating = updatingId === campaign.id;

            // Use new counters with fallback
            const scans = campaign.total_scans ?? 0;
            const redeemed = campaign.redeemed_count ?? 0;
            const progress =
              scans > 0 ? Math.round((redeemed / scans) * 100) : 0;

            // Tag Logic: Location + Date
            const tag = campaign.location || "Global";
            const dateTag = formatDateTag(campaign.campaign_date);

            return (
              <AdminTableRow key={campaign.id}>
                <AdminTableCell>
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg">
                      <QrCode className="h-5 w-5" strokeWidth={2.5} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {campaign.name}
                      </p>
                      <p className="text-xs text-gray-400 font-mono">
                        {campaign.id.slice(0, 12)}...
                      </p>
                    </div>
                  </div>
                </AdminTableCell>
                <AdminTableCell>
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-900 dark:text-gray-200">
                      {tag}
                    </span>
                    {dateTag && (
                      <span className="text-xs text-gray-500">{dateTag}</span>
                    )}
                  </div>
                </AdminTableCell>
                <AdminTableCell>
                  <StatusBadge status={status} />
                </AdminTableCell>
                <AdminTableCell align="right">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {scans.toLocaleString()}
                  </span>
                </AdminTableCell>
                <AdminTableCell align="right">
                  <span className="text-gray-600 dark:text-gray-400">
                    {redeemed.toLocaleString()}
                  </span>
                </AdminTableCell>

                {/* Claim Rate — colour-coded by threshold */}
                <AdminTableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-full max-w-[120px]">
                      <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${
                            progress >= 15
                              ? "bg-gradient-to-r from-emerald-500 to-green-400"
                              : progress >= 5
                                ? "bg-gradient-to-r from-amber-500 to-yellow-400"
                                : "bg-gradient-to-r from-red-500 to-rose-400"
                          }`}
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                        />
                      </div>
                    </div>
                    <AdminBadge
                      variant={
                        progress >= 15
                          ? "success"
                          : progress >= 5
                            ? "warning"
                            : "error"
                      }
                      size="sm"
                    >
                      {progress}%
                    </AdminBadge>
                  </div>
                </AdminTableCell>

                <AdminTableCell align="center">
                  <div className="flex items-center justify-center gap-2">
                    <Link href={`/admin/campaign/${campaign.id}`}>
                      <AdminButton
                        size="sm"
                        variant="ghost"
                        icon={<Eye className="h-4 w-4" />}
                      >
                        View
                      </AdminButton>
                    </Link>

                    {/* Action Buttons based on Status */}

                    {status === "draft" && (
                      <AdminButton
                        size="sm"
                        variant="success"
                        onClick={() =>
                          setConfirmData({
                            id: campaign.id,
                            status: "active",
                            name: campaign.name,
                          })
                        }
                        disabled={isUpdating}
                      >
                        Activate
                      </AdminButton>
                    )}

                    {status === "active" && (
                      <>
                        <AdminButton
                          size="sm"
                          variant="ghost"
                          icon={<Pause className="h-4 w-4" />}
                          onClick={() =>
                            setConfirmData({
                              id: campaign.id,
                              status: "paused",
                              name: campaign.name,
                            })
                          }
                          disabled={isUpdating}
                        >
                          Pause
                        </AdminButton>
                        <AdminButton
                          size="sm"
                          variant="ghost"
                          icon={<CheckCircle className="h-4 w-4" />}
                          onClick={() =>
                            setConfirmData({
                              id: campaign.id,
                              status: "completed",
                              name: campaign.name,
                            })
                          }
                          disabled={isUpdating}
                        >
                          Complete
                        </AdminButton>
                      </>
                    )}

                    {status === "paused" && (
                      <AdminButton
                        size="sm"
                        variant="secondary"
                        icon={<Play className="h-4 w-4" />}
                        onClick={() =>
                          setConfirmData({
                            id: campaign.id,
                            status: "active",
                            name: campaign.name,
                          })
                        }
                        disabled={isUpdating}
                      >
                        Resume
                      </AdminButton>
                    )}

                    {status === "completed" && (
                      <span className="text-xs text-gray-400 dark:text-gray-600 italic">
                        Completed
                      </span>
                    )}
                  </div>
                </AdminTableCell>
              </AdminTableRow>
            );
          })}
        </AdminTableBody>
      </AdminTable>

      {/* Confirmation Modal */}
      {confirmData && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-6">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-200 dark:border-gray-800">
            <h3 className="text-lg font-bold mb-3 text-gray-900 dark:text-white">
              Confirm Action
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to{" "}
              {confirmData.status === "active" ? "resume" : "pause"} the
              campaign{" "}
              <span className="font-semibold text-gray-900 dark:text-white">
                {confirmData.name}
              </span>
              ?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmData(null)}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  handleStatusChange(confirmData.id, confirmData.status)
                }
                disabled={updatingId !== null}
                className="flex-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-lg disabled:opacity-60 transition-colors"
              >
                {updatingId === confirmData.id ? "Updating..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
