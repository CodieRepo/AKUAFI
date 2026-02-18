-- Create qr_jobs table
create table if not exists public.qr_jobs (
    id uuid primary key default gen_random_uuid(),
    campaign_id uuid not null references public.campaigns(id) on delete cascade,
    total integer not null,
    processed integer default 0,
    status text default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
    last_processed_id uuid, -- For keyset pagination on bottles table
    zip_url text,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Index for faster job fetching
create index if not exists idx_qr_jobs_status on public.qr_jobs(status);

-- RLS Policies
alter table public.qr_jobs enable row level security;

-- Admin can view jobs
create policy "Admins can view qr_jobs"
    on public.qr_jobs
    for select
    using (
        exists (
            select 1 from public.admins
            where admins.id = auth.uid()
        )
    );

-- Only Service Role can insert/update (Backend Worker)
-- Note: In Supabase, service role bypasses RLS, but we can be explicit if needed.
-- We won't add specific policies for service role as it bypasses RLS by default.

-- Trigger for updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger handle_qr_jobs_updated_at
    before update on public.qr_jobs
    for each row
    execute procedure public.handle_updated_at();

-- Storage Buckets
-- Note: Buckets are usually created via dashboard or client, but we can try to insert if storage schema is available.
-- If running this in SQL Editor, this works. If strictly migration, might need specific storage extension check.
-- Assuming standard Supabase Storage setup:

insert into storage.buckets (id, name, public)
values ('qr-images', 'qr-images', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('qr-zips', 'qr-zips', false)
on conflict (id) do nothing;

-- Storage Policies
-- Processing Worker (Service Role) needs full access -> Bypasses RLS.
-- Admins need read access to DB logic but maybe not direct bucket list? 
-- Actually, Admins need to download the ZIP.

create policy "Admins can download ZIPs"
on storage.objects for select
using (
    bucket_id = 'qr-zips'
    and (
        exists (
            select 1 from public.admins
            where admins.id = auth.uid()
        )
    )
);
