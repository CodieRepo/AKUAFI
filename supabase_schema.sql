
-- FINAL SUPABASE TABLES (LOCKED)

-- 1. Campaigns
create table if not exists campaigns (
  id uuid default gen_random_uuid() primary key,
  name text,
  description text,
  coupon_type text, -- 'flat' | 'percentage'
  coupon_min_value int,
  coupon_max_value int,
  start_date timestamp with time zone,
  end_date timestamp with time zone,
  is_active boolean,
  created_at timestamp with time zone default now()
);

-- 2. Bottles
create table if not exists bottles (
  id uuid default gen_random_uuid() primary key,
  campaign_id uuid references campaigns(id),
  qr_token text unique,
  is_used boolean,
  used_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- 3. Users
create table if not exists users (
  id uuid default gen_random_uuid() primary key,
  phone text unique,
  name text,
  created_at timestamp with time zone default now()
);

-- 4. Coupons
create table if not exists coupons (
  id uuid default gen_random_uuid() primary key,
  code text unique,
  campaign_id uuid references campaigns(id),
  bottle_id uuid references bottles(id),
  user_id uuid references users(id),
  discount_value int,
  status text, -- 'issued' | 'redeemed'
  issued_at timestamp with time zone,
  redeemed_at timestamp with time zone
);

-- 5. Redemptions
create table if not exists redemptions (
  id uuid default gen_random_uuid() primary key,
  coupon_id uuid references coupons(id),
  redeemed_at timestamp with time zone default now()
);
