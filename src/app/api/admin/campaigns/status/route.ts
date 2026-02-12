import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { verifyAdmin } from '@/lib/adminAuth';

export async function POST(request: Request) {
  try {
    await verifyAdmin(request);
    const body = await request.json();
    const { campaign_id, status } = body;

    // 1. Basic Validation
    if (!campaign_id || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const validStatuses = ['draft', 'active', 'paused', 'completed'];
    if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
    }

    // 2. Fetch Current Campaign State
    const { data: campaign, error: fetchError } = await getSupabaseAdmin()
        .from('campaigns')
        .select('*')
        .eq('id', campaign_id)
        .single();

    if (fetchError || !campaign) {
        return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    const currentStatus = campaign.status || 'draft';

    // 3. Enforce Valid Transitions
    // Allowed:
    // draft -> active
    // active -> paused
    // paused -> active
    // active -> completed
    // paused -> completed

    let isValid = false;

    if (currentStatus === 'draft' && status === 'active') isValid = true;
    else if (currentStatus === 'active' && status === 'paused') isValid = true;
    else if (currentStatus === 'paused' && status === 'active') isValid = true;
    else if (currentStatus === 'active' && status === 'completed') isValid = true;
    else if (currentStatus === 'paused' && status === 'completed') isValid = true;
    
    // Edge case: Idempotency (same status)
    if (currentStatus === status) {
        return NextResponse.json({ success: true, message: 'Status unchanged' });
    }

    if (!isValid) {
        return NextResponse.json({ 
            error: `Invalid status transition from ${currentStatus} to ${status}` 
        }, { status: 400 });
    }

    // 4. Activation Rules (Date Checks)
    if (status === 'active') {
        const now = new Date();
        const start = new Date(campaign.start_date);
        const end = new Date(campaign.end_date);

        if (!campaign.start_date || !campaign.end_date) {
             return NextResponse.json({ error: 'Cannot activate campaign with missing dates.' }, { status: 400 });
        }

        if (end <= start) {
            return NextResponse.json({ error: 'End date must be after start date.' }, { status: 400 });
        }

        if (end < now) {
            return NextResponse.json({ error: 'Cannot activate expired campaign.' }, { status: 400 });
        }
    }

    // 5. Update Status
    const { error: updateError } = await getSupabaseAdmin()
        .from('campaigns')
        .update({ status: status })
        .eq('id', campaign_id);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, status });

  } catch (error: any) {
    console.error('[API] Campaign Status Update Error:', error);
    const status = error.message.includes('Unauthorized') ? 401 : error.message.includes('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
