'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export const dynamic = "force-dynamic";

interface DashboardStats {
  total_campaigns: number;
  active_campaigns: number;
  total_qr_generated: number;
  total_redeemed: number;
  recent_activity: any[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        console.log('Fetching dashboard stats from API...');
        
        const res = await fetch('/api/admin/stats');
        
        if (!res.ok) {
            throw new Error(`API Error: ${res.status} ${res.statusText}`);
        }

        const data = await res.json();
        console.log('Stats API fetch success:', data);

        setStats({
            total_campaigns: data.total_campaigns || 0,
            active_campaigns: data.active_campaigns || 0,
            total_qr_generated: data.total_qr_generated || 0,
            total_redeemed: data.total_redeemed || 0,
            recent_activity: data.recent_activity || []
        });

      } catch (err) {
        console.error("Failed to fetch stats", err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard Overview</h1>
      
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
           {[1,2,3,4].map(i => <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>)}
        </div>
      ) : (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard title="Total Campaigns" value={stats?.total_campaigns || 0} />
              <StatCard title="Active Now" value={stats?.active_campaigns || 0} color="text-green-600" />
              <StatCard title="Total Bottles (QR)" value={stats?.total_qr_generated || 0} />
              <StatCard title="Total Redemptions" value={stats?.total_redeemed || 0} color="text-blue-600" />
            </div>

            {/* Recent Activity Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-bold text-gray-900">Recent Redemptions</h3>
                    <Link href="/admin/redemptions" className="text-sm text-blue-600 hover:text-blue-800 font-medium">View All</Link>
                </div>
                
                {!stats?.recent_activity || stats.recent_activity.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 text-sm">No recent activity found.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-500">
                                <tr>
                                    <th className="px-6 py-3 font-medium text-xs uppercase">Time</th>
                                    <th className="px-6 py-3 font-medium text-xs uppercase">Campaign</th>
                                    <th className="px-6 py-3 font-medium text-xs uppercase">User</th>
                                    <th className="px-6 py-3 font-medium text-xs uppercase text-right">Value</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {stats.recent_activity.map((item: any, idx: number) => {
                                    // Handle array return from join if necessary (though defined singular in query usually returns singular or array depending on helper)
                                    // The API returns strictly mapped structure.
                                    const coupon = Array.isArray(item.coupons) ? item.coupons[0] : item.coupons;
                                    const campaign = coupon?.campaigns ? (Array.isArray(coupon.campaigns) ? coupon.campaigns[0] : coupon.campaigns) : null;
                                    const user = coupon?.users ? (Array.isArray(coupon.users) ? coupon.users[0] : coupon.users) : null;

                                    return (
                                    <tr key={idx} className="hover:bg-gray-50/50">
                                        <td className="px-6 py-3 text-gray-500">
                                            {new Date(item.redeemed_at).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-3 font-medium text-gray-900">
                                            {campaign?.name || 'Unknown'}
                                        </td>
                                        <td className="px-6 py-3 text-gray-600 font-mono text-xs">
                                            {user?.phone || 'Anonymous'}
                                        </td>
                                        <td className="px-6 py-3 text-right font-bold text-green-600">
                                            ₹{coupon?.discount_value || 0}
                                        </td>
                                    </tr>
                                )})}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
      )}
    </div>
  );
}

function StatCard({ title, value, color = 'text-gray-900' }: { title: string, value: number, color?: string }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      <p className={`text-3xl font-bold mt-2 ${color}`}>{value.toLocaleString()}</p>
    </div>
  );
}
