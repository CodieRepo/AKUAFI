import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
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

    // Check if current user is an admin via DB lookup
    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', currentUser.id)
      .eq('role', 'admin')
      .single();

    if (roleError || !userRole) {
      console.error('Admin verification failed for client list fetch:', currentUser.id);
      return NextResponse.json(
        { success: false, message: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // 2. Fetch Clients
    const { data: clients, error: fetchError } = await supabase
      .from('clients')
      .select('id, client_name, created_at')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Failed to fetch clients:', fetchError);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch clients' },
        { status: 500 }
      );
    }

    // 3. Return Filtered Data
    return NextResponse.json({
      success: true,
      clients: clients
    });

  } catch (error: any) {
    console.error('Unexpected error in get-clients API:', error);
    return NextResponse.json(
      { success: false, message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
