-- Enable RLS on coupons table (ensure it is on)
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow client to read own coupons" ON coupons;
DROP POLICY IF EXISTS "Allow client to update own coupons" ON coupons;
DROP POLICY IF EXISTS "Allow client to insert own coupons" ON coupons;
DROP POLICY IF EXISTS "Clients can view their own coupons" ON coupons;
DROP POLICY IF EXISTS "Clients can update their own coupons" ON coupons;
DROP POLICY IF EXISTS "Clients can insert their own coupons" ON coupons;

-- Create new policies linking client_id -> clients.id -> clients.user_id -> auth.uid()

-- SELECT Policy
CREATE POLICY "Clients can view their own coupons"
ON coupons
FOR SELECT
USING (
  client_id IN (
    SELECT id FROM clients
    WHERE user_id = auth.uid()
  )
);

-- UPDATE Policy
CREATE POLICY "Clients can update their own coupons"
ON coupons
FOR UPDATE
USING (
  client_id IN (
    SELECT id FROM clients
    WHERE user_id = auth.uid()
  )
);

-- INSERT Policy
CREATE POLICY "Clients can insert their own coupons"
ON coupons
FOR INSERT
WITH CHECK (
  client_id IN (
    SELECT id FROM clients
    WHERE user_id = auth.uid()
  )
);
