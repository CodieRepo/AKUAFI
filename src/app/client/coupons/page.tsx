'use client';

import { useEffect, useState } from 'react';
import CouponTable, { Coupon } from '@/components/dashboard/coupons/CouponTable';
import CouponVerification from '@/components/dashboard/coupons/CouponVerification';
import { supabase } from '@/lib/supabaseclient';

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCoupons() {
      try {
        const { data, error } = await supabase
          .from('coupons')
          .select('*')
          .order('generated_at', { ascending: false });

        if (error) {
          console.error('Error fetching coupons:', error);
        } else {
          setCoupons(data || []);
        }
      } catch (err) {
        console.error('Unexpected error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchCoupons();
  }, []);

  return (
    <div className="space-y-8">
      <div>
         <h1 className="text-3xl font-bold tracking-tight text-foreground">Coupons Management</h1>
         <p className="text-text-muted">Verify and track coupon usage across your campaigns.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
          {/* Verification Box - Takes 1/3 width on large screens */}
          <div className="lg:col-span-1">
              <CouponVerification />
          </div>

           <div className="lg:col-span-2">
                {/* Could put stats here later */}
           </div>
      </div>
      
      {/* Full width table */}
      <div>
         <h2 className="text-lg font-bold mb-4">All Coupons</h2>
         <CouponTable coupons={coupons} loading={loading} />
      </div>
    </div>
  );
}

