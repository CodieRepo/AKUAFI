'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link'; // Import Link
import { createClient } from '@/utils/supabase/client';
import { StatCard } from '@/components/admin/ui/StatCard';
import { Megaphone, QrCode, ScanLine, Users, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        const supabase = createClient();

        // 1. Fetch Specs from client_dashboard_v1 (Aggregated)
        console.log("Fetching client_dashboard_v1...");
        const { data: clientsData, error: statsError } = await supabase
          .from('client_dashboard_v1')
          .select('*');

        console.log("client_dashboard_v1 data:", clientsData);
        if (statsError) {
             console.error('Error fetching stats:', statsError);
        }

        // Aggregate stats locally for Super Admin View
        const aggregatedStats = (clientsData || []).reduce((acc: any, curr: any) => ({
            total_campaigns: (acc.total_campaigns || 0) + (curr.total_campaigns || 0),
            total_qr: (acc.total_qr || 0) + (curr.total_qr || 0),
            total_claims: (acc.total_claims || 0) + (curr.total_claims || 0),
            unique_users: (acc.unique_users || 0) + (curr.unique_users || 0),
        }), { total_campaigns: 0, total_qr: 0, total_claims: 0, unique_users: 0 });

        console.log("Aggregated Stats:", aggregatedStats);

        // 2. Fetch Recent Activity from campaign_user_details_v1
        console.log("Fetching campaign_user_details_v1 (activity)...");
        const { data: activityData, error: activityError } = await supabase
          .from('campaign_user_details_v1')
          .select('*')
          .eq('status', 'claimed') 
          .order('redeemed_at', { ascending: false })
          .limit(10);

        console.log("Recent Activity Data:", activityData);
        if (activityError) console.error('Error fetching activity:', activityError);

        setStats(aggregatedStats);
        setRecentActivity(activityData || []);

      } catch (err: any) {
        console.error('Unexpected error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  if (error) {
      return (
          <div className="p-8 text-center text-red-500">
              <p>Error loading dashboard: {error}</p>
          </div>
      );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard Overview</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Welcome back, here is what is happening today.</p>
      </div>
      
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
            label="Total Campaigns" 
            value={stats?.total_campaigns ?? 0} 
            icon={<Megaphone className="h-6 w-6" />}
            loading={loading}
            trend={{ value: "12%", direction: "up" }} 
        />
        <StatCard 
            label="Total QR Generated" 
            value={stats?.total_qr ?? 0} 
            icon={<QrCode className="h-6 w-6" />}
            loading={loading}
        />
        <StatCard 
            label="Total Claims" 
            value={stats?.total_claims ?? 0} 
            icon={<ScanLine className="h-6 w-6" />}
            loading={loading}
            trend={{ value: "5%", direction: "up" }}
        />
        <StatCard 
            label="Unique Redeemers" 
            value={stats?.unique_users ?? 0} 
            icon={<Users className="h-6 w-6" />}
            loading={loading}
            trend={{ value: "8%", direction: "up" }}
        />
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
            <h3 className="font-bold text-gray-900 dark:text-white">Recent Activity</h3>
            <Link href="/admin/redemptions" className="flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors">
                View All <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
        </div>
        
        {loading ? (
             <div className="p-8 space-y-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-12 bg-gray-50 dark:bg-gray-700/50 rounded animate-pulse" />
                ))}
             </div>
        ) : !recentActivity || recentActivity.length === 0 ? (
            <div className="p-12 text-center text-gray-400 dark:text-gray-500 text-sm">
                No recent activity found.
            </div>
        ) : (
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400">
                        <tr>
                            <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider">Time</th>
                            <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider">Campaign</th>
                            <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider">User</th>
                            <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider">Coupon</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                        {recentActivity.map((item: any, idx: number) => (
                            <motion.tr 
                                key={item.id || idx} 
                                variants={item}
                                initial="hidden"
                                animate="show"
                                transition={{ delay: idx * 0.05 }}
                                className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors"
                            >
                                <td className="px-6 py-4 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                    {new Date(item.redeemed_at).toLocaleString('en-IN', { 
                                        timeZone: "Asia/Kolkata",
                                        dateStyle: 'medium',
                                        timeStyle: 'short'
                                    })}
                                </td>
                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-200">
                                    {item.campaign_name || 'Unknown'}
                                </td>
                                <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                                    <div className="font-medium">{item.user_name || 'N/A'}</div>
                                    <div className="text-xs text-gray-400">{item.phone}</div>
                                </td>
                                <td className="px-6 py-4 text-gray-600 dark:text-gray-400 font-mono text-xs">
                                    <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded">
                                        {item.coupon_code}
                                    </span>
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
      </div>
    </div>
  );
}
