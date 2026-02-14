'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Loader2, Search, Filter, Calendar as CalendarIcon, RefreshCw, Smartphone, QrCode } from 'lucide-react';
import RedemptionTable, { Redemption } from '@/components/admin/redemptions/RedemptionTable';
import { StatCard } from '@/components/admin/ui/StatCard';
import { Button } from '@/components/ui/Button';

export default function RedemptionsPage() {
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<'all' | 'today' | '7days'>('all');
  const [selectedCampaign, setSelectedCampaign] = useState<string>('all');

  // Fetch Data Function
  const fetchRedemptions = async (silent = false) => {
      if (!silent) setLoading(true);
      else setIsRefreshing(true);

      try {
        const supabase = createClient();
        
        // Fetch from VIEW as requested
        const { data, error } = await supabase
            .from('redemption_details')
            .select('*')
            .order('redeemed_at', { ascending: false });

        if (error) {
            console.error('Error fetching redemptions:', error);
            // Fallback to empty to avoid crash
            setRedemptions([]);
        } else {
            console.log('Fetched redemptions (from view):', data?.length);
            // Map view data to Redemption interface if needed
            // Interface: id, qr_token, campaign_name, phone, coupon_code, redeemed_at
            // View likely has: campaign_id (not name?), bottle_id (qr_token?), phone, etc.
            // We map what we can.
            const mapped = (data || []).map((row: any) => ({
                id: row.id,
                qr_token: row.bottle_id || row.qr_token || 'N/A',
                campaign_name: row.campaign_name || row.campaign_id || 'Unknown',
                phone: row.phone || 'N/A',
                coupon_code: row.coupon_code || '-',
                coupon_status: row.coupon_status || 'claimed', // Default to claimed if view has data
                discount_value: row.discount_value,
                redeemed_at: row.redeemed_at,
                user_name: row.name // if view has it
            }));
            setRedemptions(mapped);
        }
      } catch (err) {
        console.error('Unexpected error:', err);
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
        filtered = filtered.filter(r => 
            r.phone?.includes(q) || 
            r.campaign_name?.toLowerCase().includes(q) ||
            r.qr_token?.toLowerCase().includes(q) ||
            r.coupon_code?.toLowerCase().includes(q)
        );
    }

    // 2. Campaign Filter
    if (selectedCampaign !== 'all') {
        filtered = filtered.filter(r => r.campaign_name === selectedCampaign);
    }

    // 3. Date Range
    if (dateRange !== 'all') {
        const now = new Date();
        const todayStart = new Date(now.setHours(0,0,0,0));
        
        filtered = filtered.filter(r => {
            const rDate = new Date(r.redeemed_at);
            if (dateRange === 'today') return rDate >= todayStart;
            if (dateRange === '7days') {
                const sevenDaysAgo = new Date(todayStart);
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                return rDate >= sevenDaysAgo;
            }
            return true;
        });
    }

    return filtered;
  }, [redemptions, searchQuery, selectedCampaign, dateRange]);

  // Derived Stats
  const totalScans = filteredData.length;
  const uniqueUsers = new Set(filteredData.map(r => r.phone)).size;
  // Unique campaigns for filter dropdown
  const campaigns = Array.from(new Set(redemptions.map(r => r.campaign_name))).filter(Boolean).sort();

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Redemptions Monitor</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
                Real-time view of coupon claims.
                {isRefreshing && <span className="text-xs text-blue-500 flex items-center animate-pulse"><RefreshCw className="h-3 w-3 mr-1 animate-spin" /> Syncing...</span>}
            </p>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => fetchRedemptions()} disabled={isRefreshing || loading} className="dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700">
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
            </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <StatCard label="Total Redemptions" value={totalScans} icon={<QrCode className="h-5 w-5"/>} loading={loading} />
           <StatCard label="Unique Users" value={uniqueUsers} icon={<Smartphone className="h-5 w-5"/>} loading={loading} />
           <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-xl shadow-sm border border-green-100 dark:border-green-800/30 flex flex-col items-center justify-center text-center">
                <span className="text-green-700 dark:text-green-400 font-semibold mb-2 flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                    Live System
                </span>
                <p className="text-xs text-green-600 dark:text-green-500">Auto-refreshing every 10s</p>
           </div>
      </div>
      
      {/* Filters Bar */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="Search phone, campaign, code..." 
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            
            <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                <select 
                    className="h-10 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-gray-300"
                    value={selectedCampaign}
                    onChange={(e) => setSelectedCampaign(e.target.value)}
                >
                    <option value="all">All Campaigns</option>
                    {campaigns.map(c => <option key={c} value={c}>{c}</option>)}
                </select>

                <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-lg">
                    <button 
                        onClick={() => setDateRange('all')}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${dateRange === 'all' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                    >
                        All Time
                    </button>
                    <button 
                        onClick={() => setDateRange('7days')}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${dateRange === '7days' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                    >
                        7 Days
                    </button>
                    <button 
                        onClick={() => setDateRange('today')}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${dateRange === 'today' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                    >
                        Today
                    </button>
                </div>
            </div>
      </div>

      <RedemptionTable redemptions={filteredData} loading={loading && !isRefreshing} />
    </div>
  );
}
