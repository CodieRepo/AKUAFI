-- Update status check constraint to include 'zipping'
alter table public.qr_jobs drop constraint if exists qr_jobs_status_check;

alter table public.qr_jobs 
    add constraint qr_jobs_status_check 
    check (status in ('pending', 'processing', 'zipping', 'completed', 'failed'));
