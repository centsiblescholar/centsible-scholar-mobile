---
phase: 05-iap-wiring
plan: 02
subsystem: payments
tags: [revenuecat, webhook, supabase-edge-function, deno, iap, subscription-lifecycle]

# Dependency graph
requires:
  - phase: 01-architecture-foundation
    provides: user_subscriptions table schema with IAP columns (platform, iap_product_id, iap_original_transaction_id, revenuecat_customer_id)
provides:
  - RevenueCat webhook edge function processing subscription lifecycle events
  - Supabase config disabling JWT for webhook endpoint
  - Idempotent event processing via webhook_events table
affects: [05-03-PLAN, 05-04-PLAN]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "RevenueCat webhook handler mirroring stripe-webhook structure"
    - "Bearer token auth for external webhook endpoints"
    - "Two-step query-then-upsert for subscription records"

key-files:
  created:
    - supabase/functions/revenuecat-webhook/index.ts
    - supabase/config.toml
  modified: []

key-decisions:
  - "Mirror stripe-webhook patterns exactly for consistency (structured logging, idempotency, error handling)"
  - "Return HTTP 200 on processing errors to prevent RevenueCat retry storms"
  - "Filter cancellation/expiration/billing_issue updates by platform IN (apple, google) to protect Stripe subscriptions"
  - "PRODUCT_CHANGE reuses handleSubscriptionActive (re-maps product to subscription_type for upgrades/downgrades)"

patterns-established:
  - "RevenueCat webhook auth: Bearer token from REVENUECAT_WEBHOOK_AUTH_KEY env var"
  - "RevenueCat product ID mapping: com.centsiblescholar.{tier}.{period} to subscription_type"
  - "Store-to-platform mapping: APP_STORE -> apple, PLAY_STORE -> google"

# Metrics
duration: 2min
completed: 2026-02-06
---

# Phase 5 Plan 2: RevenueCat Webhook Summary

**Supabase Edge Function handling RevenueCat subscription lifecycle events with idempotency, mirroring stripe-webhook patterns for consistent billing infrastructure**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-07T00:53:20Z
- **Completed:** 2026-02-07T00:55:12Z
- **Tasks:** 2
- **Files created:** 2

## Accomplishments
- RevenueCat webhook edge function processing all subscription lifecycle events (INITIAL_PURCHASE, RENEWAL, CANCELLATION, EXPIRATION, BILLING_ISSUE, UNCANCELLATION, PRODUCT_CHANGE, TEST)
- Idempotent event processing via webhook_events table (exact same pattern as stripe-webhook)
- Supabase config disabling JWT verification so RevenueCat can call the endpoint with its own Bearer token
- Platform-safe updates: cancellation/expiration/billing_issue filter by platform IN (apple, google) to never touch Stripe subscriptions

## Task Commits

Each task was committed atomically:

1. **Task 1: Create RevenueCat webhook edge function** - `9bc0276` (feat)
2. **Task 2: Create Supabase config to disable JWT for webhook endpoint** - `49c0b4b` (chore)

## Files Created/Modified
- `supabase/functions/revenuecat-webhook/index.ts` - Webhook handler processing RevenueCat subscription lifecycle events (416 lines)
- `supabase/config.toml` - Edge function config disabling JWT verification for webhook endpoint

## Decisions Made
- Mirrored stripe-webhook patterns for consistency: structured logging with `[REVENUECAT-WEBHOOK]` prefix, idempotency via `webhook_events`, two-step query-then-upsert, HTTP 200 on errors
- Platform filter `IN ('apple', 'google')` on status-change operations prevents accidentally modifying Stripe subscriptions
- `PRODUCT_CHANGE` events reuse `handleSubscriptionActive()` since they effectively re-activate with a new product mapping
- `TEST` events log but take no database action
- Method check (POST only) and JSON parse validation added before auth check for defense in depth

## Deviations from Plan
None - plan executed exactly as written.

## User Setup Required

**External services require manual configuration before the webhook is functional:**

1. **Deploy edge function:** `supabase functions deploy revenuecat-webhook` from project root
2. **Set webhook secret:** `supabase secrets set REVENUECAT_WEBHOOK_AUTH_KEY=<your_key>` (generate with `openssl rand -hex 32`)
3. **Configure RevenueCat dashboard:** Add webhook endpoint URL `https://YOUR_PROJECT_REF.supabase.co/functions/v1/revenuecat-webhook`
4. **Set Authorization header** in RevenueCat webhook config to `Bearer <your_key>`

## Issues Encountered
None

## Next Phase Readiness
- Webhook handler is ready for deployment once secrets are configured
- Plan 05-03 (RevenueCat SDK integration) can proceed independently
- Plan 05-04 (EAS build config) can proceed independently
- End-to-end testing requires: deploy function, configure secrets, configure RevenueCat dashboard, then make a sandbox purchase

---
*Phase: 05-iap-wiring*
*Completed: 2026-02-06*
