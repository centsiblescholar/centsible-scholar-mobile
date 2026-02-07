# Phase 5: IAP Wiring - Context

**Gathered:** 2026-02-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Wire real in-app purchase flow via RevenueCat with EAS development builds. This replaces the Phase 4 mock purchase system with actual Apple StoreKit and Google Play Billing integration. The paywall UI, subscription gates, and settings management already exist from Phase 4 — this phase is pure infrastructure and integration work.

This phase delivers:
- RevenueCat SDK integration for iOS and Android
- Real purchase flow through Apple/Google billing
- Webhook handler (Supabase Edge Function) to sync RevenueCat events to database
- EAS development build configuration (development, preview, production profiles)
- Subscription status sync between RevenueCat and Supabase
- Testing with Apple/Google sandbox accounts

</domain>

<decisions>
## Implementation Decisions

### RevenueCat SDK Integration

**Mock System Replacement:**
- Claude's discretion: whether to fully replace mock hook or keep as __DEV__ fallback
- Recommended: Replace useMockPurchase implementation but keep interface for minimal UI changes

**Entitlement Checking:**
- Supabase as source of truth for subscription status
- RevenueCat is write-only from app's perspective (purchases flow through RevenueCat, webhook syncs to Supabase)
- App subscription gate continues to check Supabase `user_subscriptions` table (no direct RevenueCat entitlement checks)

**Purchase Flow:**
- Wait for webhook to update Supabase before unlocking features
- After RevenueCat purchase succeeds, poll Supabase until webhook updates the subscription record
- Slower but guaranteed sync between RevenueCat and Supabase
- No optimistic unlocking

### Webhook Handling and Subscription Sync

**Consistency with Web App:**
- Match web app Stripe webhook event handling
- Handle same subscription lifecycle events (initial purchase, renewal, cancellation, etc.)
- Use same duplicate event handling strategy as Stripe webhook
- Use same error handling/retry approach as Stripe webhook
- Map RevenueCat data to same Supabase `user_subscriptions` fields as Stripe does

**Key Principle:** RevenueCat webhook should mirror Stripe webhook behavior for consistency across platforms. Research the web app's Stripe webhook implementation and port the patterns.

### Product Configuration and Trial Mechanics

**Product ID Storage:**
- Hardcoded in `subscriptionPlans.ts`
- Add `productId` fields to existing `SUBSCRIPTION_PLANS` constant
- Single source of truth for plan data

**Trial Management:**
- Match web app trial approach with Stripe
- Use same trial duration, eligibility rules, and billing timing
- Ensure RevenueCat trial configuration mirrors Stripe trial behavior

**Web Subscriber Handling:**
- Show "Already subscribed via web" message if user has active Stripe subscription
- Prevent mobile IAP purchase for users with existing web subscriptions
- Detect by checking `platform` field in `user_subscriptions` table

### Build Configuration and Testing Strategy

**EAS Build Profiles:**
- Three profiles: Development, Preview, Production
- Development: local testing, debug mode
- Preview: TestFlight/internal distribution
- Production: App Store release builds

**React Native Architecture:**
- Enable New Architecture in EAS builds
- Future-proof with React Native's new architecture
- Accept risk of potential compatibility issues (handle during build testing)

**Testing Strategy:**
- Use Apple/Google sandbox accounts for purchase testing
- Standard platform sandbox approach (not RevenueCat-specific mock)
- Developers configure sandbox test accounts in App Store Connect / Google Play Console

**Pending Purchase State:**
- Show persistent banner during purchase processing
- Banner: "Purchase pending..." or similar
- Remains visible until webhook confirms subscription update
- Polling timeout: 60 seconds, then show "Still processing, check back later" message

### Claude's Discretion

- Exact polling interval and timeout duration for webhook wait
- Error message copy and tone
- RevenueCat SDK initialization location (App.tsx vs _layout.tsx vs separate provider)
- Webhook endpoint URL structure and authentication method
- Whether to store full RevenueCat webhook payload or just extracted fields
- Loading spinner vs progress indicator during purchase
- Banner design and placement for pending purchases

</decisions>

<specifics>
## Specific Ideas

- "The web app uses Stripe — mobile should mirror those subscription mechanics as much as possible"
- "Supabase is the source of truth — RevenueCat feeds into it via webhook, app reads from Supabase"
- "Wait for webhook to confirm before unlocking — don't risk desync between RevenueCat and database"
- "Prevent users from having both Stripe (web) and IAP (mobile) subscriptions simultaneously"

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope. UI/UX improvements to paywall or settings are Phase 6 (polish). App Store submission is Phase 7.

</deferred>

---

*Phase: 05-iap-wiring*
*Context gathered: 2026-02-06*
