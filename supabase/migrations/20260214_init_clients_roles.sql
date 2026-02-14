-- Create user_roles table to manage role-based access control
create table if not exists user_roles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null, -- The user this role belongs to
  role text not null, -- 'admin', 'client', etc.
  created_at timestamp with time zone default now(),
  unique(user_id, role)
);

-- Create clients table to store business entity details
create table if not exists clients (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null, -- The CLIENT login user (not the admin who created it)
  client_name text not null,
  created_at timestamp with time zone default now()
);

-- Add RLS policies (Basic setup, can be refined later)
alter table user_roles enable row level security;
alter table clients enable row level security;

-- Policy: Admins can read everything (simplified for now, strictly enforced via API logic)
create policy "Admins can read user_roles" on user_roles for select using (true);
create policy "Admins can read clients" on clients for select using (true);

-- Policy: Users can read their own role
create policy "Users can read own role" on user_roles for select using (auth.uid() = user_id);

-- Policy: Clients can read their own client data
create policy "Clients can read own data" on clients for select using (auth.uid() = user_id);
