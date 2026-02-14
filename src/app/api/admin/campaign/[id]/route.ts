import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    const { id } = params;

    // 1. Verify Authentication
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
            },
        }
    );

    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (authError || !session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Perform Deletion using Admin Client (Service Role) to bypass RLS restrictions if necessary
    // and ensure complete cleanup.
    const supabaseAdmin = getSupabaseAdmin();

    try {
        // Manual Cascading Delete
        // Order: Redemptions -> Coupons -> Bottles -> Campaign (Child -> Parent)
        
        // 1. Delete Redemptions
        const { error: redemptionError } = await supabaseAdmin
            .from('redemptions')
            .delete()
            .eq('campaign_id', id);

        if (redemptionError) {
             console.error('Error deleting redemptions:', redemptionError);
             throw new Error('Failed to delete associated redemptions');
        }

        // 2. Delete Coupons
        const { error: couponError } = await supabaseAdmin
            .from('coupons')
            .delete()
            .eq('campaign_id', id);
        
        if (couponError) {
            console.error('Error deleting coupons:', couponError);
            throw new Error('Failed to delete associated coupons');
        }

        // 3. Delete Bottles (QRs)
        const { error: bottleError } = await supabaseAdmin
            .from('bottles')
            .delete()
            .eq('campaign_id', id);
        
        if (bottleError) {
            console.error('Error deleting bottles:', bottleError);
            throw new Error('Failed to delete associated bottles');
        }

        // 4. Delete Campaign
        const { error: campaignError } = await supabaseAdmin
            .from('campaigns')
            .delete()
            .eq('id', id);
        
        if (campaignError) {
            console.error('Error deleting campaign:', campaignError);
            throw new Error('Failed to delete campaign');
        }

        return NextResponse.json({ message: 'Campaign deleted successfully' });

    } catch (error: any) {
        console.error('Delete API Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
