-- Migration: 20260221_inventory_summary_backend_fix.sql
-- Purpose: Make inventory summary DB-authoritative and refresh-safe.
-- Notes:
-- 1) If bottles.batch_id exists, summary is derived from bottles/redemptions.
-- 2) If bottles.batch_id does not exist, summary is derived from inventory_logs.
-- 3) Frontend-provided counters are treated as non-authoritative.

-- Returns normalized stock summary for a batch.
CREATE OR REPLACE FUNCTION public.get_inventory_batch_summary(p_batch_id uuid)
RETURNS TABLE (
  total_stock integer,
  claimed_stock integer,
  available_stock integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_has_bottle_batch boolean;
  v_seed_total integer := 0;
  v_dispatched integer := 0;
  v_used integer := 0;
  v_damaged integer := 0;
  v_returned integer := 0;
  v_total integer := 0;
  v_claimed integer := 0;
BEGIN
  SELECT COALESCE(total_bottles, 0)
    INTO v_seed_total
    FROM public.inventory_batches
   WHERE id = p_batch_id;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'bottles'
      AND column_name = 'batch_id'
  ) INTO v_has_bottle_batch;

  IF v_has_bottle_batch THEN
    EXECUTE
      'SELECT COUNT(*)::integer FROM public.bottles WHERE batch_id = $1'
      INTO v_total
      USING p_batch_id;
    v_total := GREATEST(v_total, v_seed_total);

    EXECUTE
      'SELECT COUNT(*)::integer
         FROM public.redemptions r
         JOIN public.bottles b ON b.id = r.bottle_id
        WHERE b.batch_id = $1'
      INTO v_claimed
      USING p_batch_id;
  ELSE
    SELECT COALESCE(SUM(quantity), 0)::integer
      INTO v_dispatched
      FROM public.inventory_logs
     WHERE batch_id = p_batch_id
       AND action_type = 'dispatched';

    SELECT COALESCE(SUM(quantity), 0)::integer
      INTO v_used
      FROM public.inventory_logs
     WHERE batch_id = p_batch_id
       AND action_type = 'used';

    SELECT COALESCE(SUM(quantity), 0)::integer
      INTO v_damaged
      FROM public.inventory_logs
     WHERE batch_id = p_batch_id
       AND action_type = 'damaged';

    SELECT COALESCE(SUM(quantity), 0)::integer
      INTO v_returned
      FROM public.inventory_logs
     WHERE batch_id = p_batch_id
       AND action_type = 'returned';

    v_total := GREATEST(COALESCE(NULLIF(v_dispatched, 0), v_seed_total), 0);
    v_claimed := GREATEST(v_used + v_damaged - v_returned, 0);
  END IF;

  total_stock := v_total;
  claimed_stock := LEAST(v_claimed, v_total);
  available_stock := GREATEST(v_total - claimed_stock, 0);
  RETURN NEXT;
END;
$$;

