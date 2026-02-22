import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import ClientSettingsForm from "@/components/client/settings/ClientSettingsForm";

// Force dynamic rendering so DB values are always fresh after save
export const dynamic = "force-dynamic";

export default async function ClientSettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/client/login");
  }

  // Fetch client record (auth.getUser() already verified)
  const { data: client } = await supabase
    .from("clients")
    .select("id, client_name, phone")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="max-w-5xl mx-auto px-6 py-12 md:p-12 space-y-8 animate-in fade-in duration-700">
        <div className="space-y-3">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 dark:from-slate-100 dark:via-slate-300 dark:to-slate-100 bg-clip-text text-transparent">
            Settings
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-lg">
            Manage your account preferences and security
          </p>
        </div>

        <ClientSettingsForm user={user} client={client} />
      </div>
    </div>
  );
}
