import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import AdminTopbar from '@/components/admin/layout/AdminTopbar';
import AdminSidebar from '@/components/admin/layout/AdminSidebar';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  // Optional: Check if user is actually an admin
  // For now, we enforce login. Role check can be added here if 'admins' table is populated.
  
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AdminTopbar />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
          {children}
        </main>
      </div>
    </div>
  );
}
