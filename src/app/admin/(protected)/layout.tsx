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
    await verifyAdmin();
    // Pass user details to layout components if needed, or fetching inside them.
    // Assuming components handle their own state or receive props.
    // For now, wrapping children with standard shell structure.
  } catch {
    redirect("/admin/login?error=unauthorized");
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-blue-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <AdminTopbar />

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-transparent p-6 lg:p-8">
          <div className="max-w-[1600px] mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
