-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: 20260220_contact_query_webhook_trigger.sql
-- ─────────────────────────────────────────────────────────────────────────────
-- Fires the send-contact-notification Edge Function every time a row is
-- inserted into contact_queries.
--
-- Prerequisites:
--   1. pg_net extension must be enabled (Settings → Extensions in Supabase).
--   2. Replace the two placeholders below with your real values:
--      - <YOUR_PROJECT_REF>  → e.g. "abcdefghijklmnop"
--      - <YOUR_SERVICE_ROLE_KEY> → found in Project Settings → API
--   3. Deploy the edge function first:
--        supabase functions deploy send-contact-notification --no-verify-jwt
--   4. Set the secret via CLI:
--        supabase secrets set RESEND_API_KEY=re_HLzqwJMH_BoE461ru2TazHcMZQziaxxp6
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable pg_net if not already active
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Drop previous version if re-running
DROP TRIGGER IF EXISTS on_contact_query_insert    ON contact_queries;
DROP FUNCTION IF EXISTS notify_contact_inquiry();

-- Function: fires async HTTP POST to the edge function
CREATE OR REPLACE FUNCTION notify_contact_inquiry()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _project_ref     text := '<YOUR_PROJECT_REF>';          -- ← replace
  _service_role_key text := '<YOUR_SERVICE_ROLE_KEY>';    -- ← replace
  _url             text;
BEGIN
  _url := 'https://' || _project_ref || '.supabase.co/functions/v1/send-contact-notification';

  -- pg_net fires the request asynchronously — DB insert is NOT blocked
  PERFORM net.http_post(
    url     := _url,
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || _service_role_key
    ),
    body    := jsonb_build_object(
      'record', row_to_json(NEW)
    )
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log but never raise — insert must always succeed
  RAISE WARNING '[notify_contact_inquiry] Failed to call edge function: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- Trigger: AFTER INSERT, once per row
CREATE TRIGGER on_contact_query_insert
  AFTER INSERT ON contact_queries
  FOR EACH ROW
  EXECUTE FUNCTION notify_contact_inquiry();
