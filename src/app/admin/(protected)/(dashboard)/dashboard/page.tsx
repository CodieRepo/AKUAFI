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

        // 1. Fetch Stats from View
        const { data: statsData, error: statsError } = await supabase
          .from('dashboard_stats')
          .select('*')
          .single();

        if (statsError) {
             console.error('Error fetching stats:', statsError);
             // Fallback if view doesn't exist or errors, manual count (safety net)
             // But strict constraints say "Backend provides... view", so we trust it.
             // If it fails, we show 0.
        }

        // 2. Fetch Recent Activity from View
        const { data: activityData, error: activityError } = await supabase
          .from('redemption_details')
          .select('*')
          .order('redeemed_at', { ascending: false })
          .limit(10);

        if (activityError) console.error('Error fetching activity:', activityError);

        setStats(statsData);
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
            trend={{ value: "12%", direction: "up" }} // Dummy trend as requested
        />
        <StatCard 
            label="Total QR Generated" 
            value={stats?.total_qr ?? 0} 
            icon={<QrCode className="h-6 w-6" />}
            loading={loading}
        />
        <StatCard 
            label="Total Redemptions" 
            value={stats?.total_redemptions ?? 0} 
            icon={<ScanLine className="h-6 w-6" />}
            loading={loading}
            trend={{ value: "5%", direction: "up" }}
        />
        <StatCard 
            label="Unique Redeemers" 
            value={stats?.unique_redeemers ?? 0} 
            icon={<Users className="h-6 w-6" />}
            loading={loading}
            trend={{ value: "8%", direction: "up" }}
        />
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
            <h3 className="font-bold text-gray-900 dark:text-white">Recent Redemptions</h3>
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
                            <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider">Bottle ID</th>
                            <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider">User</th>
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
                                    {/* View might return campaign_id, logic needs join or view should have name. 
                                        Reviewing prompt: "redemption_details view: ... campaign_id, bottle_id ... name, phone".
                                        Wait, "name" in redemption_details usually refers to USER name. 
                                        Does it have campaign name? 
                                        Prompt says: "3) Campaigns Page ... 4) Redemptions Page: Table columns: User Name, Phone, Campaign ID..."
                                        The view definition in prompt: "id, redeemed_at, name, phone, campaign_id, bottle_id".
                                        It does NOT explicitly say "campaign_name".
                                        I should display campaign_id or fetch campaign name. 
                                        The Dashboard "Recent Activity" in previous file showed "campaigns ( name )".
                                        If I use the VIEW, I might strictly get what's in the view.
                                        I'll display Campaign ID for now, or if the view is smart it might have it.
                                        Safe bet: Display Campaign ID, formatted nicely.
                                    */}
                                    <span className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                                        {item.campaign_id?.split('-')[0] ?? 'Unknown'}...
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-gray-600 dark:text-gray-400 font-mono text-xs">
                                    {item.bottle_id?.substring(0, 8)}...
                                </td>
                                <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                                    <div className="font-medium">{item.name}</div>
                                    <div className="text-xs text-gray-400">{item.phone}</div>
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
