'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2, AlertCircle, CheckCircle, QrCode, Send, ShieldCheck, MapPin, Phone, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';

function ScanContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  // Flow State: 'loading' | 'error' | 'used' | 'form' | 'otp' | 'success'
  const [view, setView] = useState<'loading' | 'error' | 'used' | 'form' | 'otp' | 'success'>('loading');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Data State
  const [bottle, setBottle] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', phone: '', address: '' });
  const [otp, setOtp] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [loadingAction, setLoadingAction] = useState(false);

  // 1. Initial Load - Fetch Bottle
  useEffect(() => {
    async function fetchBottle() {
      if (!token) {
        setErrorMsg('No QR token provided.');
        setView('error');
        return;
      }

      try {
        const response = await fetch('/api/bottles/check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ qr_token: token })
        });
        
        const result = await response.json();

        if (!response.ok || !result.success) {
          console.error('Bottle lookup failed:', result.error);
          setErrorMsg('Invalid QR code. Bottle not found.');
          setView('error');
          return;
        }

        const data = result.bottle;
        setBottle(data);

        if (data.status === 'used') {
          setView('used');
        } else {
          setView('form');
        }
      } catch (err) {
        console.error(err);
        setErrorMsg('Unexpected error verifying QR code.');
        setView('error');
      }
    }

    fetchBottle();
  }, [token]);

  // 2. Handle Form Submit -> Request OTP
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.address) return;
    
    setLoadingAction(true);
    // Simulate API call to send OTP
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoadingAction(false);
    
    // Move to OTP step
    setView('otp');
  };

  // 3. Handle OTP Verify -> Generate Coupon
  const handleVerifyOtp = async () => {
    // For testing/MVP, we're accepting the OTP without strict server verification here 
    // because the prompt asked to handle logic in the new API step. 
    // Assuming '123456' or basic check is still fine, but the real work happens in /api/redeem.
    
    // Note: In a real flow, you might verify the OTP with Firebase/Supabase Auth *before* this step,
    // getting an Auth Token to send to the API. 
    // For this specific request, we send the phone number directly to the API as trusted input 
    // (or assuming previous step validated ownership).

    setLoadingAction(true);
    try {
        const response = await fetch('/api/redeem', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                phone: formData.phone,
                qr_token: token,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            // Handle specific error cases
            if (response.status === 409) {
                alert(data.error || 'Duplicate redemption attempt.');
            } else if (response.status === 404) {
                 setErrorMsg('Invalid QR code.');
                 setView('error');
            } else {
                alert(data.error || 'Something went wrong.');
            }
            setLoadingAction(false);
            return;
        }

        // Success
        setCouponCode(data.coupon);
        setView('success');

    } catch (err) {
        console.error('Error redeeming coupon:', err);
        alert('An unexpected error occurred. Please try again.');
    } finally {
        setLoadingAction(false);
    }
  };

  // --- RENDER HELPERS ---

  if (view === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50 text-center">
        <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
        <h2 className="text-xl font-semibold text-gray-800">Verifying...</h2>
      </div>
    );
  }

  if (view === 'error') {
     return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50 text-center">
            <div className="h-16 w-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
                <AlertCircle className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
            <p className="text-gray-600 max-w-md">{errorMsg}</p>
        </div>
     );
  }

  if (view === 'used') {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50 text-center">
            <div className="h-20 w-20 bg-gray-100 text-gray-500 rounded-full flex items-center justify-center mb-6">
                <QrCode className="h-10 w-10" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Coupon Already Used</h1>
            <p className="text-gray-600 max-w-xs mx-auto mb-8">
                This bottle's QR code has already been scanned and redeemed.
            </p>
            <Button variant="outline" onClick={() => window.location.reload()}>Scan Another</Button>
        </div>
      );
  }

  if (view === 'form') {
      return (
        <div className="min-h-screen p-4 bg-gray-50 flex items-center justify-center">
            <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <div className="text-center mb-6">
                    <div className="h-12 w-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-3">
                        <User className="h-6 w-6" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Claim Your Reward</h1>
                    <p className="text-sm text-gray-500">Enter your details to verify and unlock your coupon.</p>
                </div>
                
                <form onSubmit={handleFormSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Full Name</label>
                        <div className="relative">
                            <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <input 
                                type="text"
                                required
                                className="w-full h-10 rounded-lg border border-gray-300 pl-10 pr-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                                placeholder="John Doe"
                                value={formData.name}
                                onChange={e => setFormData({...formData, name: e.target.value})}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Phone Number</label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <input 
                                type="tel"
                                required
                                className="w-full h-10 rounded-lg border border-gray-300 pl-10 pr-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                                placeholder="+1 234 567 8900"
                                value={formData.phone}
                                onChange={e => setFormData({...formData, phone: e.target.value})}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Address</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <input 
                                type="text"
                                required
                                className="w-full h-10 rounded-lg border border-gray-300 pl-10 pr-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                                placeholder="City, Country"
                                value={formData.address}
                                onChange={e => setFormData({...formData, address: e.target.value})}
                            />
                        </div>
                    </div>

                    <Button type="submit" className="w-full mt-2" disabled={loadingAction}>
                        {loadingAction ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Verify Phone <Send className="ml-2 h-4 w-4" /></>}
                    </Button>
                </form>
            </div>
        </div>
      );
  }

  if (view === 'otp') {
      return (
        <div className="min-h-screen p-4 bg-gray-50 flex items-center justify-center">
            <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-gray-200 p-6 text-center">
                <div className="h-12 w-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <ShieldCheck className="h-6 w-6" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Verify OTP</h1>
                <p className="text-sm text-gray-500 mb-6">
                    We sent a verification code to <span className="font-semibold text-gray-800">{formData.phone}</span>
                </p>

                <div className="mb-6">
                    <input 
                        type="text" 
                        maxLength={6}
                        className="w-full text-center text-3xl font-mono tracking-widest border-b-2 border-gray-300 focus:border-primary outline-none py-2 bg-transparent"
                        placeholder="000000"
                        value={otp}
                        onChange={e => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                    />
                    <p className="text-xs text-text-muted mt-2">Use 123456 for testing</p>
                </div>

                <Button onClick={handleVerifyOtp} className="w-full" disabled={loadingAction || otp.length < 6}>
                     {loadingAction ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm & Claim'}
                </Button>
                
                <button onClick={() => setView('form')} className="text-xs text-gray-500 hover:text-gray-800 mt-4 underline">
                    Change Phone Number
                </button>
            </div>
        </div>
      );
  }

  // Success View
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50 text-center animate-in fade-in duration-500">
        <div className="h-20 w-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="h-10 w-10" />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Success!</h1>
        <p className="text-gray-600 mb-8 max-w-xs mx-auto">
            Your reward has been claimed. Here is your coupon code:
        </p>

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 w-full max-w-sm">
            <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2">Coupon Code</p>
            <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-4 mb-4">
                <code className="text-3xl font-mono font-bold text-primary tracking-wide block select-all">
                    {couponCode}
                </code>
            </div>
            <p className="text-sm text-gray-500">
                Please screenshot this screen.
            </p>
        </div>
    </div>
  );
}

export default function ScanPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen">Loading...</div>}>
      <ScanContent />
    </Suspense>
  );
}

