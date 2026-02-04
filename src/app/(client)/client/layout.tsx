import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          // No-op for read-only checks
        },
      },
    }
  );

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login');
  }

  // Strict Client (User) Check
  // Note: 'users' table is used for clients per user context
  const { data: clientUser } = await supabase
    .from('users') // Ensuring we check the correct table as per prompt (users for clients)
    .select('id')
    .eq('id', user.id)
    .single();

  if (!clientUser) {
    redirect('/login');
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* 
        Ideally Client components would have their own Navbar/Layout structure.
        Assuming children contains the client dashboard structure or importing a ClientNavbar if it existed.
        For now, just rendering children protected by auth.
      */}
      {children}
    </div>
  );
}
