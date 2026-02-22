"use client";

import { useEffect, useState } from "react";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import { AdminPageHeader } from "@/components/admin/ui/AdminPageHeader";
import { AdminCard } from "@/components/admin/ui/AdminCard";
import { AdminFormSection } from "@/components/admin/ui/AdminFormSection";
import { AdminBadge } from "@/components/admin/ui/AdminBadge";
import {
  Loader2,
  QrCode,
  CheckCircle,
  AlertCircle,
  Download,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Campaign {
  id: string;
  name: string;
}

export default function QRGeneratorPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [progress, setProgress] = useState<{
    current: number;
    total: number;
    status: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    campaign_id: "",
    quantity: "1000",
  });

  useEffect(() => {
    async function fetchCampaigns() {
      try {
        const res = await fetch("/api/admin/campaigns");

        if (!res.ok) throw new Error("Failed to load campaigns");

        const data = await res.json();
        setCampaigns(data || []);
      } catch (err) {
        console.error("Error fetching campaigns:", err);
      } finally {
        setFetching(false);
      }
    }
    fetchCampaigns();
  }, []);

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.campaign_id) {
      alert("Please select a campaign");
      return;
    }
    setLoading(true);
    setProgress(null);

    const totalQuantity = Number(formData.quantity);
    const BATCH_SIZE = 2000;
    const batches = Math.ceil(totalQuantity / BATCH_SIZE);

    try {
      for (let i = 0; i < batches; i++) {
        const currentBatchNum = i + 1;
        const remaining = totalQuantity - i * BATCH_SIZE;
        const batchQty = remaining > BATCH_SIZE ? BATCH_SIZE : remaining;

        setProgress({
          current: currentBatchNum,
          total: batches,
          status: `Generating batch ${currentBatchNum} of ${batches} (${batchQty} QRs)...`,
        });

        const response = await fetch("/api/admin/qr/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            campaign_id: formData.campaign_id,
            quantity: batchQty,
          }),
          credentials: "include", // CRITICAL for cookies
        });

        if (!response.ok) {
          const errData = await response
            .json()
            .catch(() => ({ error: "Unknown server error" }));
          throw new Error(errData.error || `Failed batch ${currentBatchNum}`);
        }

        const blob = await response.blob();
        const filename = `campaign_${formData.campaign_id}_batch_${currentBatchNum}.zip`;
        downloadBlob(blob, filename);
        await new Promise((r) => setTimeout(r, 1000));
      }

      setProgress({
        current: batches,
        total: batches,
        status: "All batches completed successfully!",
      });
    } catch (error: { message?: string } | Error | string | unknown) {
      const msg =
        error instanceof Error
          ? error.message
          : (typeof error === "object" && error !== null && "message" in error
              ? (error as { message: string }).message
              : null) || "Unknown error";
      alert(`Error: ${msg}`);
      setProgress((prev) =>
        prev ? { ...prev, status: `Failed: ${msg}` } : null,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <AdminPageHeader
        title="QR Code Generator"
        description="Generate bulk QR codes for your campaigns with secure batch processing"
        actions={
          <AdminBadge variant="info" size="md">
            <Sparkles className="h-3 w-3 mr-1" />
            Batch Processing
          </AdminBadge>
        }
      />

      <AdminFormSection>
        {/* Decorative background element */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-full blur-3xl opacity-50 pointer-events-none" />

        <form onSubmit={handleGenerate} className="space-y-8 relative z-10">
          {/* Step 1: Campaign Selection */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg">
                1
              </div>
              <div>
                <label className="block text-base font-bold text-gray-900 dark:text-white">
                  Select Campaign
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Choose which campaign to generate codes for
                </p>
              </div>
            </div>
            <div className="relative">
              <select
                className="w-full h-14 px-5 rounded-xl border-2 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-gray-900 text-base text-gray-900 dark:text-white appearance-none font-medium transition-all duration-200"
                value={formData.campaign_id}
                onChange={(e) =>
                  setFormData({ ...formData, campaign_id: e.target.value })
                }
                disabled={fetching || loading}
                required
              >
                <option value="">-- Choose Campaign --</option>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {/* Custom Arrow */}
              <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M4 6L8 10L12 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
            {fetching && (
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading campaigns...
              </div>
            )}
          </div>

          {/* Step 2: Quantity Selection */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg">
                2
              </div>
              <div className="flex-1">
                <label className="block text-base font-bold text-gray-900 dark:text-white">
                  Quantity
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Select how many QR codes to generate
                </p>
              </div>
              <AdminBadge variant="info" size="md">
                {Number(formData.quantity).toLocaleString()} codes
              </AdminBadge>
            </div>

            {/* Slider */}
            <div className="px-1 py-6 bg-gray-50 dark:bg-white/5 rounded-xl">
              <input
                type="range"
                min="100"
                max="10000"
                step="100"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({ ...formData, quantity: e.target.value })
                }
                className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600 dark:accent-blue-500"
                disabled={loading}
              />
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-3 px-1">
                <span>100</span>
                <span>2,500</span>
                <span>5,000</span>
                <span>7,500</span>
                <span>10,000</span>
              </div>
            </div>

            {/* Manual Input */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2 block">
                  Manual Input
                </label>
                <input
                  type="number"
                  className="w-full h-12 px-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none font-mono text-base text-gray-900 dark:text-white"
                  value={formData.quantity}
                  onChange={(e) => {
                    let val = parseInt(e.target.value);
                    if (val > 10000) val = 10000;
                    if (val < 1) val = 1;
                    setFormData({ ...formData, quantity: val.toString() });
                  }}
                  min="1"
                  max="10000"
                  required
                  disabled={loading}
                />
              </div>
              <div className="flex flex-col justify-end">
                <div className="h-12 px-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/30 flex items-center gap-2 text-amber-700 dark:text-amber-400">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span className="text-sm font-medium">Max 10,000</span>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Display */}
          <AnimatePresence>
            {progress && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="overflow-hidden"
              >
                <AdminCard
                  className={`p-6 ${
                    progress.status.includes("Failed")
                      ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900/30"
                      : progress.status.includes("completed")
                        ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900/30"
                        : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-900/30"
                  }`}
                >
                  <div className="flex flex-col items-center text-center">
                    {progress.status.includes("completed") ? (
                      <div className="h-16 w-16 rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
                        <CheckCircle
                          className="h-8 w-8 text-green-600 dark:text-green-400"
                          strokeWidth={2.5}
                        />
                      </div>
                    ) : progress.status.includes("Failed") ? (
                      <div className="h-16 w-16 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                        <AlertCircle
                          className="h-8 w-8 text-red-600 dark:text-red-400"
                          strokeWidth={2.5}
                        />
                      </div>
                    ) : (
                      <div className="h-16 w-16 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
                        <Loader2
                          className="h-8 w-8 text-blue-600 dark:text-blue-400 animate-spin"
                          strokeWidth={2.5}
                        />
                      </div>
                    )}
                    <div className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
                      Batch {progress.current} / {progress.total}
                    </div>
                    <p
                      className={`text-base font-medium ${
                        progress.status.includes("Failed")
                          ? "text-red-700 dark:text-red-400"
                          : progress.status.includes("completed")
                            ? "text-green-700 dark:text-green-400"
                            : "text-blue-700 dark:text-blue-400"
                      }`}
                    >
                      {progress.status}
                    </p>
                    {progress.status.includes("completed") && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        Check your downloads folder for the ZIP files
                      </p>
                    )}
                  </div>
                </AdminCard>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit Button */}
          <AdminButton
            type="submit"
            disabled={loading || fetching}
            loading={loading}
            fullWidth
            size="lg"
            icon={
              loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Download className="h-5 w-5" />
              )
            }
          >
            {loading ? "Generating..." : "Generate & Download"}
          </AdminButton>

          {/* Info Text */}
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            <p>
              Codes are generated in batches of 2,000 for optimal performance
            </p>
          </div>
        </form>
      </AdminFormSection>
    </div>
  );
}
