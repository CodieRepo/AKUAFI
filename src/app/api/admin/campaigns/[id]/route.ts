import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { verifyAdmin } from '@/lib/adminAuth';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await verifyAdmin(request);
    const { id } = await params;

    const { data, error } = await supabaseAdmin
      .from('campaigns')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    // Optional: Get stats here or separate endpoint?
    // User asked for "Campaign Stats GET /api/admin/campaigns/:id/stats" separate.
    // So just return campaign info here.

    return NextResponse.json(data);
  } catch (error: any) {
    const status = error.message.includes('Unauthorized') ? 401 : error.message.includes('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await verifyAdmin(request);
    const { id } = await params;
    const body = await request.json();

    const { data, error } = await supabaseAdmin
      .from('campaigns')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    const status = error.message.includes('Unauthorized') ? 401 : error.message.includes('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