-- Applies normalized summary values into inventory_batches.
CREATE OR REPLACE FUNCTION public.sync_inventory_batch_summary(p_batch_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total integer := 0;
  v_claimed integer := 0;
  v_available integer := 0;
  v_prev_status text;
BEGIN
  IF p_batch_id IS NULL THEN
    RETURN;
  END IF;

  SELECT status
    INTO v_prev_status
    FROM public.inventory_batches
   WHERE id = p_batch_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  SELECT s.total_stock, s.claimed_stock, s.available_stock
    INTO v_total, v_claimed, v_available
    FROM public.get_inventory_batch_summary(p_batch_id) s;

  UPDATE public.inventory_batches
     SET total_bottles = v_total,
         remaining_bottles = v_available,
         status = CASE
                    WHEN v_available <= 0 THEN 'completed'
                    WHEN v_prev_status = 'completed' THEN 'completed'
                    ELSE 'active'
                  END
   WHERE id = p_batch_id;
END;
$$;

-- Guard rail: validate log writes against DB-authoritative availability.
CREATE OR REPLACE FUNCTION public.trg_inventory_logs_validate()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_available integer := 0;
BEGIN
  IF NEW.quantity IS NULL OR NEW.quantity <= 0 THEN
    RAISE EXCEPTION 'Inventory quantity must be greater than 0';
  END IF;

  IF NEW.action_type IN ('used', 'damaged') THEN
    PERFORM 1
      FROM public.inventory_batches
     WHERE id = NEW.batch_id
     FOR UPDATE;

    SELECT s.available_stock
      INTO v_available
      FROM public.get_inventory_batch_summary(NEW.batch_id) s;

    IF NEW.quantity > COALESCE(v_available, 0) THEN
      RAISE EXCEPTION
        'Only % bottles available for batch %',
        COALESCE(v_available, 0),
        NEW.batch_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_inventory_logs_validate ON public.inventory_logs;
CREATE TRIGGER trg_inventory_logs_validate
BEFORE INSERT ON public.inventory_logs
FOR EACH ROW
EXECUTE FUNCTION public.trg_inventory_logs_validate();

-- Transaction-safe RPC for batch creation.
CREATE OR REPLACE FUNCTION public.create_inventory_batch_atomic(
  p_client_id uuid,
  p_batch_name text,
  p_total_bottles integer,
  p_note text DEFAULT 'Initial dispatch'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_batch_id uuid;
BEGIN
  IF p_total_bottles IS NULL OR p_total_bottles <= 0 THEN
    RAISE EXCEPTION 'Total bottles must be greater than 0';
  END IF;

  INSERT INTO public.inventory_batches (
    client_id,
    batch_name,
    total_bottles,
    remaining_bottles,
    status
  )
  VALUES (
    p_client_id,
    trim(p_batch_name),
    p_total_bottles,
    p_total_bottles,
    'active'
  )
  RETURNING id INTO v_batch_id;

  INSERT INTO public.inventory_logs (batch_id, action_type, quantity, note)
  VALUES (v_batch_id, 'dispatched', p_total_bottles, p_note);

  RETURN v_batch_id;
END;
$$;

-- Transaction-safe RPC for log writes.
CREATE OR REPLACE FUNCTION public.add_inventory_log_atomic(
  p_batch_id uuid,
  p_action_type text,
  p_quantity integer,
  p_note text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.inventory_logs (batch_id, action_type, quantity, note)
  VALUES (p_batch_id, p_action_type, p_quantity, NULLIF(trim(p_note), ''));
END;
$$;

-- Keeps batch counters in sync whenever logs change.
CREATE OR REPLACE FUNCTION public.trg_inventory_logs_sync_summary()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_batch_id uuid;
BEGIN
  v_batch_id := COALESCE(NEW.batch_id, OLD.batch_id);
  PERFORM public.sync_inventory_batch_summary(v_batch_id);
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_inventory_logs_sync_summary ON public.inventory_logs;
CREATE TRIGGER trg_inventory_logs_sync_summary
AFTER INSERT OR UPDATE OR DELETE ON public.inventory_logs
FOR EACH ROW
EXECUTE FUNCTION public.trg_inventory_logs_sync_summary();

-- Prevent stale frontend writes from overriding authoritative counters.
CREATE OR REPLACE FUNCTION public.trg_inventory_batches_enforce_summary()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total integer := 0;
  v_claimed integer := 0;
  v_available integer := 0;
BEGIN
  SELECT s.total_stock, s.claimed_stock, s.available_stock
    INTO v_total, v_claimed, v_available
    FROM public.get_inventory_batch_summary(NEW.id) s;

  NEW.total_bottles := v_total;
  NEW.remaining_bottles := v_available;

  IF NEW.remaining_bottles <= 0 THEN
    NEW.status := 'completed';
  ELSIF COALESCE(NEW.status, 'active') <> 'completed' THEN
    NEW.status := 'active';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_inventory_batches_enforce_summary ON public.inventory_batches;
CREATE TRIGGER trg_inventory_batches_enforce_summary
BEFORE UPDATE ON public.inventory_batches
FOR EACH ROW
EXECUTE FUNCTION public.trg_inventory_batches_enforce_summary();

-- Optional stable read model with requested naming.
CREATE OR REPLACE VIEW public.inventory_batch_summary AS
SELECT
  b.id AS batch_id,
  b.client_id,
  b.batch_name,
  s.total_stock,
  s.claimed_stock,
  s.available_stock,
  b.status,
  b.dispatched_at,
  b.created_at
FROM public.inventory_batches b
CROSS JOIN LATERAL public.get_inventory_batch_summary(b.id) s;

-- Backfill existing rows once.
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN SELECT id FROM public.inventory_batches LOOP
    PERFORM public.sync_inventory_batch_summary(r.id);
  END LOOP;
END;
$$;
