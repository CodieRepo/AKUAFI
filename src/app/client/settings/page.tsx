import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import ClientSettingsForm from "@/components/client/settings/ClientSettingsForm";

export default async function ClientSettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/client/login");
  }

  // We fetch client data, but if it's missing (e.g. new user or error),
  // we SHOULD NOT redirect. The user is authenticated (auth.getUser() passed).
  const { data: client } = await supabase
    .from("clients")
    .select("id, client_name, phone")
    .eq("user_id", user.id)
    .maybeSingle();

  // Fetch this client's campaigns for the Minimum Order Value section
  const { data: campaigns } = client?.id
    ? await supabase
        .from("campaigns")
        .select("id, name, minimum_order_value")
        .eq("client_id", client.id)
        .order("created_at", { ascending: false })
    : { data: [] };

  return (
    <div className="max-w-[1600px] mx-auto p-6 md:p-8 space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">Manage your account preferences and security.</p>
      </div>

      <ClientSettingsForm user={user} client={client} campaigns={campaigns || []} />
    </div>
  );
}
