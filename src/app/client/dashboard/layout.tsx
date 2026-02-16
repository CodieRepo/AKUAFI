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
    redirect("/client/login");
  }

  // Strict Role Check removed to prevent loops - relying on session presence primarily
  // User asked for: if (!session) redirect("/client/login") DO NOT redirect anywhere else.
  // We keep it extremely simple.
  
  return (
    <>
        {children}
    </>
  );
}
