import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export default async function ClientGateway() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    return redirect("/client/dashboard");
  } else {
    return redirect("/client/login");
  }
}
