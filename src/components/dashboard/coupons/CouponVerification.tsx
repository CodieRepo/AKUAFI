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
        
        // 1. Get Current Client ID
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setStatus('invalid'); // Or unauthorized
            setLoading(false);
            return;
        }
        
        const { data: client } = await supabase
            .from('clients')
            .select('id')
            .eq('user_id', user.id)
            .single();
            
        if (!client) {
             setStatus('invalid');
             setLoading(false);
             return;
        }

        // 2. Fetch coupon with Strict Client Scoping
        // Use client_coupons view for safe read validation
        
        // Normalize Code (Handle Unicode Dash)
        const cleanCode = code.trim().replace(/[–—]/g, "-");

        const { data, error } = await supabase
            .from('client_coupons')
            .select('*')
            .eq('client_id', client.id) 
            .ilike('coupon_code', cleanCode) 
            .maybeSingle();

        if (error || !data) {
             console.error('Error verifying coupon:', error);
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
    <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm flex flex-col h-full">
      <div className="flex items-center gap-2 mb-4">
          <ScanLine className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Verify Coupon</h3>
      </div>
      
      <div className="flex flex-col gap-3 mb-4">
        <div className="relative group">
            <input 
                type="text" 
                placeholder="Enter 8-digit code..." 
                className="
                    w-full rounded-xl border 
                    bg-gray-50 dark:bg-slate-950 
                    text-gray-900 dark:text-white 
                    border-gray-200 dark:border-slate-700 
                    pl-4 py-3 text-sm font-mono 
                    outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 
                    transition-all uppercase placeholder:normal-case placeholder:font-sans placeholder:text-gray-400 dark:placeholder:text-gray-500
                "
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                maxLength={12}
            />
        </div>
        <Button 
            onClick={handleVerify} 
            disabled={!code || loading}
            className="w-full bg-slate-900 text-white hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 h-11"
        >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {loading ? 'Checking...' : 'Verify Status'}
        </Button>
      </div>

      <div className="flex-grow">
          {status === 'valid' && (
              <div className="h-full p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-start gap-3">
                      <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                      <div className="space-y-1 min-w-0">
                          <p className="font-bold text-emerald-900 dark:text-emerald-100">Valid Coupon</p>
                          <div className="text-sm text-emerald-800 dark:text-emerald-300 space-y-1 mt-2">
                              <p><span className="opacity-70">Campaign:</span> <span className="font-medium block sm:inline">{couponData?.campaign_name}</span></p>
                              {couponData?.discount_value && (
                                   <p><span className="opacity-70">Value:</span> <span className="font-medium">₹{couponData.discount_value}</span></p>
                              )}
                          </div>
                      </div>
                  </div>
              </div>
          )}

          {status === 'redeemed' && (
              <div className="h-full p-4 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 animate-in fade-in slide-in-from-top-2">
                   <div className="flex items-start gap-3">
                      <AlertCircle className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                      <div className="space-y-1 min-w-0">
                          <p className="font-bold text-blue-900 dark:text-blue-100">Already Redeemed</p>
                          <div className="text-sm text-blue-800 dark:text-blue-300 space-y-1 mt-2">
                              <p><span className="opacity-70">Campaign:</span> <span className="font-medium block sm:inline">{couponData?.campaign_name}</span></p>
                              {couponData?.redeemed_at && (
                                  <p><span className="opacity-70">Date:</span> <span className="font-medium">{new Date(couponData.redeemed_at).toLocaleString("en-IN", { timeStyle: 'short', dateStyle: 'short' })}</span></p>
                              )}
                          </div>
                      </div>
                  </div>
              </div>
          )}

          {status === 'expired' && (
              <div className="h-full p-4 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-start gap-3">
                      <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                       <div className="space-y-1 min-w-0">
                          <p className="font-bold text-amber-900 dark:text-amber-100">Coupon Expired</p>
                           <div className="text-sm text-amber-800 dark:text-amber-300 space-y-1 mt-2">
                              <p>This coupon is no longer active.</p>
                              <p><span className="opacity-70">Campaign:</span> <span className="font-medium">{couponData?.campaign_name}</span></p>
                          </div>
                      </div>
                  </div>
              </div>
          )}

          {status === 'invalid' && (
              <div className="h-full p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-start gap-3">
                      <XCircle className="h-6 w-6 text-red-600 dark:text-red-400 flex-shrink-0" />
                      <div className="space-y-1">
                          <p className="font-bold text-red-900 dark:text-red-100">Invalid Coupon</p>
                          <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                              The code <span className="font-mono font-medium">{code}</span> does not exist or is invalid.
                          </p>
                      </div>
                  </div>
              </div>
          )}
          
          {status === 'idle' && (
             <div className="h-full flex items-center justify-center p-4 text-center rounded-xl border border-dashed border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50">
                 <p className="text-sm text-gray-400">Enter a coupon code above to verify its status.</p>
             </div>
          )}
      </div>
    </div>
  );
}
