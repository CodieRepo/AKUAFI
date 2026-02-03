'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabaseclient';
import { Plus, Search, Calendar, Tag } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Campaign {
  id: string;
  name: string;
  status?: string;
  start_date: string;
  end_date: string;
  // Coupon fields ignored for now as they are not in DB, but keeping optional for TS safety if needed later
  coupon_type?: string;
  coupon_min_value?: number;
  coupon_max_value?: number;
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCampaigns() {
      try {
        const supabase = getSupabaseClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const res = await fetch('/api/admin/campaigns', {
            headers: { Authorization: `Bearer ${session.access_token}` },
            cache: 'no-store'
        });
        if (res.ok) {
            setCampaigns(await res.json());
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchCampaigns();
  }, []);

  return (
    <div className="max-w-4xl">
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

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[400px]">
        {loading ? (
            <div className="p-8 text-center text-gray-500">Loading campaigns...</div>
        ) : campaigns.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                <div className="h-16 w-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-6">
                    <Tag className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">No campaigns yet</h3>
                <p className="text-gray-500 mt-2 mb-8 max-w-sm text-sm">
                    Create your first campaign to define coupon rules and start generating QR codes.
                </p>
                <Link href="/admin/campaigns/new">
                    <Button size="default" className="shadow-md">
                        <Plus className="h-4 w-4 mr-2" /> Create First Campaign
                    </Button>
                </Link>
            </div>
        ) : (
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-500 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider">Duration</th>
                            <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {campaigns.map((camp) => {
                            const now = new Date();
                            const end = new Date(camp.end_date);
                            const isExpired = now > end;
                            const status = isExpired ? 'expired' : camp.status || 'draft';
                            
                            // Color mapping for status
                            const statusStyles = {
                                active: 'bg-green-50 text-green-700 border-green-200',
                                draft: 'bg-yellow-50 text-yellow-700 border-yellow-200',
                                paused: 'bg-gray-50 text-gray-700 border-gray-200',
                                expired: 'bg-red-50 text-red-700 border-red-200'
                            };

                            return (
                            <tr key={camp.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-3 font-medium text-gray-900">{camp.name}</td>
                                <td className="px-6 py-3">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border capitalize
                                        ${statusStyles[status as keyof typeof statusStyles] || 'bg-gray-50 text-gray-700'}`}>
                                        {status}
                                    </span>
                                </td>
                                <td className="px-6 py-3 text-gray-500 text-xs">
                                    <span>{new Date(camp.start_date).toLocaleDateString()}</span>
                                    <span className="text-gray-400 mx-1">→</span>
                                    <span>{new Date(camp.end_date).toLocaleDateString()}</span>
                                </td>
                                <td className="px-6 py-3 text-right">
                                    <Link 
                                        href={`/admin/campaigns/${camp.id}`}
                                        className="text-blue-600 hover:text-blue-800 font-medium text-xs border border-blue-200 hover:bg-blue-50 px-3 py-1 rounded-md transition-colors"
                >
                                        Manage
                                    </Link>
                                </td>
                            </tr>
                        )})}
                    </tbody>
                </table>
            </div>
        )}
      </div>
    </div>
  );
}
