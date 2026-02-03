import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { verifyAdmin } from '@/lib/adminAuth';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await verifyAdmin(request);
    const { id } = await params;

    // Parallel queries
    const [
        { count: totalBottles, error: totalError },
        { count: usedBottles, error: usedError }
    ] = await Promise.all([
        getSupabaseAdmin().from('bottles').select('*', { count: 'exact', head: true }).eq('campaign_id', id),
        getSupabaseAdmin().from('bottles').select('*', { count: 'exact', head: true }).eq('campaign_id', id).eq('status', 'used')
    ]);

    if (totalError) throw totalError;
    if (usedError) throw usedError;

    const total = totalBottles || 0;
    const redeemed = usedBottles || 0;
    const percentage = total > 0 ? ((redeemed / total) * 100).toFixed(1) : 0;

    return NextResponse.json({
        total_bottles: total,
        redeemed_bottles: redeemed,
        redemption_percentage: percentage
    });

  } catch (error: any) {
    const status = error.message.includes('Unauthorized') ? 401 : error.message.includes('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
