'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Loader2, AlertCircle, CheckCircle, QrCode, Send, ShieldCheck, User, Phone, MapPin, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Image from 'next/image';

// ── Logo component (reused on every view) ─────────────────────────────────────
function AkuafiLogo() {
  return (
    <div className="flex justify-center mb-6">
      <Image
        src="/logo/akuafi-logo.png"
        alt="Akuafi"
        width={140}
        height={48}
        className="object-contain"
        priority
      />
    </div>
  );
}

export default function Page() {
  const params = useParams();
  const qr_token = params?.qr_token as string;
  const hasRedeemedRef = useRef(false);

  // View States: 'loading' | 'error' | 'used' | 'form' | 'success'
  const [view, setView] = useState<'loading' | 'error' | 'used' | 'form' | 'success'>('loading');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Data
  const [bottle, setBottle] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '', // optional
  });
  const [couponCode, setCouponCode] = useState('');
  const [discountValue, setDiscountValue] = useState<number | null>(null);

  // OTP State
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [loadingAction, setLoadingAction] = useState(false);

  // Input Handlers
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (/^[a-zA-Z\s]*$/.test(val)) setFormData(prev => ({ ...prev, name: val }));
  };
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    if (val.length <= 10) setFormData(prev => ({ ...prev, phone: val }));
  };

  // 1. Fetch Bottle on Mount
  useEffect(() => {
    async function fetchBottle() {
      if (!qr_token) {
        setErrorMsg('Invalid QR Code. Token missing.');
        setView('error');
        return;
      }
      try {
        const response = await fetch('/api/bottles/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ qr_token }),
        });
        const result = await response.json();
        console.log('Bottle Check Response:', result);

        if (!response.ok || !result.success) {
          if (result.error === 'Coupon redeemed from this QR') { setView('used'); return; }
          setErrorMsg(result.error || 'Invalid QR code. Bottle not found.');
          setView('error');
          return;
        }

        const data = result.bottle;
        setBottle(data);

        // Permanently locked: backend says this bottle already has a coupon
        if (result.exists === true) {
          setView('used');
          return;
        }

        // Otherwise allow the flow to proceed
        if (data.is_used) { setView('used'); return; }
        setView('form');
      } catch {
        setErrorMsg('Unexpected error verifying QR code.');
        setView('error');
      }
    }
    fetchBottle();
  }, [qr_token]);

  // View States Data
  const [existingCoupon, setExistingCoupon] = useState<any>(null);

  // 2. Send OTP
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.phone || formData.phone.length !== 10) {
      alert('Please enter a valid 10-digit phone number.'); return;
    }
    if (!qr_token) { alert('Invalid Request: Missing QR Token'); return; }

    const fullPhone = `+91${formData.phone}`;
    setLoadingAction(true);
    try {
      const response = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: fullPhone, qr_token }),
      });
      const result = await response.json();
      if (!response.ok) {
        if (result.error === 'Mobile already registered') {
          alert('This mobile number has already claimed a reward for this campaign.');
        } else if (result.error === 'Coupon redeemed from this QR') {
          setView('used');
        } else {
          throw new Error(result.error || 'Failed to send OTP');
        }
        return;
      }
      setOtpSent(true);
    } catch (error: any) {
      alert(error.message || 'Failed to send code.');
    } finally {
      setLoadingAction(false);
    }
  };

  // 3. Verify & Redeem
  const handleVerifyAndRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) { alert('Please enter a valid 6-digit OTP.'); return; }
    if (!qr_token) { alert('Session invalid: Missing QR Token.'); return; }

    setLoadingAction(true);
    setCouponCode('');
    setDiscountValue(null);

    const fullPhone = `+91${formData.phone}`;
    try {
      const response = await fetch('/api/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: fullPhone,
          otp,
          qr_token,
          name: formData.name.trim(),
          address: formData.address,
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        if (result.error === 'Coupon redeemed from this QR') { setView('used'); }
        else if (result.error === 'Mobile already registered') {
          alert('This mobile number has already registered for this campaign.');
        } else {
          throw new Error(result.error || 'Verification failed');
        }
        return;
      }

      const finalCoupon = result.coupon_code || result.coupon;
      if (finalCoupon) {
        setCouponCode(finalCoupon);
        if (result.discount_value != null) setDiscountValue(result.discount_value);
        if (hasRedeemedRef.current) return;
        hasRedeemedRef.current = true;
        setTimeout(() => setView('success'), 0);
      } else {
        alert('Coupon generation failed: Code missing in response.');
      }
    } catch (error: any) {
      alert(error.message || 'An unexpected error occurred.');
    } finally {
      setLoadingAction(false);
    }
  };

  // ── Render Views ─────────────────────────────────────────────────────────────

  if (view === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50 text-center">
        <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
        <p className="text-gray-600">Verifying QR Code…</p>
      </div>
    );
  }

  if (view === 'error') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50 text-center">
        <AkuafiLogo />
        <div className="h-16 w-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h1>
        <p className="text-gray-600 max-w-xs">{errorMsg}</p>
      </div>
    );
  }

  if (view === 'used') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50 text-center">
        <AkuafiLogo />
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 w-full max-w-sm">
          <div className="h-16 w-16 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center mb-4 mx-auto">
            <AlertCircle className="h-8 w-8" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-3">This QR has already been used.</h1>
          <p className="text-gray-500 text-sm">
            If you believe this is an error, please contact support.
          </p>
        </div>
      </div>
    );
  }

  if (view === 'form') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <div className="w-full max-w-md">
          <AkuafiLogo />
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Claim Your Reward</h1>
              <p className="text-sm text-gray-500 mt-1">Enter your details to generate your coupon.</p>
            </div>

            <form onSubmit={otpSent ? handleVerifyAndRedeem : handleSendCode} className="space-y-4">
              {!otpSent ? (
                <>
                  {/* Name */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Name <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        required
                        placeholder="Your Name"
                        className="w-full h-10 pl-10 pr-3 rounded-lg border border-gray-300 text-sm focus:ring-1 focus:ring-primary outline-none"
                        value={formData.name}
                        onChange={handleNameChange}
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Phone Number <span className="text-red-500">*</span></label>
                    <div className="flex rounded-lg border border-gray-300 overflow-hidden focus-within:ring-1 focus-within:ring-primary">
                      <div className="bg-gray-100 flex items-center px-3 border-r border-gray-300">
                        <Phone className="h-3.5 w-3.5 text-gray-500 mr-1" />
                        <span className="text-sm font-medium text-gray-600">+91</span>
                      </div>
                      <input
                        type="tel"
                        required
                        placeholder="9876543210"
                        className="w-full h-10 px-3 text-sm outline-none"
                        value={formData.phone}
                        onChange={handlePhoneChange}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">10-digit mobile number</p>
                  </div>

                  {/* Location — OPTIONAL */}
                  <div className="pt-3 border-t border-gray-100">
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                      Location <span className="text-gray-400 font-normal normal-case">(optional)</span>
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                      <textarea
                        placeholder="Enter your city / area… (optional)"
                        className="w-full h-20 pl-10 pr-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-1 focus:ring-primary outline-none resize-none"
                        value={formData.address}
                        onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full mt-2" disabled={loadingAction || formData.phone.length !== 10}>
                    {loadingAction ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="mr-2 h-4 w-4" /> Send Verification Code</>}
                  </Button>
                </>
              ) : (
                // OTP Step
                <div className="animate-in slide-in-from-right fade-in duration-300">
                  <div className="mb-2 p-3 rounded-lg bg-green-50 border border-green-100 text-center">
                    <p className="text-xs text-green-700 font-medium">Code sent to +91 {formData.phone}</p>
                  </div>
                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Verification Code</label>
                    <div className="relative">
                      <ShieldCheck className="absolute left-3 top-2.5 h-4 w-4 text-green-600" />
                      <input
                        type="text"
                        required
                        maxLength={6}
                        placeholder="Enter 6-digit code"
                        className="w-full h-10 pl-10 pr-3 rounded-lg border border-gray-300 text-sm focus:ring-1 focus:ring-primary outline-none tracking-widest text-center text-lg"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      <button type="button" onClick={() => setOtpSent(false)} className="text-primary hover:underline">
                        ← Change number
                      </button>
                    </p>
                  </div>
                  <Button type="submit" className="w-full" disabled={loadingAction || otp.length !== 6}>
                    {loadingAction ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle className="mr-2 h-4 w-4" /> Verify &amp; Claim Reward</>}
                  </Button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Success View
  if (view === 'success') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-b from-green-50 to-gray-50 text-center animate-in fade-in zoom-in duration-500">
        <AkuafiLogo />
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 w-full max-w-sm">

          {/* Success badge */}
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
              <CheckCircle className="h-9 w-9" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-1">You&apos;re All Set!</h1>
          <p className="text-sm text-gray-500 mb-6">Your exclusive reward is ready to use.</p>

          {/* Discount highlight */}
          {discountValue != null && discountValue > 0 && (
            <div className="mb-5 p-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md">
              <div className="flex items-center justify-center gap-2 mb-0.5">
                <Sparkles className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Your Discount</span>
              </div>
              <p className="text-4xl font-extrabold">₹{discountValue} <span className="text-xl font-normal">OFF</span></p>
            </div>
          )}

          {/* Coupon code */}
          <div className="mb-4">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-2 font-medium">Coupon Code</p>
            <div className="border-2 border-dashed border-primary/40 rounded-xl py-4 px-6 bg-primary/5">
              <p className="text-2xl font-mono font-bold text-primary tracking-widest">{couponCode}</p>
            </div>
          </div>

          <p className="text-xs text-gray-400 flex items-center justify-center gap-1 mt-4">
            📸 Screenshot this page to save your coupon.
          </p>
        </div>
      </div>
    );
  }

  return null;
}
