'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const supabase = createClient();

  // 0. Session Guard: Prevent logged-in users from seeing login page
  // This interacts with the Layout/Middleware logic to ensure smoothly handling
  // users who are already authenticated.
  useEffect(() => {
      const checkSession = async () => {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
              // If already logged in, determine where to go based on role
              // Since we can't easily check role client-side without a query, 
              // we can try a default redirect and let Middleware/Layout handle the rest,
              // or better yet, just go to the dashboard and let Layout redirect to / if not client.
              // But to be safe and avoid loops if this page IS the redirect target, checking role helps.
              
              // For now, simpler approach: Just go to /client/dashboard. 
              // If they are admin, Client Layout will kick them to /.
              // If they are client, they get in.
              router.replace('/client/dashboard');
          }
      };
      checkSession();
  }, [supabase, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Authenticate user
      const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError || !user) {
        throw new Error(authError?.message || 'Authentication failed');
      }

      // 2. Refresh router to ensure next steps have valid session cookies
      // This is CRITICAL for Next.js App Router to pick up the new cookie
      router.refresh();

      // 3. User is logged in, redirect to Client Dashboard
      // Middleware will handle role protection if they try to access something they shouldn't
      router.replace('/client/dashboard');

    } catch (err: any) {
        console.error('Login error:', err);
        setError(err.message);
        setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg border border-gray-200">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-900">Sign In</h1>
        
        {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm text-center">
                {error}
            </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input 
                    type="email" 
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
            </div>
            
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input 
                    type="password" 
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
            </div>

            <Button 
                type="submit" 
                disabled={loading}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg"
            >
                {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Log In'}
            </Button>
        </form>
      </div>
    </div>
  );
}
