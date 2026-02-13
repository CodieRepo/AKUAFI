import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Link from 'next/link';

// Function to create server client inside component
async function getSupabase() {
    const cookieStore = await cookies();
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) { return cookieStore.get(name)?.value; },
                set() {},
                remove() {},
            },
        }
    );
}

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const supabase = await getSupabase();

  // 1. Total Redemptions
  const { count: totalRedeemed } = await supabase
    .from('redemptions')
    .select('*', { count: 'exact', head: true });

  // 2. Unique Users (RPC)
  const { data: uniqueUsersCount, error: rpcError } = await supabase
    .rpc('get_unique_redeemers_count');

  if (rpcError) console.error("RPC Error:", rpcError);

  // 3. Total Campaigns
  const { count: totalCampaigns } = await supabase
    .from('campaigns')
    .select('*', { count: 'exact', head: true });

  // 4. Bottles (QR) - Assuming 'bottles' table
  const { count: totalBottles } = await supabase
    .from('bottles')
    .select('*', { count: 'exact', head: true });


  // 5. Recent Activity
  const { data: recentActivity } = await supabase
    .from('redemptions')
    .select(`
        redeemed_at,
        users ( name, phone ),
        campaigns ( name )
    `)
    .order('redeemed_at', { ascending: false })
    .limit(10);


  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Campaigns" value={totalCampaigns || 0} />
        <StatCard title="Unique Redeemers" value={uniqueUsersCount || 0} color="text-purple-600" />
        <StatCard title="Total Bottles (QR)" value={totalBottles || 0} />
        <StatCard title="Total Redemptions" value={totalRedeemed || 0} color="text-blue-600" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-bold text-gray-900">Recent Redemptions</h3>
            <Link href="/admin/redemptions" className="text-sm text-blue-600 hover:text-blue-800 font-medium">View All</Link>
        </div>
        
        {!recentActivity || recentActivity.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">No recent activity found.</div>
        ) : (
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-500">
                        <tr>
                            <th className="px-6 py-3 font-medium text-xs uppercase">Time</th>
                            <th className="px-6 py-3 font-medium text-xs uppercase">Campaign</th>
                            <th className="px-6 py-3 font-medium text-xs uppercase">User</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {recentActivity.map((item: any, idx: number) => {
                            const campaignName = item.campaigns?.name || 'Unknown';
                            const userName = item.users?.name || 'Anonymous';
                            const userPhone = item.users?.phone || '';
                            
                            return (
                            <tr key={idx} className="hover:bg-gray-50/50">
                                <td className="px-6 py-3 text-gray-500">
                                    {new Date(item.redeemed_at).toLocaleString('en-IN', { timeZone: "Asia/Kolkata" })}
                                </td>
                                <td className="px-6 py-3 font-medium text-gray-900">
                                    {campaignName}
                                </td>
                                <td className="px-6 py-3 text-gray-600">
                                    <div className="font-medium">{userName}</div>
                                    <div className="text-xs text-gray-400 font-mono">{userPhone}</div>
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

function StatCard({ title, value, color = 'text-gray-900' }: { title: string, value: number, color?: string }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      <p className={`text-3xl font-bold mt-2 ${color}`}>{value.toLocaleString()}</p>
    </div>
  );
}
