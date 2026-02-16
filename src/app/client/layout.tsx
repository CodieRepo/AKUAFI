import { createClient } from "@/utils/supabase/server";
// import { redirect } from "next/navigation"; // Removed for safety
import ClientNavbar from "@/components/client/layout/ClientNavbar";

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let clientName = "";

  if (user) {
      const { data: client } = await supabase
        .from("clients")
        .select("client_name")
        .eq("user_id", user.id)
        .single();
      
      if (client) {
          clientName = client.client_name;
      }
  }

  // CRITICAL: Removed redirects to prevent loops.
  // If not logged in, we just render children (Login Page).
  // If logged in, we verify client exists but don't redirect if missing (just empty name).

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-black/95 flex flex-col font-sans">
      {/* Only show Navbar if we have a client name (implying logged in & valid) */}
      {/* Or maybe show it always? Login page has its own layout/header? */}
      {/* Login page `src/app/client/login/page.tsx` has its own header/layout elements. */}
      {/* If we render ClientNavbar here, it will appear on Login page too. */}
      {/* Previously it was redirecting, so Login page was unreachable if it was wrapped here? */}
      {/* Wait, if Login is under /client, and Layout enforces auth, Login was unreachable? */}
      {/* That confirms the loop. */}
      {/* For now, let's only render Navbar if user is logged in. */}
      
      {user && clientName && <ClientNavbar clientName={clientName} />}
      
      {children}
    </div>
  );
}
