-- Add IAP and booking-preference columns to coaching_orders.
--
-- Context: coaching sessions are now purchasable from the iOS app via Apple
-- In-App Purchase in addition to the existing Stripe web flow. These columns
-- let us (a) distinguish Stripe rows from Apple/Google rows, (b) deduplicate
-- RevenueCat webhook retries via a unique transaction id, and (c) persist
-- the day/time the buyer asked to be called (previously Stripe-metadata-only).
--
-- All existing rows are Stripe and will keep platform='stripe' via the column
-- default. iap_* columns stay NULL for existing rows. RLS is unchanged —
-- existing policies (service_role_full_access_coaching_orders etc.) already
-- cover the new columns since policies are row-level, not column-level.

ALTER TABLE public.coaching_orders
  ADD COLUMN IF NOT EXISTS platform text
    CHECK (platform IN ('stripe', 'apple', 'google')) DEFAULT 'stripe',
  ADD COLUMN IF NOT EXISTS iap_product_id text,
  ADD COLUMN IF NOT EXISTS iap_original_transaction_id text,
  ADD COLUMN IF NOT EXISTS best_day_to_call text,
  ADD COLUMN IF NOT EXISTS best_time_to_call text;

-- Idempotency: one coaching_orders row per Apple/Google transaction.
-- Lets the revenuecat-webhook safely handle RC's at-least-once delivery.
CREATE UNIQUE INDEX IF NOT EXISTS idx_coaching_orders_iap_txn
  ON public.coaching_orders (iap_original_transaction_id)
  WHERE iap_original_transaction_id IS NOT NULL;

-- Helper index for the webhook path that looks up the most recent pending
-- row for a given user (create_pending → revenuecat webhook → mark paid).
CREATE INDEX IF NOT EXISTS idx_coaching_orders_user_status_created
  ON public.coaching_orders (user_id, status, created_at DESC);
