import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function ClientDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/client/login");
  }

  // Strict Role Check
  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (!roleData || roleData.role !== "client") {
    // If they are an admin trying to access client area, or just a random user
    // We redirect them to login (or maybe signout and login)
    // To be safe and avoid infinite loops if they are admin, we simply redirect to client login.
    // The client login page should handle "Already logged in as Admin" cases if we want to be fancy,
    // but for now, strict isolation means we just deny access.
    
    // Ideally we should sign them out if they are wrong role, but server-side signout is tricky.
    // Let's just redirect to login.
    return redirect("/client/login?error=unauthorized");
  }

  return (
    <>
        {/* Placeholder for Client Sidebar/Topbar if we had them separate, 
            or just render children if they are included in the pages */}
        {children}
    </>
  );
}
