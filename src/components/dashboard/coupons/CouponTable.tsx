import { Tag } from 'lucide-react';


export interface Coupon {
  id: string; // or number, assuming string from Supabase usually
  coupon_code: string;
  campaign_name?: string; // Or campaign_id if join not done
  campaign_id?: string;
  status: string;
  redeemed_at?: string;
  generated_at: string;
}

interface CouponTableProps {
  coupons: Coupon[];
  loading?: boolean;
}

export default function CouponTable({ coupons, loading }: CouponTableProps) {
  if (loading) return <div className="p-8 text-center text-text-muted">Loading coupons...</div>;
  if (coupons.length === 0) return <div className="p-8 text-center text-text-muted">No coupons found.</div>;

  return (
    <div className="rounded-xl border border-border bg-white shadow-soft-sm overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead className="bg-surface text-text-muted">
                    <tr>
                        <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Coupon Code</th>
                        <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Campaign</th>
                        <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Status</th>
                        <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs text-right">Redeemed At</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                    {coupons.map((coupon) => (
                        <tr key={coupon.id} className="group hover:bg-surface/50 transition-colors">
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                                        <Tag className="h-4 w-4" />
                                    </div>
                                    <span className="font-mono font-bold text-foreground">{coupon.coupon_code}</span>
                                </div>
                            </td>
                            <td className="px-6 py-4 text-foreground">{coupon.campaign_name || coupon.campaign_id || '-'}</td>
                            <td className="px-6 py-4">
                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium 
                                    ${coupon.status === 'active' ? 'bg-green-100 text-green-800' : 
                                      coupon.status === 'redeemed' ? 'bg-blue-100 text-blue-800' : 
                                      coupon.status === 'expired' ? 'bg-gray-100 text-gray-800' : 
                                      'bg-yellow-50 text-yellow-700'}`}>
                                    {coupon.status ? coupon.status.charAt(0).toUpperCase() + coupon.status.slice(1) : 'Unknown'}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right text-text-muted">
                                {coupon.redeemed_at ? new Date(coupon.redeemed_at).toLocaleDateString() : '-'}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
  );
}
