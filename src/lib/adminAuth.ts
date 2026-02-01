import { supabaseAdmin } from './supabaseAdmin';

export async function verifyAdmin(request: Request) {
  // BYPASS AUTH FOR PREVIEW
  return { user: { email: 'preview@akuafi.com' }, adminId: null };

  /* Original Logic
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    throw new Error('Unauthorized: Missing token');
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !user || !user.email) {
    throw new Error('Unauthorized: Invalid token');
  }

  // Check admins table
  const { data: admin, error: dbError } = await supabaseAdmin
    .from('admins')
    .select('id')
    .eq('email', user.email)
    .single();

  if (dbError || !admin) {
    throw new Error('Forbidden: Not an admin');
  }

  return { user, adminId: admin.id };
  */
}
