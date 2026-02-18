import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import QRCode from 'qrcode';
import { PassThrough } from 'stream';
const archiver = require('archiver');


export const runtime = 'nodejs';

// Helper to validate Cron Secret
function isValidCron(request: Request) {
    const authHeader = request.headers.get('authorization');
    return authHeader === `Bearer ${process.env.CRON_SECRET}`;
}

export async function GET(request: Request) {
    console.log("[QR-WORKER] Cron Triggered");
    
    const authHeader = request.headers.get('authorization');
    console.log(`[QR-WORKER] Auth Header received: ${authHeader ? 'Present' : 'Missing'}`);

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
        .eq('job_id', job.id)
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

    const zipPath = `${job.campaign_id}/${job.id}.zip`;

    // 1. Get Signed Upload URL (Stream Destination)
    const { data: uploadData, error: uploadTokenError } = await supabaseAdmin
        .storage
        .from('qr-zips')
        .createSignedUploadUrl(zipPath);

    if (uploadTokenError || !uploadData) {
        throw new Error(`Failed to get upload URL: ${uploadTokenError?.message}`);
    }

    const { signedUrl } = uploadData;

    // 2. Setup Archiver & Stream
    const archive = archiver('zip', {
        zlib: { level: 6 } // Compression level
    });

    const stream = new PassThrough();
    archive.pipe(stream);

    // 3. Start Upload (Consumer)
    // We start the request immediately. It will consume 'stream' as 'archive' produces data.
    // duplex: 'half' is required for Node.js fetch with streaming body.
    const uploadPromise = fetch(signedUrl, {
        method: 'PUT',
        body: stream as any, // Node fetch accepts stream
        headers: {
            'Content-Type': 'application/zip',
        },
        duplex: 'half' 
    } as any); // Cast for duplex type support if needed

    // 4. Produce Data (Producer)
    
    // A. CSV
    let csvContent = "qr_token,url,campaign_id,created_at\n";
    
    // B. Images Loop
    let lastConfigId = null; 
    const CHUNK = 500;
    let keepFetching = true;
    
    try {
        while (keepFetching) {
            let query = supabaseAdmin
                .from('bottles')
                .select('id, qr_token, campaign_id, created_at')
                .eq('job_id', job.id)
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
                
                // Download Image
                const { data: fileBlob } = await supabaseAdmin.storage
                    .from('qr-images')
                    .download(filePath);

                if (fileBlob) {
                    const arrayBuffer = await fileBlob.arrayBuffer();
                    const buffer = Buffer.from(arrayBuffer);
                    const fileName = `QR_${b.qr_token.slice(0, 8)}.png`; 
                    archive.append(buffer, { name: fileName });
                }
                lastConfigId = b.id;
            }
        }

        // Append CSV
        archive.append(csvContent, { name: 'campaign_codes.csv' });

        // Finalize Archive (Closes the write side of the stream)
        // This will trigger 'end' on 'stream', which signals fetch to finish sending.
        await archive.finalize();

        // 5. Wait for Upload Completion
        const response = await uploadPromise;
        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Upload failed with status ${response.status}: ${text}`);
        }

        // 6. Generate Download Link (for User)
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

    } catch (err: any) {
        console.error("[QR-WORKER] Zipping Error:", err);
        // Abort archive if something failed mid-way?
        // archive.abort();
        throw err;
    }
}
