-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: 20260220_inventory_and_contact_status.sql
-- Adds: inventory_batches, inventory_logs, status column to contact_queries
-- DOES NOT touch: campaigns, coupons, bottles, redemptions, or any existing table
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. INVENTORY BATCHES
CREATE TABLE IF NOT EXISTS inventory_batches (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id         uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  batch_name        text NOT NULL,
  total_bottles     integer NOT NULL DEFAULT 0,
  remaining_bottles integer NOT NULL DEFAULT 0,
  dispatched_at     timestamptz NOT NULL DEFAULT now(),
  status            text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- 2. INVENTORY LOGS
CREATE TABLE IF NOT EXISTS inventory_logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id    uuid NOT NULL REFERENCES inventory_batches(id) ON DELETE CASCADE,
  action_type text NOT NULL CHECK (action_type IN ('dispatched', 'used', 'returned', 'damaged')),
  quantity    integer NOT NULL DEFAULT 0,
  note        text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- 3. STATUS COLUMN on contact_queries (safe: column may already exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contact_queries' AND column_name = 'status'
  ) THEN
    ALTER TABLE contact_queries ADD COLUMN status text NOT NULL DEFAULT 'new'
      CHECK (status IN ('new', 'read', 'replied'));
  END IF;
END $$;

-- 4. Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_inventory_batches_client ON inventory_batches(client_id);
CREATE INDEX IF NOT EXISTS idx_inventory_batches_status ON inventory_batches(status);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_batch    ON inventory_logs(batch_id);
CREATE INDEX IF NOT EXISTS idx_contact_queries_status  ON contact_queries(status);

-- 5. RLS — admin-only via service role (same pattern as other tables)
ALTER TABLE inventory_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_logs    ENABLE ROW LEVEL SECURITY;

-- Allow all access via service_role (admin uses service_role key)
CREATE POLICY "service_role inventory_batches" ON inventory_batches
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role inventory_logs" ON inventory_logs
  FOR ALL TO service_role USING (true) WITH CHECK (true);
