'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Loader2, AlertCircle, CheckCircle, QrCode, Send, ShieldCheck, User, Phone, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function Page() {
  const params = useParams();
  // 1️⃣ Scan Route Parameter Handling: Extract qr_token strictly from params
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
    address: '' // Single optional address field
  });
  const [couponCode, setCouponCode] = useState('');

  // OTP State
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [loadingAction, setLoadingAction] = useState(false);

  // --- Input Handlers (Strict Validation) ---

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (/^[a-zA-Z\s]*$/.test(val)) {
      setFormData(prev => ({ ...prev, name: val }));
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    if (val.length <= 10) {
      setFormData(prev => ({ ...prev, phone: val }));
    }
  };


  // --- API Interactions ---

  // 1. Fetch Bottle on Mount (Updated to use API)
  useEffect(() => {
    console.log("SCAN_QR_TOKEN_PAGE_MOUNTED", qr_token);
    
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
            body: JSON.stringify({ qr_token })
        });
        
        const result = await response.json();

        if (!response.ok || !result.success) {
          console.error('Bottle lookup failed:', result.error);
          
          // 6️⃣ Error Handling (User Friendly)
          if (result.error === 'Coupon redeemed from this QR') {
              setView('used');
              return;
          }

          setErrorMsg(result.error || 'Invalid QR code. Bottle not found.');
          setView('error');
          return;
        }

        const data = result.bottle;
        setBottle(data);
        
        // Check if already used
        if (data.is_used) {
            setView('used');
            return;
        }

        setView('form'); 

      } catch (err) {
        console.error('Unexpected exception during fetch:', err);
        setErrorMsg('Unexpected error verifying QR code.');
        setView('error');
      }
    }

    fetchBottle();
  }, [qr_token]);

  // 2. Handle Send OTP
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 4️⃣ Pre-Submission Validation
    if (!formData.phone || formData.phone.length !== 10) {
      alert('Please enter a valid 10-digit phone number.');
      return;
    }
    
    if (!qr_token) {
        alert('Invalid Request: Missing QR Token');
        return;
    }
    
    // Auto-prepend +91
    const fullPhone = `+91${formData.phone}`;
    
    // 5️⃣ Logging & Debug
    console.log("Frontend: handleSendCode called");
    console.log("Sending OTP Request:", { phone: fullPhone, qr_token });

    setLoadingAction(true);

    try {
      // 2️⃣ OTP Send API Call Fix: Send BOTH phone and qr_token
      const response = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            phone: fullPhone,
            qr_token: qr_token
        })
      });

      const result = await response.json();

      if (!response.ok) {
        // 6️⃣ Error Handling (User Friendly)
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
      console.error('OTP Send Error:', error);
      alert(error.message || 'Failed to send code.');
    } finally {
      setLoadingAction(false);
    }
  };

  // 3. Handle Verify & Redeem
  const handleVerifyAndRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 4️⃣ Pre-Submission Validation
    if (!otp || otp.length !== 6) {
        alert("Please enter a valid 6-digit OTP.");
        return;
    }
    if (!qr_token) {
        alert("Session invalid: Missing QR Token.");
        return;
    }

    // Validate Address Fields (Optional but recommended)
    // if (!formData.address) ...

    setLoadingAction(true);
    // Explicit State Reset
    setCouponCode("");
    
    const fullPhone = `+91${formData.phone}`;

    try {
      // 3️⃣ Redeem API Call Fix: Send address if present
      console.log("Redeeming:", { phone: fullPhone, otp, qr_token });

      const response = await fetch('/api/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
           phone: fullPhone,
           otp: otp,
           qr_token: qr_token,
           name: formData.name.trim(),
           address: formData.address // Send Address
        })
      });

      const result = await response.json();
      console.log("FULL API RESPONSE:", result);

      if (!response.ok) {
        // 6️⃣ Error Handling
        if (result.error === 'Coupon redeemed from this QR') {
            setView('used');
        } else if (result.error === 'Mobile already registered') {
            alert('This mobile number has already registered for this campaign.');
        } else {
            throw new Error(result.error || 'Verification failed');
        }
        return;
      }

      // Check strictly for success and coupon_code (or coupon as fallback)
      const finalCoupon = result.coupon_code || result.coupon;

      if (finalCoupon) {
          console.log("SETTING COUPON:", finalCoupon);
          setCouponCode(finalCoupon);

          // GUARD: Prevent Double Redemption (Frontend Ref)
          if (hasRedeemedRef.current) return;
          hasRedeemedRef.current = true;

          // IMPORTANT: delay view switch to ensure state commit
          setTimeout(() => {
            setView("success");
          }, 0);
      } else {
          console.error("Coupon missing or invalid response:", result);
          alert("Coupon generation failed: Code missing in response.");
      }

    } catch (error: any) {
      console.error('Verification/Redemption error:', error);
      alert(error.message || 'An unexpected error occurred.');
    } finally {
      setLoadingAction(false);
    }
  };

  // --- Render Views ---

  if (view === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50 text-center">
        <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
        <p className="text-gray-600">Verifying Bottle...</p>
      </div>
    );
  }

  if (view === 'error') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50 text-center">
        <div className="h-16 w-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Error</h1>
        <p className="text-gray-600">{errorMsg}</p>
      </div>
    );
  }

  if (view === 'used') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50 text-center">
        <div className="h-16 w-16 bg-gray-100 text-gray-500 rounded-full flex items-center justify-center mb-4">
          <QrCode className="h-8 w-8" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Coupon Already Used</h1>
        <p className="text-gray-600">This QR code has already been redeemed.</p>
      </div>
    );
  }

  if (view === 'form') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Claim Reward</h1>
            <p className="text-sm text-gray-500">Enter your details to generate your coupon.</p>
          </div>

          <form onSubmit={otpSent ? handleVerifyAndRedeem : handleSendCode} className="space-y-4">
            {!otpSent ? (
              // Step 1: Personal & Address Details
              <>
                {/* Name */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Name</label>
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
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Phone Number</label>
                  <div className="flex rounded-lg border border-gray-300 overflow-hidden focus-within:ring-1 focus-within:ring-primary">
                    <div className="bg-gray-100 flex items-center px-3 border-r border-gray-300">
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
                  <p className="text-xs text-muted-foreground mt-1">10-digit mobile number</p>
                </div>

                {/* Address Section (Simplified) */}
                <div className="pt-4 border-t border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Location Details</h3>
                    
                    <div>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <textarea
                                required
                                placeholder="Enter your current location / city..."
                                className="w-full h-20 pl-10 pr-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-1 focus:ring-primary outline-none resize-none"
                                value={formData.address}
                                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">This validates your coupon claim.</p>
                    </div>
                </div>

                <Button type="submit" className="w-full mt-4" disabled={loadingAction || formData.phone.length !== 10}>
                  {loadingAction ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Send Code <Send className="ml-2 h-4 w-4" /></>}
                </Button>
              </>
            ) : (
              // Step 2: OTP Entry
              <div className="animate-in slide-in-from-right fade-in duration-300">
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
                  <p className="text-xs text-gray-500 mt-2">
                    Sent to +91 {formData.phone}. <button type="button" onClick={() => setOtpSent(false)} className="text-primary hover:underline">Change</button>
                  </p>
                </div>

                <Button type="submit" className="w-full" disabled={loadingAction || otp.length !== 6}>
                  {loadingAction ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Verify & Claim <CheckCircle className="ml-2 h-4 w-4" /></>}
                </Button>
              </div>
            )}
          </form>
        </div>
      </div>
    );
  }

  // Render Debug
  console.log("RENDER STATE:", { view, couponCode });

  // Success
  if (view === 'success') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50 text-center animate-in fade-in zoom-in">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 w-full max-w-sm">
          <h1 className="text-2xl font-bold mb-4">Success!</h1>
          <p className="mb-4">Your reward is ready:</p>

          <div className="border-2 border-dashed border-gray-300 rounded-lg py-3 px-4 text-lg font-mono font-bold text-primary">
            {couponCode}
          </div>

          <p className="text-sm text-gray-500 mt-3">
            Take a screenshot to save.
          </p>
        </div>
      </div>
    );
  }
  
  // Default Return (Should not be reached ideally if states cover all cases, but fallback to null)
  return null;
}
