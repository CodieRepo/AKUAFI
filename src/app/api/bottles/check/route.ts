import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request: Request) {
  try {
    const { qr_token } = await request.json();

    if (!qr_token) {
      return NextResponse.json({ error: 'QR Token is required' }, { status: 400 });
    }

    const { data, error } = await getSupabaseAdmin()
      .from('bottles')
      .select('*')
      .eq('qr_token', qr_token)
      .single();

    if (error || !data) {
      console.error('Bottle lookup failed:', error?.message);
      return NextResponse.json({ error: 'Bottle not found' }, { status: 404 });
    }

    return NextResponse.json({ 
        success: true, 
        bottle: data 
    });

  } catch (error) {
    console.error('Error checking bottle:', error);
    return NextResponse.json({ error: 'System error' }, { status: 500 });
  }
}
