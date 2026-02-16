'use client';

import { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Calendar, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  QrCode,
  Copy
} from 'lucide-react';

export interface CouponData {
  id: string;
  coupon_code: string;
  status: 'active' | 'redeemed' | 'expired';
  generated_at: string;
  redeemed_at?: string | null;
  expires_at?: string | null;
  campaign_id?: string;
  // View might return other fields, but these are what we need
}

interface GeneratedCouponsListProps {
  coupons: CouponData[];
}

export default function GeneratedCouponsList({ coupons = [] }: GeneratedCouponsListProps) {
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'redeemed' | 'expired'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Summary Metrics
  const summary = useMemo(() => {
    return {
      total: coupons.length,
      active: coupons.filter(c => c.status === 'active').length,
      redeemed: coupons.filter(c => c.status === 'redeemed').length,
      expired: coupons.filter(c => c.status === 'expired').length
    };
  }, [coupons]);

  // 2. Filter & Search Logic
  const filteredCoupons = useMemo(() => {
    return coupons.filter(coupon => {
      // Status Filter
      if (filterStatus !== 'all' && coupon.status !== filterStatus) return false;
      
      // Search Filter
      if (searchQuery && !coupon.coupon_code.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      
      return true;
    });
  }, [coupons, filterStatus, searchQuery]);

  return (
    <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-white/5 p-6 shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <QrCode className="h-5 w-5 text-pink-500" />
                    Generated Coupons
                </h3>
                <p className="text-sm text-slate-400">Track issued QR coupons and their status.</p>
            </div>

            {/* Summary Pills */}
            <div className="flex flex-wrap gap-2">
                <div className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs text-slate-300">
                    Total: <span className="text-white font-bold">{summary.total}</span>
                </div>
                <div className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs text-slate-300">
                    Redeemed: <span className="text-emerald-400 font-bold">{summary.redeemed}</span>
                </div>
                 <div className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs text-slate-300">
                    Active: <span className="text-blue-400 font-bold">{summary.active}</span>
                </div>
            </div>
        </div>

        {/* Controls: Search & Tabs */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
            
            {/* Search */}
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input 
                    type="text" 
                    placeholder="Search coupon code..." 
                    className="w-full pl-10 pr-4 py-2 bg-slate-950/50 border border-slate-800 rounded-lg text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Tabs */}
            <div className="flex p-1 bg-slate-950/50 rounded-lg border border-slate-800 w-full md:w-auto">
                {(['all', 'active', 'redeemed', 'expired'] as const).map((status) => (
                    <button
                        key={status}
                        onClick={() => setFilterStatus(status)}
                        className={`flex-1 md:flex-none px-4 py-1.5 text-xs font-medium rounded-md transition-all ${
                            filterStatus === status 
                                ? 'bg-slate-800 text-white shadow-sm' 
                                : 'text-slate-500 hover:text-slate-300'
                        }`}
                    >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                ))}
            </div>
        </div>

        {/* Table Area */}
        <div className="rounded-xl border border-slate-800/50 overflow-hidden bg-slate-950/30">
            {/* Zero State */}
            {coupons.length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center justify-center">
                    <div className="h-12 w-12 rounded-full bg-slate-900 flex items-center justify-center mb-4">
                        <QrCode className="h-6 w-6 text-slate-600" />
                    </div>
                    <h4 className="text-white font-medium mb-1">No coupons generated yet</h4>
                    <p className="text-sm text-slate-500">Create a campaign to generate QR coupons.</p>
                </div>
            ) : filteredCoupons.length === 0 ? (
                 <div className="p-12 text-center">
                    <p className="text-slate-500 text-sm">No coupons match your filter.</p>
                </div>
            ) : (
                <div className="overflow-x-auto max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-900/80 sticky top-0 backdrop-blur-sm z-10 text-slate-400">
                            <tr>
                                <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider">Coupon Code</th>
                                <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider">Generated</th>
                                <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider">Redeemed</th>
                                <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider">Expires</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {filteredCoupons.map((coupon) => {
                                const statusColor = 
                                    coupon.status === 'active' ? 'text-blue-400 bg-blue-500/10 border-blue-500/20' :
                                    coupon.status === 'redeemed' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
                                    'text-red-400 bg-red-500/10 border-red-500/20';
                                
                                return (
                                    <tr key={coupon.id} className="group hover:bg-slate-900/50 transition-colors">
                                        <td className="px-6 py-3">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono font-bold text-white tracking-wide">{coupon.coupon_code}</span>
                                                <button 
                                                    onClick={() => navigator.clipboard.writeText(coupon.coupon_code)}
                                                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-white text-slate-500 transition-opacity"
                                                    title="Copy"
                                                >
                                                    <Copy className="h-3 w-3" />
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border uppercase tracking-wider ${statusColor}`}>
                                                {coupon.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-slate-400 text-xs">
                                            {new Date(coupon.generated_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-3 text-slate-400 text-xs">
                                            {coupon.redeemed_at ? new Date(coupon.redeemed_at).toLocaleDateString() : '-'}
                                        </td>
                                        <td className="px-6 py-3 text-slate-400 text-xs">
                                             {coupon.expires_at ? new Date(coupon.expires_at).toLocaleDateString() : 'Never'}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    </div>
  );
}
