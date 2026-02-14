import { createClient } from '@/utils/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // 1. Admin Verification (Strict Security Check)
    const supabase = await createClient();
    const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !currentUser) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized: User not authenticated' },
        { status: 401 }
      );
    }

    // Check if current user is an admin
    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', currentUser.id)
      .eq('role', 'admin') // Explicitly check for 'admin' role
      .single();

    if (roleError || !userRole) {
      console.error('Admin verification failed for user:', currentUser.id);
      return NextResponse.json(
        { success: false, message: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // --- Admin Verified beyond this point ---

    // 2. Parse Request Body
    const body = await request.json();
    const { client_name, email, password } = body;

    if (!client_name || !email || !password) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields: client_name, email, password' },
        { status: 400 }
      );
    }

    // 3. Create Auth User (Using Service Role)
    const supabaseAdmin = getSupabaseAdmin();

    const { data: newUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email for clients
      user_metadata: { client_name }
    });

    if (createUserError || !newUser.user) {
      console.error('Failed to create auth user:', createUserError);
      return NextResponse.json(
        { success: false, message: createUserError?.message || 'Failed to create user' },
        { status: 400 }
      );
    }

    const newUserId = newUser.user.id;
    console.log(`Created auth user: ${newUserId} for client: ${client_name}`);

    // 4. Insert into 'clients' table
    // SECURITY CRITICAL: clients.user_id must be the NEW USER ID (the client), NOT the admin's ID
    const { data: newClient, error: clientInsertError } = await supabaseAdmin
      .from('clients')
      .insert({
        user_id: newUserId, // Linking the client entity to the new auth user
        client_name: client_name
      })
      .select('id')
      .single();

    if (clientInsertError || !newClient) {
      console.error('Failed to insert into clients table. Rolling back user creation...', clientInsertError);
      // ROLLBACK: Delete the created auth user to prevent broken state
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      return NextResponse.json(
        { success: false, message: 'Failed to create client record. Operation rolled back.' },
        { status: 500 }
      );
    }

    // 5. Insert into 'user_roles' table
    const { error: roleInsertError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: newUserId,
        role: 'client'
      });

    if (roleInsertError) {
      console.error('Failed to assign client role. Rolling back...', roleInsertError);
      // ROLLBACK: Delete client record AND auth user
      // Note: Deleting the user will cascade delete the client/role due to FK constraints if set, 
      // but explicit cleanup is safer if constraints aren't perfect yet.
      // However, our migration uses ON DELETE CASCADE for user_roles and clients referencing auth.users.
      // So deleting the auth user is actually sufficient if constraints match.
      // We'll keep explicit delete for 'clients' just to be double sure if the cascade isn't on that specific relation?
      // Actually, relying on deleteUser(newUserId) is best if we trust the cascade. 
      // User requested "ON DELETE CASCADE" check.
      // Let's do explicit cleanup to be safe against schema drift.
      await supabaseAdmin.from('clients').delete().eq('id', newClient.id);
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      return NextResponse.json(
        { success: false, message: 'Failed to assign user role. Operation rolled back.' },
        { status: 500 }
      );
    }

    // 6. Success Response
    // RETURN clients.id (Business Entity ID), NOT user_id (Auth ID)
    return NextResponse.json({
      success: true,
      message: 'Client created successfully',
      clientId: newClient.id
    });

  } catch (error: any) {
    console.error('Unexpected error in create-client API:', error);
    return NextResponse.json(
      { success: false, message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
