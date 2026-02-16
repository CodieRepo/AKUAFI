'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Loader2, Lock, Mail } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const supabase = createClient();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.replace('/client/dashboard');
      }
    };
    checkUser();
  }, [router, supabase]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw signInError;
      }

      router.replace('/client/dashboard');
      router.refresh(); 

    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-gray-50 dark:bg-black p-4 relative overflow-hidden font-sans">
      
      {/* Background Decor */}
      <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-blue-50 to-transparent dark:from-blue-900/10 pointer-events-none" />

      <div className="w-full max-w-md space-y-8 relative z-10 animate-in fade-in zoom-in-95 duration-500">
        
        {/* Header */}
        <div className="text-center">
            <div className="relative w-48 h-12 mx-auto mb-6">
                <Image 
                    src="/logo/akuafi-logo.png" 
                    alt="Akuafi Logo" 
                    fill
                    className="object-contain"
                    priority
                />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                Client Portal
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Sign in to manage your campaigns and analytics
            </p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-xl p-8">
            <form className="space-y-6" onSubmit={handleLogin}>
                {error && (
                    <div className="p-3 text-sm rounded-lg bg-red-50 text-red-600 dark:bg-red-900/10 dark:text-red-400 border border-red-100 dark:border-red-900/20">
                        {error}
                    </div>
                )}
                
                <div className="space-y-1.5">
                    <label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Email Address
                    </label>
                    <div className="relative group">
                         <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                         <input
                            id="email"
                            name="email"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            // Same premium input classes as Settings for consistency
                            className="
                                flex h-10 w-full rounded-lg border 
                                bg-white dark:bg-slate-950 
                                text-gray-900 dark:text-white 
                                placeholder:text-gray-400 dark:placeholder:text-gray-500
                                px-3 py-2 pl-10 text-sm 
                                ring-offset-white dark:ring-offset-slate-950
                                file:border-0 file:bg-transparent file:text-sm file:font-medium 
                                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 
                                border-gray-300 dark:border-slate-700
                                transition-all duration-200
                            "
                            placeholder="name@company.com"
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                        <label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Password
                        </label>
                    </div>
                    <div className="relative group">
                         <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                         <input
                            id="password"
                            name="password"
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="
                                flex h-10 w-full rounded-lg border 
                                bg-white dark:bg-slate-950 
                                text-gray-900 dark:text-white 
                                placeholder:text-gray-400 dark:placeholder:text-gray-500
                                px-3 py-2 pl-10 text-sm 
                                ring-offset-white dark:ring-offset-slate-950
                                file:border-0 file:bg-transparent file:text-sm file:font-medium 
                                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 
                                border-gray-300 dark:border-slate-700
                                transition-all duration-200
                            "
                            placeholder="••••••••"
                        />
                    </div>
                </div>

                <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 py-5"
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Signing in...
                        </>
                    ) : (
                        <>
                            Sign in to Dashboard
                        </>
                    )}
                </Button>
            </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500 dark:text-gray-400">
            Protected by Akuafi Security. <br/>
            <Link href="/" className="hover:text-blue-600 hover:underline">Return to Home</Link>
        </p>

      </div>
    </div>
  );
}
