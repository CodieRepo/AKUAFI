import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import AdminTopbar from '@/components/admin/layout/AdminTopbar';
import Sidebar from '@/components/layout/Sidebar';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1. Create Supabase Client (Standard Server Client)
  const supabase = await createClient();

  // 2. Verified User Check (Secure)
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    console.log("Admin Layout: No verified user. Redirecting to /login.");
    redirect('/login');
  }

  // 3. Strict Admin Role Check (Service Role / Secure Query)
  const { data: adminUser, error: adminError } = await supabase
    .from('admins')
    .select('id')
    .eq('id', user.id)
    .single();

  if (adminError || !adminUser) {
    console.log("Admin Layout: User is not admin. Redirecting to /login.");
    redirect('/login'); 
  }

  // 4. Render UI ONLY if Auth Passes
  // If we reached here, the user is logged in and is an admin.
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminTopbar />
        <main className="flex-1 overflow-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
