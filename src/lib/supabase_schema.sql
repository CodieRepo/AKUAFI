-- Create the otp_sessions table
create table otp_sessions (
  id uuid default gen_random_uuid() primary key,
  phone text not null,
  otp text not null,
  verified boolean default false,
  expires_at timestamp with time zone not null,
  created_at timestamp with time zone default now()
);

-- Add RLS policies (Internal use only usually, but good practice)
alter table otp_sessions enable row level security;

-- Only service role should have full access, but for now we rely on backend logic.
-- If you want to view data in dashboard:
create policy "Enable read access for authenticated users" on otp_sessions for select using (true);
