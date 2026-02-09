import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

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
