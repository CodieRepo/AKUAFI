'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Loader2, AlertCircle, CheckCircle, QrCode, Send, ShieldCheck, User, Phone } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/utils/supabase/client';

export default function Page() {
  const params = useParams();
  // Ensure we handle the possibility of params being null/undefined or the specific token being array/string
  const qr_token = (params?.code as string) || (params?.qr_token as string); // Fallback for safety, but prioritize 'code'
  const hasRedeemedRef = useRef(false);

  // View States: 'loading' | 'error' | 'used' | 'form' | 'success'
  const [view, setView] = useState<'loading' | 'error' | 'used' | 'form' | 'success'>('loading');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Data
  const [bottle, setBottle] = useState<any>(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    phone: '',
    addressLine: '',
    city: '',
    state: '',
    pincode: ''
  });
  const [couponCode, setCouponCode] = useState('');

  // OTP State
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [loadingAction, setLoadingAction] = useState(false);

  // --- Input Handlers (Strict Validation) ---

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow alphabets and spaces only
    const val = e.target.value;
    if (/^[a-zA-Z\s]*$/.test(val)) {
      setFormData(prev => ({ ...prev, name: val }));
    }
  };

  const handleCityStateChange = (field: 'city' | 'state') => (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow alphabets and spaces only
    const val = e.target.value;
    if (/^[a-zA-Z\s]*$/.test(val)) {
      setFormData(prev => ({ ...prev, [field]: val }));
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Digits only, max 10
    const val = e.target.value.replace(/\D/g, '');
    if (val.length <= 10) {
      setFormData(prev => ({ ...prev, phone: val }));
    }
  };

  const handlePincodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Digits only, max 6
    const val = e.target.value.replace(/\D/g, '');
    if (val.length <= 6) {
      setFormData(prev => ({ ...prev, pincode: val }));
    }
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Letters, numbers, spaces, commas
    const val = e.target.value;
    if (/^[a-zA-Z0-9\s,]*$/.test(val)) {
      setFormData(prev => ({ ...prev, addressLine: val }));
    }
  };

  // --- API Interactions ---

  // 1. Fetch Bottle on Mount (Existing logic)
  useEffect(() => {
    async function fetchBottle() {
      if (!qr_token) {
        setErrorMsg('No QR token provided.');
        setView('error');
        return;
      }

      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('bottles')
          .select('*')
          .eq('qr_token', qr_token)
          .single();

        if (error || !data) {
          console.error('Bottle lookup failed:', error?.message);
          setErrorMsg('Invalid QR code. Bottle not found.');
          setView('error');
          return;
        }

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
    if (!formData.phone || formData.phone.length !== 10) {
      alert('Please enter a valid 10-digit phone number.');
      return;
    }
    
    // Auto-prepend +91
    const fullPhone = `+91${formData.phone}`;
    setLoadingAction(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        phone: fullPhone,
      });

      if (error) throw error;
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
    if (!otp) return;

    // Validate Address Fields if user is verifyng (checking only if we are in otpSent state, which we are)
    if (formData.pincode.length !== 6) {
        alert("Pincode must be 6 digits.");
        return;
    }
    if (!formData.addressLine || !formData.city || !formData.state) {
        alert("Please complete the address section.");
        return;
    }

    setLoadingAction(true);
    const fullPhone = `+91${formData.phone}`;

    try {
      const supabase = createClient();
      // A. Verify OTP
      const { data: authData, error: authError } = await supabase.auth.verifyOtp({
        phone: fullPhone,
        token: otp,
        type: 'sms',
      });

      if (authError || !authData.user) {
        throw new Error(authError?.message || 'Invalid verification code.');
      }

      // GUARD: Prevent Double Redemption
      if (hasRedeemedRef.current) return;
      hasRedeemedRef.current = true;

      // B. Redemption API
      const cleanToken = Array.isArray(qr_token) ? qr_token[0] : qr_token;
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Authentication failed.");

      const res = await fetch('/api/redeem', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          // Phone is now extracted from token on backend, but we can send if needed (backend ignores)
          qr_token: cleanToken.trim(),
          name: formData.name.trim() 
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errorText = data.details ? `${data.error}: ${data.details}` : (data.error || 'Redemption failed');
        throw new Error(errorText);
      }

      setCouponCode(data.coupon);
      setView('success');

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

                {/* Address Section */}
                <div className="pt-4 border-t border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Address Details</h3>
                    
                    <div className="space-y-3">
                        <div>
                            <input
                                type="text"
                                required
                                placeholder="Address Line (Letters, Numbers, Comma)"
                                className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm focus:ring-1 focus:ring-primary outline-none"
                                value={formData.addressLine}
                                onChange={handleAddressChange}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <input
                                type="text"
                                required
                                placeholder="City"
                                className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm focus:ring-1 focus:ring-primary outline-none"
                                value={formData.city}
                                onChange={handleCityStateChange('city')}
                            />
                            <input
                                type="text"
                                required
                                placeholder="State"
                                className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm focus:ring-1 focus:ring-primary outline-none"
                                value={formData.state}
                                onChange={handleCityStateChange('state')}
                            />
                        </div>
                        <div>
                             <input
                                type="text"
                                required
                                inputMode="numeric"
                                placeholder="Pincode (6 digits)"
                                className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm focus:ring-1 focus:ring-primary outline-none"
                                value={formData.pincode}
                                onChange={handlePincodeChange}
                            />
                        </div>
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
                      className="w-full h-10 pl-10 pr-3 rounded-lg border border-gray-300 text-sm focus:ring-1 focus:ring-primary outline-none tracking-widest"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Sent to +91 {formData.phone}. <button type="button" onClick={() => setOtpSent(false)} className="text-primary hover:underline">Change</button>
                  </p>
                </div>

                <Button type="submit" className="w-full" disabled={loadingAction}>
                  {loadingAction ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Verify & Claim <CheckCircle className="ml-2 h-4 w-4" /></>}
                </Button>
              </div>
            )}
          </form>
        </div>
      </div>
    );
  }

  // Success
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50 text-center animate-in fade-in zoom-in">
      <div className="h-20 w-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
        <CheckCircle className="h-10 w-10" />
      </div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Success!</h1>
      <p className="text-gray-600 mb-8">Your reward is ready:</p>

      <div className="bg-white rounded-xl shadow p-6 w-full max-w-xs border border-dashed border-gray-300">
        <code className="text-3xl font-mono font-bold text-primary block select-all">{couponCode}</code>
      </div>
      <p className="text-sm text-gray-400 mt-4">Take a screenshot to save.</p>
    </div>
  );
}
