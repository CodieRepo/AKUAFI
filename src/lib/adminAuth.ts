import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function verifyAdmin() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
            // No-op for read-only validation
        },
      },
    }
  );

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    console.log('[VerifyAdmin] No user found via getUser()', error);
    throw new Error('Unauthorized');
  }

  // Check against 'admins' table
  const { data: admin, error: adminError } = await supabase
    .from("admins")
    .select("id")
    .eq("user_id", user.id) // Match auth.users.id
    .single();

  if (adminError || !admin) {
    console.error(`[VerifyAdmin] Failed for user ${user.id}: Record not found in admins table.`, adminError);
    throw new Error('Forbidden');
  }

  console.log(`[VerifyAdmin] Success for user ${user.id}`);

  return { user, adminId: admin.id };
}
