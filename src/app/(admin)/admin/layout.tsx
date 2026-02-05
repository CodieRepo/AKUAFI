import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import AdminTopbar from '@/components/admin/layout/AdminTopbar';
import Sidebar from '@/components/layout/Sidebar';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const { data: { user }, error } = await supabase.auth.getUser();

  // STEP 4 DEBUG: Verify Server Layout User
  console.log("ADMIN LAYOUT USER:", user?.id ? `Found User ${user.id}` : "NULL USER", "Error:", error?.message);

  if (error || !user) {
    redirect('/login');
  }

  // Strict Admin Check
  const { data: adminUser } = await supabase
    .from('admins')
    .select('id')
    .eq('id', user.id)
    .single();

  if (!adminUser) {
    // Optionally sign out or show unauthorized
    redirect('/login'); 
  }

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
