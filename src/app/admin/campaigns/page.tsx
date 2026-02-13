'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import CampaignTable, { Campaign } from '@/components/dashboard/CampaignTable';

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCampaigns = useCallback(async () => {
      try {
        setLoading(true);
        console.log('Fetching campaigns from API...');
        const res = await fetch('/api/admin/campaigns');

        if (!res.ok) {
             throw new Error(`API Error: ${res.status}`);
        }

        const data = await res.json();
        console.log('Campaigns data:', data);
        setCampaigns((data as Campaign[]) || []);
      } catch (err) {
        console.error('Unexpected error:', err);
      } finally {
        setLoading(false);
      }
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
            <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
            <p className="text-sm text-gray-500 mt-1">Manage your marketing campaigns here.</p>
        </div>
        <Link href="/admin/campaigns/new">
            <Button className="w-full sm:w-auto shadow-sm">
                <Plus className="h-4 w-4 mr-2" /> New Campaign
            </Button>
        </Link>
      </div>

      <CampaignTable 
        campaigns={campaigns} 
        loading={loading} 
        onRefresh={fetchCampaigns} 
      />
    </div>
  );
}
