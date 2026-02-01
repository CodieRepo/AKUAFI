'use client';

import { useEffect, useState } from 'react';
import CampaignTable, { Campaign } from '@/components/dashboard/CampaignTable';
import { supabase } from '@/lib/supabaseclient';

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCampaigns() {
      try {
        const { data, error } = await supabase
          .from('campaigns')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching campaigns:', error);
        } else {
          setCampaigns(data || []);
        }
      } catch (err) {
        console.error('Unexpected error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchCampaigns();
  }, []);

  return (
    <div className="space-y-8">
       <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
         <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Campaigns</h1>
            <p className="text-text-muted">Manage your bottle advertising campaigns.</p>
         </div>
         {/* New Campaign button removed as requested */}
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
             <p className="text-xs text-text-muted uppercase font-medium">Total Budget</p>
             <p className="text-2xl font-bold text-foreground mt-1">$45,000</p>
          </div>
          <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
             <p className="text-xs text-text-muted uppercase font-medium">Avg. CPR</p>
             <p className="text-2xl font-bold text-foreground mt-1">$0.85</p>
          </div>
          <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
             <p className="text-xs text-text-muted uppercase font-medium">Active Bottles</p>
             <p className="text-2xl font-bold text-foreground mt-1">85k</p>
          </div>
      </div>

      <CampaignTable campaigns={campaigns} loading={loading} />
    </div>
  );
}

