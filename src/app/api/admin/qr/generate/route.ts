import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { verifyAdmin } from '@/lib/adminAuth';
import { randomUUID } from 'crypto';

export async function POST(request: Request) {
  try {
    await verifyAdmin(request);
    const body = await request.json();
    const { campaign_id, quantity } = body;

    if (!campaign_id || !quantity || quantity <= 0) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    if (quantity > 10000) {
      return NextResponse.json({ error: 'Max quantity is 10000' }, { status: 400 });
    }

    // 3. Logging (MANDATORY)
    console.log("QR GENERATION START");
    console.log("CAMPAIGN ID:", campaign_id);
    console.log("QUANTITY:", quantity);

    // Generate rows
    const rows = [];
    for (let i = 0; i < quantity; i++) {
        rows.push({
            campaign_id,
            qr_token: randomUUID(),
            is_used: false,
            created_at: new Date().toISOString()
        });
    }

    // Bulk Insert (Chunking if necessary)
    console.log(`PREPARING TO INSERT ${rows.length} ROWS...`);
    
    // We'll chunk safely at 1000
    const chunkSize = 1000;
    let insertedCount = 0;

    for (let i = 0; i < rows.length; i += chunkSize) {
        const chunk = rows.slice(i, i + chunkSize);
        const { error } = await getSupabaseAdmin()
            .from('bottles')
            .insert(chunk);
        
        if (error) {
            console.error("INSERT ERROR:", error);
            throw error;
        }
        insertedCount += chunk.length;
    }

    console.log(`SUCCESSFULLY INSERTED ${insertedCount} ROWS.`);

    return NextResponse.json({ 
        success: true, 
        count: quantity, 
        tokens: rows.map(r => r.qr_token),
        message: `Generated ${quantity} QR codes.` 
    });

  } catch (error: any) {
    const status = error.message.includes('Unauthorized') ? 401 : error.message.includes('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
