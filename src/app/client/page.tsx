import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export default async function ClientRoot() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect("/client/login");
  }

  redirect("/client/dashboard");
}
