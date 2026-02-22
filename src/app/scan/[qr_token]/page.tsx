'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Loader2, AlertCircle, CheckCircle, Send, ShieldCheck, User, Phone, MapPin, Sparkles } from 'lucide-react';
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
  const otpInputRefs = useRef<Array<HTMLInputElement | null>>([]);

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

  const handleOtpDigitChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const nextOtp = Array.from({ length: 6 }, (_, i) => otp[i] ?? '');
    nextOtp[index] = digit;
    setOtp(nextOtp.join('').trimEnd());

    if (digit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !(otp[index] ?? '') && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    setOtp(pasted);
    const focusIndex = Math.min(pasted.length, 5);
    otpInputRefs.current[focusIndex]?.focus();
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


  // 2. Send OTP
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.phone || formData.phone.length !== 10) {
      alert('Please enter a valid 10-digit phone number.'); return;
    }
    if (!qr_token) { alert('Invalid Request: Missing QR Token'); return; }

    const fullPhone = `+91${formData.phone}`;
    console.log('[OTP] ▶ Sending OTP. Payload:', { phone: fullPhone, qr_token, name: formData.name });
    setLoadingAction(true);
    try {
      const response = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: fullPhone, qr_token }),
      });
      console.log('[OTP] ◀ Response status:', response.status, response.statusText);
      const result = await response.json();
      console.log('[OTP] ◀ Response body:', result);
      if (!response.ok) {
        console.error('[OTP] ✘ API error:', result.error);
        if (result.error === 'Mobile already registered') {
          alert('This mobile number has already claimed a reward for this campaign.');
        } else if (result.error === 'Coupon redeemed from this QR') {
          setView('used');
        } else {
          alert(`OTP Error: ${result.error || 'Failed to send OTP'}`);
        }
        return;
      }
      console.log('[OTP] ✔ OTP sent successfully. session_id:', result.session_id);
      setOtpSent(true);
    } catch (error: any) {
      console.error('[OTP] ✘ Fetch threw an exception:', error);
      alert(error.message || 'Failed to send code. Check console for details.');
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
      <div className="relative flex flex-col items-center justify-center min-h-screen p-4 text-center overflow-hidden bg-gradient-to-br from-blue-50 via-white to-cyan-50">
        <div className="absolute -top-24 -left-20 h-72 w-72 rounded-full bg-blue-200/30 blur-3xl" />
        <div className="absolute -bottom-28 -right-20 h-80 w-80 rounded-full bg-cyan-200/30 blur-3xl" />
        <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
        <p className="text-gray-600 tracking-wide">Verifying QR Code...</p>
      </div>
    );
  }

  if (view === 'error') {
    return (
      <div className="relative flex flex-col items-center justify-center min-h-screen p-4 text-center overflow-hidden bg-gradient-to-br from-blue-50 via-white to-cyan-50">
        <div className="absolute -top-24 -left-20 h-72 w-72 rounded-full bg-blue-200/30 blur-3xl" />
        <div className="absolute -bottom-28 -right-20 h-80 w-80 rounded-full bg-cyan-200/30 blur-3xl" />
        <AkuafiLogo />
        <div className="w-full max-w-sm rounded-[18px] border border-white/60 bg-white/70 backdrop-blur-xl shadow-[0_14px_40px_-24px_rgba(37,99,235,0.35)] p-7 animate-in fade-in duration-300">
          <div className="h-16 w-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4 mx-auto">
            <AlertCircle className="h-8 w-8" />
          </div>
          <h1 className="text-xl font-semibold tracking-wide text-gray-900 mb-2">Something went wrong</h1>
          <p className="text-gray-600 max-w-xs mx-auto">{errorMsg}</p>
        </div>
      </div>
    );
  }

  if (view === 'used') {
    return (
      <div className="relative flex flex-col items-center justify-center min-h-screen p-4 text-center overflow-hidden bg-gradient-to-br from-blue-50 via-white to-cyan-50">
        <div className="absolute -top-24 -left-20 h-72 w-72 rounded-full bg-blue-200/30 blur-3xl" />
        <div className="absolute -bottom-28 -right-20 h-80 w-80 rounded-full bg-cyan-200/30 blur-3xl" />
        <AkuafiLogo />
        <div className="bg-white/70 rounded-[20px] backdrop-blur-xl shadow-[0_18px_50px_-28px_rgba(30,41,59,0.45)] border border-white/60 p-8 w-full max-w-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_26px_60px_-26px_rgba(245,158,11,0.35)] animate-in fade-in duration-300">
          <div className="h-20 w-20 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 text-amber-500 flex items-center justify-center mb-5 mx-auto shadow-inner">
            <AlertCircle className="h-9 w-9" />
          </div>
          <h1 className="text-2xl font-semibold tracking-wide text-gray-900 mb-2">QR Already Used</h1>
          <p className="text-gray-500 text-sm leading-6 mb-6">
            If you believe this is an error, please contact support.
          </p>
          <div className="space-y-3">
            <Button
              type="button"
              className="w-full rounded-xl bg-gradient-to-r from-[#2563EB] to-[#0EA5E9] text-white border-0 shadow-[0_14px_30px_-18px_rgba(37,99,235,0.75)] hover:from-[#1E4FD8] hover:to-[#0284C7] transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
              onClick={() => window.location.reload()}
            >
              Scan Again
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full rounded-xl border-gray-200 bg-white/70 hover:bg-white text-gray-700"
              onClick={() => window.location.href = '/contact'}
            >
              Contact Support
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'form') {
    return (
      <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-gradient-to-br from-blue-50 via-white to-cyan-50">
        <div className="absolute -top-24 -left-20 h-72 w-72 rounded-full bg-blue-200/30 blur-3xl" />
        <div className="absolute -bottom-28 -right-20 h-80 w-80 rounded-full bg-cyan-200/30 blur-3xl" />
        <div className="w-full max-w-md">
          <AkuafiLogo />
          <div className="bg-white/70 backdrop-blur-xl rounded-[20px] shadow-[0_18px_46px_-28px_rgba(37,99,235,0.40)] border border-white/70 p-7 animate-in fade-in duration-300">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-semibold tracking-wide text-gray-900">Claim Your Reward</h1>
              <p className="text-sm text-gray-500 mt-1 leading-6">Enter your details to generate your coupon.</p>
            </div>

            <form onSubmit={otpSent ? handleVerifyAndRedeem : handleSendCode} className="space-y-4">
              {!otpSent ? (
                <>
                  <div>
                    <div className="relative">
                      <User className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        required
                        placeholder=" "
                        className="peer w-full h-12 pl-10 pr-3 rounded-xl border border-gray-200 bg-white/80 text-sm text-gray-900 shadow-sm outline-none transition-all duration-200 focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100"
                        value={formData.name}
                        onChange={handleNameChange}
                      />
                      <label className="absolute left-10 top-3.5 text-sm text-gray-500 transition-all duration-200 pointer-events-none peer-focus:-top-2 peer-focus:left-3 peer-focus:text-[11px] peer-focus:px-2 peer-focus:bg-white peer-focus:text-[#2563EB] peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:left-3 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:px-2 peer-[:not(:placeholder-shown)]:bg-white">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <div className="flex h-12 rounded-xl border border-gray-200 bg-white/80 overflow-hidden shadow-sm transition-all duration-200 focus-within:border-[#2563EB] focus-within:ring-4 focus-within:ring-blue-100">
                      <div className="bg-blue-50/70 flex items-center px-3 border-r border-gray-200">
                        <Phone className="h-3.5 w-3.5 text-gray-500 mr-1" />
                        <span className="text-sm font-medium text-gray-600">+91</span>
                      </div>
                      <div className="relative flex-1">
                        <input
                          type="tel"
                          required
                          placeholder=" "
                          className="peer w-full h-12 px-3 text-sm text-gray-900 outline-none bg-transparent"
                          value={formData.phone}
                          onChange={handlePhoneChange}
                        />
                        <label className="absolute left-3 top-3.5 text-sm text-gray-500 transition-all duration-200 pointer-events-none peer-focus:-top-2 peer-focus:text-[11px] peer-focus:px-2 peer-focus:bg-white peer-focus:text-[#2563EB] peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:px-2 peer-[:not(:placeholder-shown)]:bg-white">
                          Phone Number <span className="text-red-500">*</span>
                        </label>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">10-digit mobile number</p>
                  </div>

                  <div className="pt-3 border-t border-gray-100">
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <textarea
                        placeholder=" "
                        className="peer w-full h-24 pl-10 pr-3 py-3 rounded-xl border border-gray-200 bg-white/80 text-sm text-gray-900 shadow-sm outline-none transition-all duration-200 focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100 resize-none"
                        value={formData.address}
                        onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                      />
                      <label className="absolute left-10 top-3 text-sm text-gray-500 transition-all duration-200 pointer-events-none peer-focus:-top-2 peer-focus:left-3 peer-focus:text-[11px] peer-focus:px-2 peer-focus:bg-white peer-focus:text-[#2563EB] peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:left-3 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:px-2 peer-[:not(:placeholder-shown)]:bg-white">
                        Location <span className="text-gray-400 font-normal">(optional)</span>
                      </label>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full mt-2 h-12 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#0EA5E9] text-white border-0 shadow-[0_16px_34px_-20px_rgba(37,99,235,0.80)] hover:from-[#1E4FD8] hover:to-[#0284C7] transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
                    disabled={loadingAction || formData.phone.length !== 10}
                  >
                    {loadingAction ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="mr-2 h-4 w-4" /> Send Verification Code</>}
                  </Button>
                </>
              ) : (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="mb-4 rounded-2xl border border-green-100 bg-white/85 backdrop-blur-sm px-4 py-3 shadow-[0_14px_28px_-20px_rgba(22,163,74,0.35)] transition-all duration-300">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                        <CheckCircle className="h-4 w-4" />
                      </div>
                      <div className="text-left">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-green-700">Verification code sent</p>
                        <p className="text-xs text-gray-600">+91 {formData.phone}</p>
                      </div>
                    </div>
                  </div>
                  <div className="mb-5">
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <ShieldCheck className="h-4 w-4 text-[#16A34A]" />
                      <label className="text-xs font-semibold text-gray-700 uppercase tracking-[0.12em]">Verification Code</label>
                    </div>
                    <div className="flex items-center justify-center gap-2 mb-3">
                      {Array.from({ length: 6 }).map((_, index) => (
                        <input
                          key={index}
                          ref={(el) => { otpInputRefs.current[index] = el; }}
                          type="text"
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          maxLength={1}
                          className="h-12 w-11 rounded-xl border border-gray-200 bg-white/90 text-center text-lg font-semibold tracking-wider text-gray-900 outline-none transition-all duration-200 focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100"
                          value={otp[index] ?? ''}
                          onChange={(e) => handleOtpDigitChange(index, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(index, e)}
                          onPaste={handleOtpPaste}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 text-center">
                      Resend available in 00:30
                    </p>
                    <p className="text-xs text-gray-500 mt-3 text-center">
                      <button type="button" onClick={() => setOtpSent(false)} className="text-primary hover:underline">
                        Change number
                      </button>
                    </p>
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-12 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#0EA5E9] text-white border-0 shadow-[0_16px_34px_-20px_rgba(37,99,235,0.80)] hover:from-[#1E4FD8] hover:to-[#0284C7] transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
                    disabled={loadingAction || otp.length !== 6}
                  >
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
      <div className="relative flex flex-col items-center justify-center min-h-screen p-4 text-center overflow-hidden bg-gradient-to-br from-blue-50 via-white to-cyan-50 animate-in fade-in duration-500">
        <div className="absolute -top-24 -left-20 h-72 w-72 rounded-full bg-blue-200/30 blur-3xl" />
        <div className="absolute -bottom-28 -right-20 h-80 w-80 rounded-full bg-cyan-200/30 blur-3xl" />
        <AkuafiLogo />
        <div className="bg-white/75 backdrop-blur-xl rounded-[20px] shadow-[0_18px_50px_-28px_rgba(22,163,74,0.45)] border border-white/70 p-8 w-full max-w-sm">

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
