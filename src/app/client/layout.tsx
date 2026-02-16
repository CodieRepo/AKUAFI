import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
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

  if (!user) {
    return redirect("/client/login");
  }

  const { data: client, error } = await supabase
    .from("clients")
    .select("client_name")
    .eq("user_id", user.id)
    .single();

  if (error || !client) {
    // If no client profile, force login or handle error
    return redirect("/client/login"); 
  }

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-black/95 flex flex-col font-sans">
      <ClientNavbar clientName={client.client_name} />
      {children}
    </div>
  );
}
