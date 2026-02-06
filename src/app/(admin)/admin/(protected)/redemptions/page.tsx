'use client';

import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabaseclient';
import { Loader2 } from 'lucide-react';

interface Redemption {
  id: string;
  qr_token: string;
  campaign_name: string;
  phone: string;
  coupon_code: string;
  redeemed_at: string;
}

export default function RedemptionsPage() {
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRedemptions() {
      try {
        const supabase = getSupabaseClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const res = await fetch('/api/admin/redemptions', {
            headers: { Authorization: `Bearer ${session.access_token}` }
        });
        if (res.ok) {
            setRedemptions(await res.json());
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchRedemptions();
  }, []);

  // Calculate stats
  const totalScans = redemptions.length;
  const uniqueUsers = new Set(redemptions.map(r => r.phone)).size;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Redemptions Monitor</h1>
        <p className="text-gray-500 mt-1">Real-time view of successful coupon claims.</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
           <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col items-center text-center">
                <span className="text-gray-500 text-sm font-medium">Total Redemptions</span>
                <span className="text-3xl font-bold text-gray-900 mt-2">{totalScans}</span>
           </div>
           <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col items-center text-center">
                <span className="text-gray-500 text-sm font-medium">Unique Users</span>
                <span className="text-3xl font-bold text-blue-600 mt-2">{uniqueUsers}</span>
           </div>
           <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col items-center text-center">
                <span className="text-gray-500 text-sm font-medium">Recent Activity</span>
                <span className="text-sm font-medium text-green-600 mt-3 bg-green-50 px-3 py-1 rounded-full">Live Monitoring</span>
           </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[400px]">
        {loading ? (
            <div className="flex flex-col items-center justify-center p-20 text-gray-500">
                <Loader2 className="h-8 w-8 animate-spin mb-4 text-blue-500" /> 
                <p>Syncing redemptions...</p>
            </div>
        ) : redemptions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
                    <Loader2 className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">No redemptions yet</h3>
                <p className="text-gray-500 mt-2 max-w-sm">Scan a generated QR code with a phone to test the flow.</p>
            </div>
        ) : (
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50/50 text-gray-500 border-b border-gray-100 uppercase text-xs tracking-wider">
                        <tr>
                            <th className="px-6 py-4 font-semibold">Time</th>
                            <th className="px-6 py-4 font-semibold">Campaign</th>
                            <th className="px-6 py-4 font-semibold">User</th>
                            <th className="px-6 py-4 font-semibold">Details</th>
                            <th className="px-6 py-4 font-semibold text-right">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {redemptions.map((r) => (
                            <tr key={r.id + r.qr_token} className="hover:bg-blue-50/30 transition-colors">
                                <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                                    {new Date(r.redeemed_at).toLocaleString([], { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                                </td>
                                <td className="px-6 py-4 font-medium text-gray-900">{r.campaign_name}</td>
                                <td className="px-6 py-4">
                                    <div className="font-medium text-gray-900">{r.phone}</div>
                                    <div className="text-xs text-gray-400">Verified</div>
                                </td>
                                <td className="px-6 py-4">
                                    <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600 inline-block mb-1">QR: {r.qr_token.substring(0,8)}...</code>
                                    <div className="text-xs font-bold text-green-700">Cpn: {r.coupon_code}</div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700">
                                        Redeemed
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
      </div>
    </div>
  );
}
