'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Search, CheckCircle, XCircle, AlertCircle, Loader2, ScanLine } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

export default function CouponVerification() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'valid' | 'invalid' | 'redeemed' | 'expired'>('idle');
  const [couponData, setCouponData] = useState<any>(null);

  const handleVerify = async () => {
    if (!code) return;
    setLoading(true);
    setStatus('idle');
    setCouponData(null);

    try {
        const supabase = createClient();
        
        // Fetch coupon with relations
        const { data, error } = await supabase
            .from('coupons')
            .select(`
                *,
                campaigns ( name ),
                redemptions (
                    redeemed_at,
                    customer_phone
                )
            `)
            .eq('code', code) // Changed 'coupon_code' to 'code' as per common schema seen in other files (adjust if needed)
            .maybeSingle();

        if (error) {
             console.error('Error verifying coupon:', error);
             setStatus('invalid');
        } else if (!data) {
             setStatus('invalid');
        } else {
            console.log("Coupon Data:", data);
            setCouponData(data);
            
            // Status Logic
            if (data.status === 'redeemed') {
                setStatus('redeemed');
            } else if (data.status !== 'active') {
                setStatus('expired');
            } else {
                setStatus('valid');
            }
        }
    } catch (err) {
        console.error(err);
        setStatus('invalid');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
          <ScanLine className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Verify Coupon</h3>
      </div>
      
      <div className="flex flex-col gap-3">
        <div className="relative">
            <input 
                type="text" 
                placeholder="Enter 8-digit code..." 
                className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-950 pl-4 py-3 text-sm font-mono outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all uppercase placeholder:normal-case placeholder:font-sans"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                maxLength={12}
            />
        </div>
        <Button 
            onClick={handleVerify} 
            disabled={!code || loading}
            className="w-full bg-slate-900 text-white hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500"
        >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {loading ? 'Checking...' : 'Verify Status'}
        </Button>
      </div>

      {status === 'valid' && (
          <div className="mt-4 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                  <div className="space-y-1">
                      <p className="font-semibold text-emerald-900 dark:text-emerald-100">Valid Coupon</p>
                      <p className="text-xs text-emerald-700 dark:text-emerald-400">
                          Campaign: <span className="font-medium">{couponData?.campaigns?.name}</span>
                      </p>
                      {couponData?.discount_value && (
                           <p className="text-xs text-emerald-700 dark:text-emerald-400">
                               Value: <span className="font-medium">₹{couponData.discount_value}</span>
                           </p>
                      )}
                  </div>
              </div>
          </div>
      )}

      {status === 'redeemed' && (
          <div className="mt-4 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 animate-in fade-in slide-in-from-top-2">
               <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div className="space-y-1">
                      <p className="font-semibold text-blue-900 dark:text-blue-100">Already Redeemed</p>
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                          Campaign: <span className="font-medium">{couponData?.campaigns?.name}</span>
                      </p>
                      {couponData?.redemptions?.[0]?.redeemed_at && (
                          <p className="text-xs text-blue-700 dark:text-blue-300">
                              Date: {new Date(couponData.redemptions[0].redeemed_at).toLocaleString("en-IN")}
                          </p>
                      )}
                       {couponData?.redemptions?.[0]?.customer_phone && (
                          <p className="text-xs text-blue-700 dark:text-blue-300">
                              Phone: {couponData.redemptions[0].customer_phone}
                          </p>
                      )}
                  </div>
              </div>
          </div>
      )}

      {status === 'expired' && (
          <div className="mt-4 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                   <div className="space-y-1">
                      <p className="font-semibold text-amber-900 dark:text-amber-100">Coupon Expired</p>
                      <p className="text-xs text-amber-700 dark:text-amber-300">This coupon is no longer active.</p>
                       <p className="text-xs text-amber-700 dark:text-blue-300">
                          Campaign: <span className="font-medium">{couponData?.campaigns?.name}</span>
                      </p>
                  </div>
              </div>
          </div>
      )}

      {status === 'invalid' && (
          <div className="mt-4 p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                  <div className="space-y-1">
                      <p className="font-semibold text-red-900 dark:text-red-100">Invalid Coupon</p>
                      <p className="text-xs text-red-700 dark:text-red-300">This code does not exist or is invalid.</p>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}
