import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { verifyAdmin } from '@/lib/adminAuth';

export async function GET(request: Request) {
  try {
    await verifyAdmin(request);

    const { data, error } = await getSupabaseAdmin()
      .from('campaigns')
      .select('*')
      .in('status', ['draft', 'active', 'paused', 'completed'])
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[API] Campaigns GET Error:', error);
    const status = error.message.includes('Unauthorized') ? 401 : error.message.includes('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const { adminId } = await verifyAdmin(request);
    const body = await request.json();

    // Basic Validation
    if (!body.name || !body.start_date || !body.end_date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // STRICT SCHEMA INSERT
    const payload = {
        name: body.name,
        description: body.description,
        status: 'draft',
        start_date: body.start_date,
        end_date: body.end_date,
        created_at: new Date().toISOString()
    };

    const { data, error } = await getSupabaseAdmin()
      .from('campaigns')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[API] Campaigns POST Error:', error);
    const status = error.message.includes('Unauthorized') ? 401 : error.message.includes('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
