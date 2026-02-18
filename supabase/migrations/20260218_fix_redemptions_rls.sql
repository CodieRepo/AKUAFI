-- Enable RLS on redemptions table
ALTER TABLE redemptions ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists to avoid conflicts
DROP POLICY IF EXISTS "Client can read own redemptions" ON redemptions;

-- Create policy to allow clients to view redemptions for their campaigns
CREATE POLICY "Client can read own redemptions"
ON redemptions
FOR SELECT
USING (
  campaign_id IN (
    SELECT id FROM campaigns
    WHERE client_id IN (
      SELECT id FROM clients
      WHERE user_id = auth.uid()
    )
  )
);
