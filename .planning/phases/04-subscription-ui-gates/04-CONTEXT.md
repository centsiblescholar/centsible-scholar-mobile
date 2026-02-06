# Phase 4: Subscription UI + Gates - Context

**Gathered:** 2026-02-06
**Status:** Ready for planning

<domain>
## Phase Boundary

The app enforces a subscription-required boundary and presents a polished paywall, all testable in Expo Go. **Critical: There is NO free tier** — users must have an active subscription to access the app. Phase 4 implements the subscription gates and UI with mocked IAP (no real payments). Real in-app purchase flow happens in Phase 5.

This phase delivers:
- Subscription requirement enforcement (gate on app launch)
- Paywall screen with plan comparison (Standard/Premium/Family tiers)
- Mock purchase flow for testing subscription activation
- Subscription management UI (Restore Purchases, Manage Subscription)
- Student limit enforcement across subscription tiers

</domain>

<decisions>
## Implementation Decisions

### Paywall Presentation

**Location:**
- Both modal and stack screen contexts
- Modal when hitting a gate (blocking, triggered by subscription check)
- Stack screen accessible from Settings (browsing plans)

**Plan Display:**
- Vertical cards (three cards stacked)
- Premium card has "Most Popular" badge (badge only, same size cards)
- Each card shows: plan name, price, student limit, feature count
- Monthly/annual billing toggle at top with annual savings badge

**Trial and Legal:**
- 7-day free trial disclosure: below plan selection, above CTA (App Store style fine print)
- Terms of Service and Privacy Policy: footer text below subscribe button with links
- Trial activates after mock purchase flow completion

**Dismissal:**
- X button in top-right corner when shown as modal/gate
- User can close and will be re-gated on next launch

### Feature Gate Enforcement

**No Free Tier:**
- Subscription is REQUIRED for all app access
- No freemium features — full hard gate

**Gate Trigger:**
- On app launch if no active subscription
- Check happens in `app/index.tsx` root redirect logic
- Single gatekeeper location before any navigation

**Subscription Inheritance:**
- Students inherit access from their parent's subscription
- When parent is subscribed, all their students can access the app
- Student login checks parent's subscription status via `parent_student_relationships`

**Error Handling:**
- If subscription check fails (network error), show error screen with retry
- Do not fail open or closed — be honest about inability to verify
- No grace period — immediate gate if subscription is inactive

**Mock Purchase in Phase 4:**
- Navigate to mock purchase flow when user taps a plan
- Mock flow: loading spinner (1-2 sec), then success screen
- Auto-grant subscription status after mock purchase completion
- Subscription status updates to active immediately for testing

### Subscription Management UI

**Location:**
- Both in Settings (subscription card section) and on paywall screen
- Paywall: "Already subscribed? Restore Purchases" link
- Settings: full subscription card with plan details + action buttons

**Restore Purchases:**
- Loading spinner, then success/failure alert (simulate realistic flow)
- Mock delay of 1-2 seconds to test loading states
- Alert shows "Subscription restored" or "No purchases found"

**Manage Subscription:**
- Opens mock subscription management screen
- Mock screen shows: plan tier, renewal date, upgrade/downgrade buttons, cancel option
- Allow plan changes with confirmation modal (e.g., "Downgrade to Standard? You'll lose [features]")

**Settings Display:**
- Card with full plan details: plan name, renewal date, status badge, feature list
- Action buttons: Manage Subscription, Restore Purchases
- Status indicator: "Active" badge (green) or "Inactive" badge (red)

### Student Limits and Tier Boundaries

**Tier Limits:**
- Single (Standard): 1 student
- Mid-Size (Premium): up to 3 students
- Large (Family): up to 5 students

**Limit Enforcement:**
- Only show limit when reached (no proactive display in UI)
- When parent tries to exceed limit: block with modal "Upgrade to add more students"
- Modal includes CTA to upgrade flow

**Trial Mechanics:**
- Trial starts after completing mock purchase flow
- 7 days from activation
- No payment method required in Phase 4
- Trial counts as active subscription

### Claude's Discretion

- Subscription history/transaction list — decide if needed for Phase 4 testing or defer to Phase 5
- Exact loading state animations and timing
- Error message copy and tone
- Paywall color scheme and visual polish (match app theme)
- Mock data structure for testing different subscription states

</decisions>

<specifics>
## Specific Ideas

- "Mock purchase flow should feel realistic — loading spinner, success animation — to properly test the UX"
- "Settings subscription card should be comprehensive — not just a status label, but full plan details and actions"
- "Student limit enforcement should be firm — block at the gate, don't allow creation of disabled students"
- "Trial disclosure should match App Store patterns — fine print below CTA, not buried"

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope. Real IAP integration (Apple/Google billing, RevenueCat, webhooks) is explicitly Phase 5.

</deferred>

---

*Phase: 04-subscription-ui-gates*
*Context gathered: 2026-02-06*
