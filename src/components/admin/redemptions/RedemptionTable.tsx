'use client';

import { motion } from 'framer-motion';
import { StatusBadge } from '@/components/admin/ui/StatusBadge';
import { QrCode, User, Calendar, Tag, Ticket } from 'lucide-react';

export interface Redemption {
  id: string;
  qr_token: string;
  campaign_name: string;
  phone: string;
  coupon_code: string;
  coupon_status?: string;
  discount_value?: number;
  redeemed_at: string;
  user_name?: string; // If available
  bottle_id?: string;
}

interface RedemptionTableProps {
  redemptions: Redemption[];
  loading?: boolean;
}

export default function RedemptionTable({ redemptions, loading }: RedemptionTableProps) {
  if (loading && redemptions.length === 0) {
    return (
        <div className="p-12 text-center text-gray-500 dark:text-gray-400">
            Scanning for redemptions...
        </div>
    );
  }

  if (redemptions.length === 0) {
    return (
        <div className="p-12 flex flex-col items-center justify-center text-center">
            <div className="h-16 w-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4 text-gray-400 dark:text-gray-500">
                <QrCode className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">No redemptions found</h3>
            <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-sm">
                Try adjusting your filters or wait for new scans.
            </p>
        </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
            <tr>
              <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Time</th>
              <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Campaign</th>
              <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">User Details</th>
              <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Verification</th>
              <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
            {redemptions.map((r, idx) => (
              <motion.tr 
                key={r.id + r.qr_token}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="group hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-gray-400" />
                        {new Date(r.redeemed_at).toLocaleString('en-IN', {
                            timeZone: "Asia/Kolkata",
                            month: 'short', day: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                        })}
                    </div>
                </td>
                <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                        <Tag className="h-3.5 w-3.5 text-blue-500" />
                        <span className="font-medium text-gray-900 dark:text-gray-200">{r.campaign_name || "Unknown"}</span>
                    </div>
                </td>
                <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400">
                            <User className="h-4 w-4" />
                        </div>
                        <div>
                            <div className="font-medium text-gray-900 dark:text-gray-200">{r.user_name || r.phone}</div>
                            {r.user_name && <div className="text-xs text-gray-400 font-mono">{r.phone}</div>}
                        </div>
                    </div>
                </td>
                <td className="px-6 py-4">
                    <div className="flex flex-col gap-1.5">
                        <div className="text-xs flex items-center gap-2">
                             <span className="text-gray-400">QR:</span> 
                             <code className="text-gray-500 dark:text-gray-400 font-mono text-xs">{r.qr_token.substring(0,8)}...</code>
                        </div>
                        <div className="flex items-center gap-2">
                            <Ticket className="h-3.5 w-3.5 text-green-500" />
                            {r.coupon_code && r.coupon_code !== '-' ? (
                                <span className="text-sm font-mono font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded border border-green-100 dark:border-green-900/30">
                                    {r.coupon_code}
                                    {r.discount_value ? <span className="ml-1 opacity-80 text-xs">(₹{r.discount_value})</span> : ''}
                                </span>
                            ) : (
                                <span className="text-gray-400 text-sm">—</span>
                            )}
                            {r.coupon_status && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full uppercase tracking-wide font-medium ${
                                    r.coupon_status === 'redeemed' || r.coupon_status === 'claimed'
                                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' 
                                        : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                                }`}>
                                    {r.coupon_status}
                                </span>
                            )}
                        </div>
                    </div>
                </td>
                <td className="px-6 py-4 text-right">
                    <StatusBadge status="redeemed" />
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
