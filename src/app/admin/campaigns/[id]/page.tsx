'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabaseclient';
import { Button } from '@/components/ui/Button';
import { ChevronLeft, Play, Pause, Loader2, BarChart3, Settings, QrCode } from 'lucide-react';
import Link from 'next/link';

export default function CampaignDetailsPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const [campaign, setCampaign] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'rules' | 'stats'>('overview');

  async function fetchCampaign() {
    try {
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const headers = { Authorization: `Bearer ${session.access_token}` };

      const [campRes, statsRes] = await Promise.all([
        fetch(`/api/admin/campaigns/${id}`, { headers }),
        fetch(`/api/admin/campaigns/${id}/stats`, { headers })
      ]);

      if (campRes.ok) setCampaign(await campRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
      
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (id) fetchCampaign();
  }, [id]);

  const toggleStatus = async () => {
    if (!campaign) return;
    const newStatus = campaign.status === 'active' ? 'paused' : 'active';
    try {
        const supabase = getSupabaseClient();
        const { data: { session } } = await supabase.auth.getSession();
        await fetch(`/api/admin/campaigns/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session?.access_token}`
            },
            body: JSON.stringify({ status: newStatus })
        });
        fetchCampaign(); // Refresh
    } catch (err) {
        console.error(err);
    }
  };

  if (loading) return <div className="p-12 text-center text-gray-500">Loading...</div>;
  if (!campaign) return <div className="p-12 text-center">Campaign not found</div>;

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/campaigns" className="text-sm text-gray-500 hover:text-gray-900 inline-flex items-center mb-2">
            <ChevronLeft className="h-4 w-4 mr-1" /> Back to Campaigns
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                {campaign.name}
                <span className={`text-sm px-2.5 py-0.5 rounded-full capitalize font-medium
                    ${campaign.status === 'active' ? 'bg-green-100 text-green-700' : 
                      campaign.status === 'draft' ? 'bg-gray-100 text-gray-700' : 'bg-yellow-100 text-yellow-800'}`}>
                    {campaign.status}
                </span>
            </h1>
            <div className="flex gap-2">
                {campaign.status !== 'draft' && (
                    <Button 
                        variant="outline" 
                        onClick={toggleStatus}
                        className={campaign.status === 'active' ? 'text-orange-600 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50'}
                    >
                        {campaign.status === 'active' ? <><Pause className="mr-2 h-4 w-4" /> Pause</> : <><Play className="mr-2 h-4 w-4" /> Activate</>}
                    </Button>
                )}
                <Link href="/admin/qr-generator">
                    <Button>
                        Generate QRs
                    </Button>
                </Link>
            </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
            <button onClick={() => setActiveTab('overview')} className={`${activeTab === 'overview' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}>
                <Settings className="h-4 w-4 mr-2" /> Overview
            </button>
            <button onClick={() => setActiveTab('rules')} className={`${activeTab === 'rules' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}>
                <QrCode className="h-4 w-4 mr-2" /> Coupon Rules
            </button>
            <button onClick={() => setActiveTab('stats')} className={`${activeTab === 'stats' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}>
                <BarChart3 className="h-4 w-4 mr-2" /> Stats
            </button>
        </nav>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        
        {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Campaign ID</h3>
                    <p className="font-mono text-sm">{campaign.id}</p>
                </div>
                <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Duration</h3>
                    <p>{new Date(campaign.start_date).toLocaleDateString()} — {new Date(campaign.end_date).toLocaleDateString()}</p>
                </div>
                <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Created At</h3>
                    <p>{new Date(campaign.created_at).toLocaleString()}</p>
                </div>
                <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Last Updated</h3>
                    <p>{campaign.updated_at ? new Date(campaign.updated_at).toLocaleString() : '-'}</p>
                </div>
            </div>
        )}

        {activeTab === 'rules' && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Coupon Structure</h3>
                    <p className="text-lg font-bold">
                        {campaign.coupon_type === 'flat' ? 'Flat Amount' : 'Percentage'} 
                        <span className="ml-2 text-primary">
                            {campaign.coupon_type === 'flat' ? '₹' : ''}{campaign.coupon_value}{campaign.coupon_type === 'percent' ? '%' : ''}
                        </span>
                    </p>
                </div>
                <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Coupon Prefix</h3>
                    <p className="font-mono text-lg">{campaign.coupon_prefix}</p>
                    <p className="text-xs text-gray-400 mt-1">Example: {campaign.coupon_prefix}-A1B2C</p>
                </div>
                <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Expiry Rule</h3>
                    <p>{campaign.coupon_expiry_days} days from redemption</p>
                </div>
             </div>
        )}

        {activeTab === 'stats' && stats && (
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 bg-blue-50 rounded-lg text-center">
                    <h3 className="text-sm font-medium text-blue-700 mb-1">Total Bottles</h3>
                    <p className="text-3xl font-bold text-blue-900">{stats.total_bottles}</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg text-center">
                    <h3 className="text-sm font-medium text-green-700 mb-1">Redeemed</h3>
                    <p className="text-3xl font-bold text-green-900">{stats.redeemed_bottles}</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg text-center">
                    <h3 className="text-sm font-medium text-purple-700 mb-1">Redemption Rate</h3>
                    <p className="text-3xl font-bold text-purple-900">{stats.redemption_percentage}%</p>
                </div>
             </div>
        )}
      </div>
    </div>
  );
}
