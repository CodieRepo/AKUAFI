'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/utils/supabase/client';
import { Loader2 } from 'lucide-react';
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
      setError("Please login to access the client dashboard.");
    }
  }, [searchParams]);

  // Session Guard
  useEffect(() => {
    const supabase = createClient();
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .single();

        if (roleData?.role === "client") {
          router.replace("/client/dashboard");
        } else if (roleData?.role === "admin") {
          // If admin, maybe redirect to admin or just stay here?
          // Let's redirect to admin to be helpful, or sign out.
          // For now, let's just let the logic below handle it if they try to login again,
          // but for UX, if they are ALREADY admin, send them to admin.
          router.replace("/admin/dashboard");
        }
      }
    };
    checkSession();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError || !data.user) {
        throw new Error(authError?.message || 'Authentication failed');
      }

      // Check Role
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id)
        .single();
      
      if (roleError || !roleData) {
        throw new Error("User role not found.");
      }

      if (roleData.role !== 'client') {
         // If they are admin trying to login here, we should probably warn them or redirect them.
         // If they are admin, they can technically "login", but the Client Dashboard Layout will kick them out.
         // So better to block here.
         await supabase.auth.signOut();
         throw new Error("Access denied. This portal is for Clients only.");
      }

      router.refresh();
      router.replace('/client/dashboard');

    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-gray-200 p-8">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <Image 
              src="/logo/akuafi-logo.png" 
              alt="Akuafi" 
              width={200} 
              height={72} 
              priority
              className="h-16 w-auto object-contain" 
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Client Login</h1>
          <p className="text-sm text-gray-500 mt-2">Access your campaign analytics dashboard</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 text-center">
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
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Log In'}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function ClientLoginForm() {
  return (
    <Suspense>
        <LoginForm />
    </Suspense>
  );
}
