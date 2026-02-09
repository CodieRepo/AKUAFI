'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Search, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
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
        const { data, error } = await supabase
            .from('coupons')
            .select('*')
            .eq('coupon_code', code) // Assuming coupon_code is the column name in Supabase based on previous steps
            .maybeSingle(); // Use maybeSingle to avoid 406 on 0 rows if using single()

        if (error) {
             console.error('Error verifying coupon:', error);
             setStatus('invalid');
        } else if (!data) {
             setStatus('invalid');
        } else {
            setCouponData(data);
            
            // Logic requested:
            // If row found AND claimed = true -> show warning "Coupon already redeemed"
            // If row found AND status != 'active' -> show warning "Coupon expired"
            // If row found AND claimed = false AND status = 'active' -> show success "Valid coupon"
            
            // Check claimed first (assuming boolean 'claimed' or checking status 'redeemed' as fallback)
            if (data.claimed === true || data.status === 'redeemed') {
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
    <div className="rounded-xl border border-border bg-white p-6 shadow-soft-sm">
      <h3 className="text-lg font-bold mb-4">Verify Coupon</h3>
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-muted" />
            <input 
                type="text" 
                placeholder="Enter coupon code..." 
                className="w-full rounded-lg border border-border bg-surface pl-10 py-2 text-sm outline-none focus:ring-1 focus:ring-primary uppercase placeholder:normal-case"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
            />
        </div>
        <Button onClick={handleVerify} disabled={!code || loading}>
            {loading ? 'Verifying...' : 'Verify Status'}
        </Button>
      </div>

      {status === 'valid' && (
          <div className="mt-4 p-4 rounded-lg bg-green-50 border border-green-100 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                  <p className="font-bold text-green-800">Valid Coupon</p>
                  <p className="text-sm text-green-700">Code: {couponData?.coupon_code}</p>
                  <p className="text-sm text-green-700">Ready to be redeemed.</p>
              </div>
          </div>
      )}

      {status === 'redeemed' && (
          <div className="mt-4 p-4 rounded-lg bg-blue-50 border border-blue-100 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                  <p className="font-bold text-blue-800">Already Redeemed</p>
                  <p className="text-sm text-blue-700">Redeemed on: {new Date(couponData?.redeemed_at).toLocaleDateString()}</p>
              </div>
          </div>
      )}

      {status === 'expired' && (
          <div className="mt-4 p-4 rounded-lg bg-orange-50 border border-orange-100 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                  <p className="font-bold text-orange-800">Coupon Expired</p>
                  <p className="text-sm text-orange-700">This coupon is no longer valid.</p>
              </div>
          </div>
      )}

      {status === 'invalid' && (
          <div className="mt-4 p-4 rounded-lg bg-red-50 border border-red-100 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
              <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                  <p className="font-bold text-red-800">Invalid Coupon</p>
                  <p className="text-sm text-red-700">This code does not exist.</p>
              </div>
          </div>
      )}
    </div>
  );
}

