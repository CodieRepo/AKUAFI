import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

export default async function ClientLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  // Strict Role Check: Must be in 'user_roles' with role 'client'
  // Note: We use the normal authenticated client, respecting RLS (if enabled)
  // but here we are checking a specific role table content.
  const { data: userRole } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  const isClient = userRole?.role === "client";

  if (!isClient) {
    // If user is logged in but not a client (e.g. admin trying to access client area),
    // redirect to home or their appropriate dashboard.
    // For now, redirect to root to match requirements.
    return redirect("/");
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 
          We might want a Sidebar or Navbar here in the future.
          For now, keeping it minimal as per "Clean SaaS" requirement.
          Maybe just a simple wrapper.
      */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
