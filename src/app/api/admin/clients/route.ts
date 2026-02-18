import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // 1. Admin Verification (Centralized)
    await verifyAdmin();

    const supabase = await createClient();

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
