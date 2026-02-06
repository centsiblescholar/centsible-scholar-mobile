# Phase 1: Architecture Foundation - Context

**Gathered:** 2026-02-05
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase delivers the foundational infrastructure to support dual billing sources (Stripe on web + Apple/Google IAP on mobile), role-based routing (parent vs student experiences), and unified subscription entitlements. No user-facing features are added - this is pure architecture that gates all downstream work in Phases 2-5.

</domain>

<decisions>
## Implementation Decisions

### Subscription Schema Design
- **One subscription per user**: Enforce single active subscription per user. If user subscribes on different platform, previous subscription becomes inactive.
- **Keep existing subscription_type values**: Continue using 'single', 'midsize', 'large'. Map IAP product IDs to these types for consistency with web app.
- **Platform source tracking**: Claude's discretion on whether to use 'source' column vs 'platform' enum (stripe/apple/google).
- **Table structure**: Claude's discretion on whether to extend user_subscriptions with iap_* columns or create separate iap_subscriptions table. Choose based on query patterns and maintainability.

### Role Detection Strategy
- **Source of truth: user_metadata.user_type**: Read from Supabase auth metadata ('parent' or 'student'). This is set during signup and is trusted.
- **Location: Extend AuthContext**: Add role detection to existing src/contexts/AuthContext.tsx (already has user state). Keep role logic with auth logic.
- **Caching: Cache in AuthContext state**: Read user_metadata.user_type once on auth state change, store in context state, reuse until signout.
- **Invalid role handling: Sign user out with error**: If user_metadata.user_type is missing or invalid, treat as data integrity issue. Sign out and show error message.

### Subscription Status Abstraction
- **Refactor existing useSubscriptionStatus hook**: Update src/hooks/useSubscriptionStatus.ts to be platform-agnostic. Internals abstract Stripe vs IAP, but return shape stays the same.
- **Keep existing API**: Return { isActive, tier, status, periodEnd } for backward compatibility. Don't break existing usage.
- **Single active record query**: Since we enforce one subscription per user, just query for the one active record by user_id. Source doesn't matter to the hook.
- **No subscription = null/undefined state**: When user has no subscription record, return isActive: null or undefined to distinguish "no subscription" from "query failed".

### Student Routing Experience
- **Routing location: app/index.tsx**: Root index.tsx checks role on mount, redirects parent to /(tabs)/dashboard, student to their appropriate screen.
- **Tab structure: Single (tabs) with conditional visibility**: Use href: null to hide parent-only tabs from students. Avoids screen duplication (research recommendation).
- **First-time student login: Show welcome/onboarding screen**: Brief welcome explaining what they can do, then go to dashboard.
- **Redirect timing: Instant, no loading state**: Role is in auth metadata (fast). Redirect immediately in app/index.tsx render without loading spinner.

### Claude's Discretion
- Subscription schema column naming (source vs platform, iap_* column names)
- Whether to extend user_subscriptions or create separate iap_subscriptions table
- Error messages for invalid role state
- Welcome/onboarding screen content and design
- Exact timing and navigation implementation details

</decisions>

<specifics>
## Specific Ideas

- Research recommended single (tabs) group with conditional tab visibility over separate route groups
- Research flagged that existing `user_subscriptions` table is Stripe-only and must be abstracted
- Research identified that app/index.tsx currently sends all users to /(tabs)/dashboard with no role check

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-architecture-foundation*
*Context gathered: 2026-02-05*
