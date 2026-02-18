import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { verifyAdmin } from '@/lib/adminAuth';

export async function GET(request: Request) {
  try {
    await verifyAdmin();

    // Optimized Query: Select new fields + counters
    const { data, error } = await getSupabaseAdmin()
      .from('campaigns')
      .select('id, name, status, total_scans, redeemed_count, created_at, location, campaign_date, client_id')
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
    const { adminId } = await verifyAdmin();
    const body = await request.json();

    // Enhanced Validation
    if (!body.name || !body.start_date || !body.end_date || !body.client_id || !body.location) {
      return NextResponse.json({ error: 'Missing required fields: name, location, start_date, end_date, client_id' }, { status: 400 });
    }

    const startUTC = new Date(body.start_date);
    const endUTC = new Date(body.end_date);
    const nowUTC = new Date();

    if (startUTC >= endUTC) {
        return NextResponse.json({ error: 'Start date must be before end date' }, { status: 400 });
    }

    if (endUTC < nowUTC) {
        return NextResponse.json({ error: 'Cannot create campaign entirely in the past' }, { status: 400 });
    }

    // STRICT SCHEMA INSERT (Updated)
    const payload = {
        name: body.name,
        description: body.description,
        client_id: body.client_id,
        location: body.location.trim(), // New Field
        campaign_date: body.campaign_date || null, // New Field (Optional)
        status: 'draft',
        start_date: body.start_date,
        end_date: body.end_date,
        // Coupon Config
        coupon_prefix: body.coupon_prefix,
        coupon_length: body.coupon_length,
        coupon_type: body.coupon_type,
        coupon_min_value: body.coupon_min_value,
        coupon_max_value: body.coupon_max_value,
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
