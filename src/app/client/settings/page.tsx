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

  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("id, client_name")
    .eq("user_id", user.id)
    .single();

  if (clientError || !client) {
    return redirect("/client/login");
  }

  return (
      <div className="max-w-[1600px] mx-auto p-6 md:p-8 space-y-8 animate-in fade-in duration-500">
          <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
              <p className="text-gray-500 dark:text-gray-400 mt-2">Manage your account preferences and security.</p>
          </div>

          <ClientSettingsForm user={user} client={client} />
      </div>
  );
}
