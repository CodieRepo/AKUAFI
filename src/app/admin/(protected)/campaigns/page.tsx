"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { AdminButton } from "@/components/admin/ui/AdminButton";
import { AdminPageHeader } from "@/components/admin/ui/AdminPageHeader";
import CampaignTable, { Campaign } from "@/components/dashboard/CampaignTable";

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCampaigns = useCallback(async () => {
    try {
      setLoading(true);
      console.log("Fetching campaigns from API...");
      const res = await fetch("/api/admin/campaigns");

      if (!res.ok) {
        throw new Error(`API Error: ${res.status}`);
      }

      const data = await res.json();
      console.log("Campaigns data:", data);
      setCampaigns((data as Campaign[]) || []);
    } catch (err) {
      console.error("Unexpected error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  return (
    <div>
      <AdminPageHeader
        title="Campaigns"
        description="Create and manage marketing campaigns for your clients"
        actions={
          <Link href="/admin/campaigns/new">
            <AdminButton icon={<Plus className="h-4 w-4" />}>
              New Campaign
            </AdminButton>
          </Link>
        }
      />

      <CampaignTable
        campaigns={campaigns}
        loading={loading}
        onRefresh={fetchCampaigns}
      />
    </div>
  );
}
