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
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        // Check role before redirecting to prevent loops
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .single();

        if (roleData?.role === "client") {
          router.replace("/client/dashboard");
        } else if (roleData?.role === "admin") {
          router.replace("/admin/dashboard");
        } else {
            // If logged in user is neither (e.g. strict mismatch), force signout so they can log in correctly
            await supabase.auth.signOut();
        }
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

      // 2. Fetch User Role
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();
      
      if (roleError || !roleData) {
        // Fallback or specific error handling
        console.error("Role fetch error:", roleError);
        throw new Error("User role not found. Please contact support.");
      }

      // 3. Refresh router to ensure next steps have valid session cookies
      router.refresh();

      // 4. Redirect based on role
      if (roleData.role === 'admin') {
        router.replace('/admin/dashboard');
      } else if (roleData.role === 'client') {
        router.replace('/client/dashboard');
      } else {
        // Unknown role - Show error instead of redirecting to "/"
        console.warn("Unknown role:", roleData.role);
        setError("Access denied: Unknown user role.");
        setLoading(false);
      }

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
