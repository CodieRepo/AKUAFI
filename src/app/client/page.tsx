import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export default async function ClientGateway() {
  const supabase = await createClient();
  
  // Quick session check
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // If we have a user, assume they might be a client and let dashboard layout handle the strict role check
    // This avoids double DB calls here if possible, but for better UX we might want to check.
    // However, the rule is "Client must NEVER redirect to /".
    // Let's redirect to dashboard, and if they are not client, dashboard layout kicks them out to login.
    return redirect("/client/dashboard");
  } else {
    return redirect("/client/login");
  }
}
