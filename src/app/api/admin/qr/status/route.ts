import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { verifyAdmin } from '@/lib/adminAuth';

export async function GET(request: Request) {
    try {
        await verifyAdmin();

        const { searchParams } = new URL(request.url);
        const jobId = searchParams.get('job_id');

        if (!jobId) {
            return NextResponse.json({ error: 'Missing job_id' }, { status: 400 });
        }

        const supabase = getSupabaseAdmin();
        const { data: job, error } = await supabase
            .from('qr_jobs')
            .select('*')
            .eq('id', jobId)
            .single();

        if (error || !job) {
            return NextResponse.json({ error: 'Job not found' }, { status: 404 });
        }

        // Calculate progress percentage
        let progress = 0;
        if (job.total > 0) {
            progress = Math.round((job.processed / job.total) * 100);
        }
        if (job.status === 'completed') progress = 100;

        // Refresh Signed URL if expired?
        // The worker sets it once. If status is completed, we can regenerate a fresh one here to be safe.
        // This ensures the link works even if the user comes back a week later (and we update the DB or just return it).
        let downloadUrl = job.zip_url;

        if (job.status === 'completed') {
             const zipPath = `${job.campaign_id}/${job.id}.zip`;
             const { data: signedData } = await supabase
                .storage
                .from('qr-zips')
                .createSignedUrl(zipPath, 600); // 10 minutes validity (Secured)
             
             if (signedData) {
                 downloadUrl = signedData.signedUrl;
             }
        }

        return NextResponse.json({
            job_id: job.id,
            status: job.status,
            processed: job.processed,
            total: job.total,
            progress_percent: progress,
            zip_url: downloadUrl
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
