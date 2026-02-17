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

  const MAX_LENGTH = 25;
  const MIN_LENGTH = 5;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let value = e.target.value.toUpperCase();
      
      // 1. Replace Unicode Dashes
      value = value.replace(/[–—]/g, "-");

      // 2. Remove invalid characters (Keep A-Z, 0-9, -)
      // Also prevents spaces
      value = value.replace(/[^A-Z0-9-]/g, "");

      setCode(value);
  };

  const handleVerify = async () => {
    if (!code || code.length < MIN_LENGTH) return;
    
    // Final Trim before sending
    const cleanCode = code.trim();
    console.log("[Verify Coupon] Normalizing Input:", cleanCode);
    
    setLoading(true);
    setStatus('idle');
    setCouponData(null);

    try {
        const supabase = createClient();
        
        // 1. Fetch coupon via 'coupons' TABLE directly (RLS Protected)
        // We bypass 'client_coupons' view to avoid RLS 400 errors on views.
        // We assume RLS handles 'client_id' isolation automatically (auth.uid() check).
        
        console.log(`[Verify Coupon] Verifying: ${cleanCode}`);

        // DEBUG: Check Auth Session
        const { data: authData } = await supabase.auth.getUser();
        console.log("AUTH UID:", authData?.user?.id);
        
        if (!authData?.user) {
             console.log("Current Session:", await supabase.auth.getSession());
        }

        const { data, error } = await supabase
            .from('coupons')
            .select(`
                coupon_code,
                status,
                generated_at:issued_at,
                redeemed_at,
                expires_at:expiry_date,
                discount_value,
                campaigns(name)
            `)
            .eq('coupon_code', cleanCode) 
            .maybeSingle();

        if (error) {
             console.error('[Verify Coupon] DB Error:', error);
             console.log("DB ERROR FULL:", error);
             setStatus('invalid');
        } else if (!data) {
             console.log('[Verify Coupon] No record found for:', cleanCode);
             setStatus('invalid');
        } else {
            console.log("[Verify Coupon] Record Found:", data);
            
            // Flatten campaign name if present
            const enhancedData = {
                ...data,
                campaign_name: data.campaigns?.name || data.campaign_name || 'Unknown Campaign'
            };

            console.log("[Verify Coupon] Enhanced Data:", enhancedData);
            setCouponData(enhancedData);
            
            // Status Logic
            if (enhancedData.status === 'claimed' || enhancedData.status === 'redeemed') {
                setStatus('redeemed');
            } else if (enhancedData.status === 'active') {
                setStatus('valid');
            } else {
                setStatus('expired');
            }
        }
    } catch (err) {
        console.error(err);
        setStatus('invalid');
    } finally {
        setLoading(false);
    }
  };

  const handleClaim = async () => {
    if (!couponData) return;
    if (!confirm(`Are you sure you want to mark coupon ${couponData.coupon_code} as claimed?`)) return;

    setLoading(true);
    try {
        const res = await fetch('/api/coupons/redeem', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ coupon_code: couponData.coupon_code })
        });

        const data = await res.json();
        
        if (!res.ok) throw new Error(data.error || 'Failed to claim');

        // Optimistic Update
        setCouponData({
            ...couponData,
            status: 'claimed',
            redeemed_at: new Date().toISOString() // Approximate local
        });
        setStatus('redeemed');
        alert("Coupon successfully marked as claimed!");

    } catch (err: any) {
        alert(err.message);
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
                placeholder="PROMO-CODE-123" 
                className={`
                    w-full rounded-xl border 
                    bg-gray-50 dark:bg-slate-950 
                    text-gray-900 dark:text-white 
                    pl-4 py-3 text-sm font-mono 
                    outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 
                    transition-all uppercase placeholder:normal-case placeholder:font-sans placeholder:text-gray-400 dark:placeholder:text-gray-500
                    ${code.length > 0 && code.length < MIN_LENGTH ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200 dark:border-slate-700'}
                `}
                value={code}
                onChange={handleInputChange}
                onKeyDown={(e) => e.key === 'Enter' && code.length >= MIN_LENGTH && handleVerify()}
                maxLength={MAX_LENGTH}
                autoComplete="off"
            />
            {/* Character Counter */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-mono pointer-events-none">
                {code.length} / {MAX_LENGTH}
            </div>
        </div>
        
        {/* Validation Message */}
        {code.length > 0 && code.length < MIN_LENGTH && (
            <p className="text-[10px] text-red-500 pl-1">
                Code must be at least {MIN_LENGTH} characters.
            </p>
        )}

        <Button 
            onClick={handleVerify} 
            disabled={!code || code.length < MIN_LENGTH || loading}
            className="w-full bg-slate-900 text-white hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 h-11 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {loading ? 'Checking...' : 'Verify Status'}
        </Button>
      </div>

      <div className="flex-grow">
          {status === 'valid' && (
              <div className="h-full p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20 animate-in fade-in slide-in-from-top-2 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start gap-3 mb-3">
                        <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                        <div className="space-y-1 min-w-0">
                            <p className="font-bold text-emerald-900 dark:text-emerald-100">Valid Coupon</p>
                            <p className="text-xs text-emerald-600 dark:text-emerald-400 uppercase tracking-wide font-medium">Status: Active</p>
                        </div>
                    </div>
                    
                    <div className="text-sm text-emerald-800 dark:text-emerald-300 space-y-2 border-t border-emerald-200 dark:border-emerald-800/30 pt-3">
                        <div className="flex justify-between">
                            <span className="opacity-70">Campaign:</span> 
                            <span className="font-medium text-right">{couponData?.campaign_name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="opacity-70">Generated:</span> 
                            <span className="font-medium text-right">{new Date(couponData.generated_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="opacity-70">Expires:</span> 
                            <span className="font-medium text-right">{couponData.expires_at ? new Date(couponData.expires_at).toLocaleDateString() : 'Never'}</span>
                        </div>
                         {couponData?.discount_value > 0 && (
                            <div className="flex justify-between">
                                <span className="opacity-70">Value:</span> 
                                <span className="font-medium text-right">₹{couponData.discount_value}</span>
                            </div>
                        )}
                    </div>
                  </div>

                  <button 
                    onClick={handleClaim}
                    disabled={loading}
                    className="mt-4 w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
                  >
                    {loading ? 'Processing...' : 'Mark as Claimed'}
                  </button>
              </div>
          )}

          {status === 'redeemed' && (
              <div className="h-full p-4 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 animate-in fade-in slide-in-from-top-2">
                   <div className="flex items-start gap-3 mb-3">
                      <AlertCircle className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                      <div className="space-y-1 min-w-0">
                          <p className="font-bold text-blue-900 dark:text-blue-100">Already Redeemed</p>
                          <p className="text-xs text-blue-600 dark:text-blue-400 uppercase tracking-wide font-medium">Status: Claimed</p>
                      </div>
                  </div>
                  
                  <div className="text-sm text-blue-800 dark:text-blue-300 space-y-2 border-t border-blue-200 dark:border-blue-800/30 pt-3">
                        <div className="flex justify-between">
                            <span className="opacity-70">Campaign:</span> 
                            <span className="font-medium text-right">{couponData?.campaign_name}</span>
                        </div>
                        {couponData?.redeemed_at && (
                           <div className="flex justify-between">
                                <span className="opacity-70">Redeemed:</span> 
                                <span className="font-medium text-right">{new Date(couponData.redeemed_at).toLocaleString("en-IN", { timeStyle: 'short', dateStyle: 'medium' })}</span>
                            </div>
                        )}
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
