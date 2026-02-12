-- Add platform source tracking and IAP fields to user_subscriptions
-- Extends existing Stripe-only table to support Apple IAP and Google Play Billing
-- Migration created for Phase 1 (Architecture Foundation) Plan 02

-- Platform source: where this subscription originated
-- 'stripe' for web subscriptions, 'apple' for App Store, 'google' for Google Play
ALTER TABLE user_subscriptions
ADD COLUMN IF NOT EXISTS platform TEXT NOT NULL DEFAULT 'stripe'
CHECK (platform IN ('stripe', 'apple', 'google'));

-- IAP-specific fields (null for Stripe subscriptions)
-- The product identifier from Apple/Google (e.g., 'com.centsiblescholar.premium.monthly')
ALTER TABLE user_subscriptions
ADD COLUMN IF NOT EXISTS iap_product_id TEXT;

-- The original transaction ID from the store (for receipt validation and deduplication)
ALTER TABLE user_subscriptions
ADD COLUMN IF NOT EXISTS iap_original_transaction_id TEXT;

-- RevenueCat customer ID (links to RevenueCat's customer record)
ALTER TABLE user_subscriptions
ADD COLUMN IF NOT EXISTS revenucat_customer_id TEXT;

-- Create index on platform for filtered queries
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_platform
ON user_subscriptions (platform);

-- Create index on iap_original_transaction_id for deduplication lookups
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_iap_txn
ON user_subscriptions (iap_original_transaction_id)
WHERE iap_original_transaction_id IS NOT NULL;

-- Comment on new columns for documentation
COMMENT ON COLUMN user_subscriptions.platform IS 'Payment platform: stripe, apple, or google';
COMMENT ON COLUMN user_subscriptions.iap_product_id IS 'App Store / Google Play product ID (null for Stripe)';
COMMENT ON COLUMN user_subscriptions.iap_original_transaction_id IS 'Original transaction ID from store (null for Stripe)';
COMMENT ON COLUMN user_subscriptions.revenucat_customer_id IS 'RevenueCat customer ID for IAP management (null for Stripe)';
