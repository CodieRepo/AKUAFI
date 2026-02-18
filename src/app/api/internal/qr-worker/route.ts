import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import QRCode from 'qrcode';
import JSZip from 'jszip';

export const runtime = 'nodejs';

// Helper to validate Cron Secret
function isValidCron(request: Request) {
    const authHeader = request.headers.get('x-cron-secret');
    return authHeader === process.env.CRON_SECRET;
}

export async function GET(request: Request) {
    // 1. Security Check
    if (!isValidCron(request)) {
        console.warn("[QR-WORKER] Unauthorized access attempt.");
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    try {
        // 2. Fetch & Lock ONE Job
        // Priority:
        // 1. 'zipping' jobs (finish them cleanly)
        // 2. 'processing' jobs stuck > 10m (recovery)
        // 3. 'pending' jobs
        
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
        
        // Explicitly define candidateJob type
        let candidateJob: {
            id: string;
            status: string;
            campaign_id?: string;
            processed?: number;
            total?: number;
            last_processed_id?: string | null;
        } | null = null;
        
        // A. Check for 'zipping' (highest priority to clear queue)
        const { data: zippingJob } = await supabaseAdmin
            .from('qr_jobs')
            .select('id, status, campaign_id, processed, total, last_processed_id')
            .eq('status', 'zipping')
            .limit(1)
            .maybeSingle();

        if (zippingJob) {
            candidateJob = zippingJob;
        }

        // B. Check for stale 'processing'
        if (!candidateJob) {
            const { data: stuckJob } = await supabaseAdmin
                .from('qr_jobs')
                .select('id, status')
                .eq('status', 'processing')
                .lt('updated_at', tenMinutesAgo)
                .limit(1)
                .maybeSingle();
            candidateJob = stuckJob ?? null;
        }

        // C. Check for 'pending'
        if (!candidateJob) {
            const { data: pendingJob } = await supabaseAdmin
                .from('qr_jobs')
                .select('id, status')
                .eq('status', 'pending')
                .order('created_at', { ascending: true })
                .limit(1)
                .maybeSingle();
            candidateJob = pendingJob ?? null;
        }

        if (!candidateJob) {
            return NextResponse.json({ message: 'No jobs pending.' });
        }

        // ATOMIC CLAIM
        // If it was already 'zipping', we keep it 'zipping'. 
        // If it was pending/processing, we set 'processing'.
        // We need to know which flow to enter.
        
        const nextStatus = candidateJob.status === 'zipping' ? 'zipping' : 'processing';

        const { data: job, error: claimError } = await supabaseAdmin
            .from('qr_jobs')
            .update({ 
                status: nextStatus, // Refresh timestamp
                updated_at: new Date().toISOString()
            })
            .eq('id', candidateJob.id)
            // Safety check to ensure we don't grab a completed job or one locked by another worker just now
            .or(`status.eq.zipping,status.eq.pending,and(status.eq.processing,updated_at.lt.${tenMinutesAgo})`)
            .select()
            .single();

        if (claimError || !job) {
            if (claimError) console.error("[QR-WORKER] Claim Error:", claimError);
            return NextResponse.json({ message: 'Job picked by another worker.' });
        }

        console.log(`[QR-WORKER] Job picked: ${job.id} [${job.status}]. Processed: ${job.processed}/${job.total}`);

        // --- FLOW 1: ZIPPING PHASE ---
        if (job.status === 'zipping') {
            return await handleZippingPhase(job, supabaseAdmin);
        }

        // --- FLOW 2: PROCESSING PHASE ---
        return await handleProcessingPhase(job, supabaseAdmin);

    } catch (error: any) {
        console.error("[QR-WORKER] Fatal Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

async function handleProcessingPhase(job: any, supabaseAdmin: any) {
    // 3. Fetch Batch
    const BATCH_SIZE = 200;
    let query = supabaseAdmin
        .from('bottles')
        .select('id, qr_token, campaign_id, created_at')
        .eq('campaign_id', job.campaign_id)
        .order('id', { ascending: true })
        .limit(BATCH_SIZE);

    if (job.last_processed_id) {
        query = query.gt('id', job.last_processed_id);
    }

    const { data: bottles, error } = await query;
    if (error) throw new Error(`Bottles fetch error: ${error.message}`);

    let newProcessed = job.processed;
    let lastId = job.last_processed_id;
    let batchCount = 0;

    if (bottles && bottles.length > 0) {
        console.log(`[QR-WORKER] Processing batch of ${bottles.length}...`);
        
        for (const bottle of bottles) {
            try {
                const url = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://akuafi.com'}/scan/${bottle.qr_token}`;
                const buffer = await QRCode.toBuffer(url, {
                    errorCorrectionLevel: 'H',
                    width: 512,
                    margin: 2,
                    type: 'png'
                });

                const filePath = `${job.campaign_id}/${job.id}/${bottle.qr_token}.png`;
                await supabaseAdmin.storage.from('qr-images').upload(filePath, buffer, {
                    contentType: 'image/png',
                    upsert: true
                });

                lastId = bottle.id;
                batchCount++;
            } catch (err) {
                console.error(`[QR-WORKER] Gen failed for ${bottle.id}`, err);
            }
        }
        
        newProcessed += batchCount;
    }

    // CHECK COMPLETION
    if (newProcessed >= job.total) {
        console.log(`[QR-WORKER] Job ${job.id} finished processing. Switching to ZIPPING.`);
        
        await supabaseAdmin
            .from('qr_jobs')
            .update({
                processed: newProcessed,
                last_processed_id: lastId,
                status: 'zipping', // Switch phase
                updated_at: new Date().toISOString()
            })
            .eq('id', job.id);
            
        return NextResponse.json({
            success: true,
            message: `Job ${job.id} batch done. Switched to ZIPPING.`,
            job_id: job.id
        });
    }

    // Still processing
    await supabaseAdmin
        .from('qr_jobs')
        .update({
            processed: newProcessed,
            last_processed_id: lastId,
            updated_at: new Date().toISOString()
        })
        .eq('id', job.id);

    return NextResponse.json({
        success: true,
        message: `Processed ${batchCount}. Progress: ${newProcessed}/${job.total}`,
        job_id: job.id
    });
}

async function handleZippingPhase(job: any, supabaseAdmin: any) {
    console.log(`[QR-WORKER] Starting ZIP generation for Job ${job.id}...`);

    const zip = new JSZip();
    const folder = zip.folder("qr_codes");
    let csvContent = "qr_token,url,campaign_id,created_at\n";
    
    // Keyset Pagination for all bottles
    let lastConfigId = null; // We can use the bottle ID for pagination
    const CHUNK = 500;
    let keepFetching = true;

    while (keepFetching) {
        let query = supabaseAdmin
            .from('bottles')
            .select('id, qr_token, campaign_id, created_at')
            .eq('campaign_id', job.campaign_id)
            .order('id', { ascending: true })
            .limit(CHUNK);
            
        if (lastConfigId) {
            query = query.gt('id', lastConfigId);
        }

        const { data: allBottles, error } = await query;

        if (error || !allBottles || allBottles.length === 0) {
            keepFetching = false;
            break;
        }

        for (const b of allBottles) {
            const url = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://akuafi.com'}/scan/${b.qr_token}`;
            csvContent += `${b.qr_token},${url},${b.campaign_id},${b.created_at}\n`;

            const filePath = `${job.campaign_id}/${job.id}/${b.qr_token}.png`;
            const { data: fileBlob } = await supabaseAdmin.storage
                .from('qr-images')
                .download(filePath);

            if (fileBlob) {
                const arr = await fileBlob.arrayBuffer();
                const fileName = `QR_${b.qr_token.slice(0, 8)}.png`; 
                folder?.file(fileName, new Uint8Array(arr));
            }
            lastConfigId = b.id;
        }
    }

    zip.file("campaign_codes.csv", csvContent);
    
    const zipBuffer = await zip.generateAsync({ 
        type: 'nodebuffer',
        compression: "DEFLATE",
        compressionOptions: { level: 6 } 
    });

    const zipPath = `${job.campaign_id}/${job.id}.zip`;
    const { error: zipUploadError } = await supabaseAdmin
        .storage
        .from('qr-zips')
        .upload(zipPath, zipBuffer, {
            contentType: 'application/zip',
            upsert: true
        });

    if (zipUploadError) throw new Error(`ZIP Upload failed: ${zipUploadError.message}`);

    // Signed URL (10 minutes)
    const { data: signedData } = await supabaseAdmin
        .storage
        .from('qr-zips')
        .createSignedUrl(zipPath, 600);

    await supabaseAdmin
        .from('qr_jobs')
        .update({
            status: 'completed',
            zip_url: signedData?.signedUrl
        })
        .eq('id', job.id);

    console.log(`[QR-WORKER] Job ${job.id} FULLY COMPLETED.`);
    
    return NextResponse.json({
        success: true,
        message: `Job ${job.id} Zipped & Completed.`,
        job_id: job.id
    });
}
