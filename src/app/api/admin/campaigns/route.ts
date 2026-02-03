import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { verifyAdmin } from '@/lib/adminAuth';

export async function GET(request: Request) {
  try {
    await verifyAdmin(request);

    const { data, error } = await getSupabaseAdmin()
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
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

    const now = new Date();
    const startDate = new Date(body.start_date);
    const endDate = new Date(body.end_date);
    
    // Determine is_active based on date range
    const isActive = startDate <= now && now <= endDate;

    // STRICT SCHEMA INSERT
    const { data, error } = await getSupabaseAdmin()
      .from('campaigns')
      .insert({
        name: body.name,
        description: body.description,
        // Removed coupon fields as they are not in the schema
        start_date: body.start_date,
        end_date: body.end_date,
        is_active: isActive,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    const status = error.message.includes('Unauthorized') ? 401 : error.message.includes('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
