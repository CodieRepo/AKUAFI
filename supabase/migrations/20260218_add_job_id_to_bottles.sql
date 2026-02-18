-- Add job_id to bottles table
alter table public.bottles 
    add column if not exists job_id uuid references public.qr_jobs(id) on delete set null;

-- Index for faster querying by job_id
create index if not exists idx_bottles_job_id on public.bottles(job_id);
