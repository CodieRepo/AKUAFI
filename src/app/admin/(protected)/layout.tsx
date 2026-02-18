import { verifyAdmin } from "@/lib/adminAuth";
import { redirect } from "next/navigation";
import AdminSidebar from "@/components/admin/layout/AdminSidebar";
import AdminTopbar from "@/components/admin/layout/AdminTopbar";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    const { user } = await verifyAdmin();
    // Pass user details to layout components if needed, or fetching inside them.
    // Assuming components handle their own state or receive props.
    // For now, wrapping children with standard shell structure.
  } catch (error) {
    redirect("/admin/login?error=unauthorized");
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-900">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <AdminTopbar />

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-slate-900 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
