'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Loader2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/Button';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam === 'unauthorized') {
      setError("You are not authorized to access the admin area.");
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        // Refresh router to sync server-side session
        router.refresh();
        
        // Use replace to prevent back-navigation to login
        router.replace('/admin/dashboard');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      // Clean up local session if auth failed partially
      await supabase.auth.signOut();
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-gray-200 p-8">
        <div className="text-center mb-8">
          <img src="/logo/akuafi-logo.png" alt="Akuafi" className="h-12 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-gray-900">Admin Access</h1>
          <p className="text-sm text-gray-500 mt-2">Login to manage campaigns</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Email</label>
            <input
              type="email"
              required
              className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Password</label>
            <input
              type="password"
              required
              className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <Button type="submit" className="w-full mt-2" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Login'}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function AdminLogin() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
