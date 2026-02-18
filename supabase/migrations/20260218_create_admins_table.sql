-- Migration: 20260218_create_admins_table.sql
-- Description: Creates a dedicated admins table for secure role verification and backfills the current user.

-- 1. Create Admins Table
CREATE TABLE IF NOT EXISTS admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Constraint to ensure one admin record per user
    CONSTRAINT admins_user_id_key UNIQUE (user_id)
);

-- 2. RLS Policies
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Allow admins to view themselves (needed for verification check)
CREATE POLICY "Admins can view own record" ON admins
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- 3. Backfill Current Admin User
-- User ID provided: 9bb45961-72a5-451c-9ef6-16479124e7b0
INSERT INTO admins (user_id)
VALUES ('9bb45961-72a5-451c-9ef6-16479124e7b0')
ON CONFLICT (user_id) DO NOTHING;
