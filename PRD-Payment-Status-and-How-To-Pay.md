# PRD: Payment Status & "How to Pay Your Scholar"

**Status:** Draft | **Priority:** P0 | **Date:** March 23, 2026
**Origin:** Parent feedback relayed by Dr. Rich — parents are confused about directing payments and holding money on behalf of students.

---

## Problem Statement

Centsible Scholar calculates what a student "earns" based on grades, behavior, and education bonuses, then displays a clear allocation breakdown (Taxes 15%, Retirement 10%, Savings 25%, Discretionary 50%). But the app provides **no guidance or mechanism for parents to actually fulfill those earnings with real money**. Parents are left wondering: "Where does the money go? How do I pay this? Should I hold it somewhere?" This confusion is a reported hurdle to adoption.

**Who is affected:** All parents with active students.

**Impact of not solving:** Parents disengage because the financial education feels disconnected from reality. The app becomes a calculator rather than a family financial management tool.

---

## Goals

1. **Eliminate parent confusion** about what to do after earnings are calculated — measurable via reduction in support inquiries about payments.
2. **Give parents a clear action path** from the Earnings screen — every parent should know within 30 seconds how to fulfill their child's paycheck.
3. **Enable parents to track payment fulfillment** — parents can record whether each earnings period was paid, held, or is still pending.
4. **Maintain educational value** — the "how to pay" guidance should reinforce the financial literacy concepts (allocation buckets, savings discipline, tax awareness).
5. **Ship within 2–3 weeks** with no third-party payment integrations and no regulatory exposure.

---

## Non-Goals

1. **No real money movement through the app.** We are not integrating Venmo, Zelle, Stripe, or any payment rail. Parents fulfill payments outside the app and record it here. *(Rationale: regulatory complexity, COPPA, money transmission laws — revisit in a future phase.)*
2. **No per-bucket payment tracking (Phase 1).** Parents mark the whole paycheck as paid/held, not each allocation bucket individually. *(Rationale: keep the UX simple; per-bucket tracking is a P1 follow-up.)*
3. **No automated statements or PDF exports (Phase 1).** The payment ledger is in-app only. *(Rationale: adds scope; plan for Phase 2.)*
4. **No student-initiated payment requests.** Students cannot "ask" parents for money through the app. *(Rationale: out of scope; the flow is parent-driven.)*
5. **No changes to the existing allocation percentages or calculation logic.** The `TAX_RATES` constants in `src/shared/calculations/constants.ts` remain unchanged.

---

## User Stories

### Parent Personas

**As a parent viewing my child's Earnings screen**, I want to see a clear explanation of what each allocation bucket means and how I should handle the money, so that I know exactly what to do after my child earns their paycheck.

**As a parent**, I want to mark a paycheck period as "Paid," "Held," or "Pending" so that I can track whether I've fulfilled my child's earnings.

**As a parent**, I want to see a running summary of total amounts paid vs. held vs. outstanding across all periods, so I have a clear picture of my financial commitment.

**As a parent**, I want to optionally add a note when I mark something as paid (e.g., "Transferred to savings account" or "Gave cash"), so I have a record of how I fulfilled it.

### Student Personas

**As a student**, I want to see whether my parent has marked my earnings as "Paid" or "Held," so I know what money I can expect to receive.

**As a student**, I want to understand what "Held by Parent" means, so I don't think my parent is withholding my earnings unfairly.

---

## Requirements

### P0 — Must-Have (Phase 1)

#### 1. "How to Pay Your Scholar" Guide

**What:** A scrollable in-app guide accessible from the Earnings screen (both parent and student views) that explains how parents should handle each allocation bucket.

**Placement in current screen:** New CTA row in the Paycheck Breakdown card, below the existing "Plan Your Spending" link. Consistent with the `budgetPlannerCta` styling pattern already used in `earnings.tsx` (lines 294–327).

**Content structure:**
- What the calculated earnings represent (not real money yet — a target for parents to fulfill)
- Per-bucket guidance:
  - **Taxes (15%):** Suggest setting aside for a family "civic fund," donating to charity, or using as a teaching moment about government services
  - **Retirement/529 (10%):** Suggest transferring to a 529 plan, custodial Roth IRA, or long-term savings account
  - **Savings (25%):** Suggest a youth savings account at a bank or credit union, or parent-held savings earmarked for goals
  - **Discretionary (50%):** Suggest giving as cash, loading onto a prepaid card, or transferring to a youth checking account
- Recommended payment cadence options (weekly, biweekly, monthly)
- FAQ: "Do I have to pay real money?" (answer: the program works best when parents fulfill at least some portion — even partial fulfillment teaches real financial concepts)

**Acceptance Criteria:**
- [ ] Guide is accessible via a tappable CTA on the Earnings screen
- [ ] Guide renders as a new route (e.g., `/how-to-pay`) or a bottom sheet modal
- [ ] Content is static (no database dependency)
- [ ] Visible to both parent and student roles
- [ ] Uses existing theme/design system (`useTheme`, `colors`, Ionicons)

#### 2. Payment Status Tracker (Parent View)

**What:** A new section on the Earnings screen (parent view only) that allows parents to mark the current earnings period as Paid, Partially Paid, or Held.

**Placement in current screen:** New section inserted between the Paycheck Breakdown card and the External Savings section. This is approximately between lines 329 and 331 in the current `earnings.tsx`.

**UI Elements:**
- **Status badge** on the Total Earnings card showing current fulfillment status (Pending / Paid / Held / Partially Paid)
- **"Manage Payment" button** (parent view only, gated by `isParentView` — same pattern as the External Savings "Update Amount" button at line 342)
- **Payment action modal** with:
  - Status selector: Paid in Full / Partially Paid / Held for Later
  - Amount field (pre-filled with total earnings, editable for partial payments)
  - Payment method note (free text, optional): "Cash," "Bank transfer," "Held in savings," etc.
  - Date picker (defaults to today)
  - Confirm button

**Acceptance Criteria:**
- [ ] Parent can set payment status for the current earnings period
- [ ] Status persists across sessions (stored in Supabase)
- [ ] Student can see the status but cannot modify it
- [ ] Partial payments track the amount paid vs. total earned
- [ ] Payment records are queryable by `student_user_id` (consistent with existing ID semantics per CLAUDE.md)

#### 3. Payment Status Display (Student View)

**What:** Students see a read-only indicator of their payment status on the Earnings screen.

**Placement:** Below the Total Earnings card, above Income Sources.

**UI Elements:**
- Status badge: "Payment: Pending" (orange), "Payment: Paid" (green), "Payment: Held by Parent" (blue)
- If held: brief tooltip/explanation — "Your parent is holding this money safely on your behalf."
- If partially paid: show "Received: $X / $Y"

**Acceptance Criteria:**
- [ ] Student view shows payment status but no edit controls
- [ ] Status labels are encouraging/educational, not transactional
- [ ] "Held" status includes a positive framing (not "withheld")

#### 4. Payment Summary Card (Parent View)

**What:** A running summary visible to parents showing cumulative payment stats.

**Placement:** New section on the Earnings screen after Payment Status, before External Savings.

**UI Elements:**
- Three-column summary: **Total Earned** | **Total Paid** | **Outstanding**
- Color-coded: Paid in green, Outstanding in amber
- Tappable to expand into a simple list of past payment records

**Acceptance Criteria:**
- [ ] Summary aggregates all `payment_fulfillments` records for the selected student
- [ ] Handles zero-state gracefully ("No payment history yet")
- [ ] Only visible when `isParentView === true`

### P1 — Nice-to-Have (Phase 1 Stretch)

#### 5. Payment History Ledger

A scrollable list of all payment records for the selected student, accessible from the Payment Summary Card. Shows date, amount, status, and notes for each entry. Could be a bottom sheet or separate route.

#### 6. Per-Bucket Payment Breakdown

When marking as paid, allow parents to optionally specify how much went to each bucket (e.g., "$33 transferred to 529, $82.50 to savings account, $165 as cash"). Pre-fills from allocation calculation.

#### 7. Family Meeting Integration

Auto-populate the Family Meeting agenda (Step 4: Discussion) with pending payment items. Leverages existing `family_meetings` and `meeting_goals` tables.

### P2 — Future Considerations

#### 8. Automated Earnings Statements

Generate a PDF or in-app statement at the end of each reporting period summarizing earnings, allocation, and payment status.

#### 9. Push Notification Reminders

Remind parents to review and fulfill pending earnings. Uses existing Expo Notifications infrastructure.

#### 10. Payment Rail Integration

Optional connection to youth banking platforms or payment apps. Requires legal review.

---

## Technical Plan

### New Database Table: `payment_fulfillments`

```sql
CREATE TABLE public.payment_fulfillments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_user_id UUID NOT NULL REFERENCES auth.users(id),
  parent_user_id UUID NOT NULL REFERENCES auth.users(id),
  period_label TEXT NOT NULL,           -- e.g., "March 2026" or "Week of 3/17"
  total_earned NUMERIC(10,2) NOT NULL,
  amount_paid NUMERIC(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'partially_paid', 'held')),
  payment_method TEXT,                  -- free text: "cash", "bank transfer", etc.
  notes TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Why this schema:**
- `student_user_id` + `parent_user_id` follows the existing relationship pattern in `parent_student_relationships`
- `status` field mirrors the existing `behavior_bonuses.status` pattern (pending/paid) with added states
- `period_label` is a human-readable string rather than date ranges, keeping it flexible for different `reporting_frequency` values on `student_profiles`
- `total_earned` is snapshotted at time of record creation so the ledger is historically accurate even if grades change later

**RLS Policies Needed:**
- Parents can INSERT/UPDATE/SELECT where `parent_user_id = auth.uid()`
- Students can SELECT where `student_user_id = auth.uid()`
- No DELETE (payment records are immutable history)

**Index:** `CREATE INDEX idx_payment_fulfillments_student ON payment_fulfillments(student_user_id, created_at DESC);`

### New Hook: `usePaymentFulfillments`

**Location:** `src/hooks/usePaymentFulfillments.ts`

**Pattern:** Follows the exact same `useQuery` + `useMutation` + `useQueryClient` pattern as `useExternalSavings.ts` and `useSavingsGoals.ts`.

**Exports:**
- `fulfillments` — array of payment records for selected student
- `currentPeriodStatus` — derived status for the active earnings period
- `totals` — `{ totalEarned, totalPaid, outstanding }`
- `recordPayment(data)` — mutation to insert/update a fulfillment record
- `isLoading`, `refetch`

**Query key:** `['paymentFulfillments', studentUserId]`

### New Route: `/how-to-pay`

**Location:** `app/how-to-pay.tsx`

**Pattern:** Standalone route like `app/budget-planner.tsx` or `app/simulation.tsx`. Uses `SafeAreaView`, `ScrollView`, themed styles. Static content, no data fetching.

### Modifications to Existing Files

| File | Change | Scope |
|------|--------|-------|
| `app/(tabs)/earnings.tsx` | Add "How to Pay" CTA in Paycheck Breakdown card | ~15 lines, follows existing CTA pattern |
| `app/(tabs)/earnings.tsx` | Add Payment Status section (parent: editable, student: read-only) | ~80–120 lines new JSX + modal |
| `app/(tabs)/earnings.tsx` | Add Payment Summary card (parent only) | ~40 lines new JSX |
| `app/(tabs)/earnings.tsx` | Import `usePaymentFulfillments` hook | 1 line |
| `src/integrations/supabase/types.ts` | Add `payment_fulfillments` type (auto-generated after migration) | Auto |

### What We Do NOT Modify

- `src/shared/calculations/constants.ts` — TAX_RATES unchanged
- `src/shared/calculations/allocationCalculations.ts` — allocation logic unchanged
- `src/contexts/StudentContext.tsx` — no new context needed
- `src/hooks/usePaycheckCalculations.ts` — paycheck calc is purely computational, no payment awareness
- Any existing table schemas — no columns added to `student_profiles`, `behavior_bonuses`, etc.

---

## Screen Layout (Revised Earnings Screen)

Current order visible in screenshots and code:

```
┌─────────────────────────────────┐
│  Header: Earnings Summary       │
│  Student1's Financial Overview  │
├─────────────────────────────────┤
│  Total Earnings Card            │
│  $330.00                        │
│  Grades: $275 | Bonuses: +$55   │
│  ★ NEW: Payment Status Badge    │  ← badge below the totals
├─────────────────────────────────┤
│  Income Sources (pie chart)     │
│  Grade Rewards / Behavior /     │
│  Education breakdown            │
├─────────────────────────────────┤
│  Paycheck Breakdown (pie chart) │
│  Taxes / Retirement / Savings / │
│  Discretionary                  │
│  ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄  │
│  ✨ What-If Calculator          │
│  📊 Plan Your Spending          │
│  ★ NEW: 💳 How to Pay Guide     │  ← new CTA row
├─────────────────────────────────┤
│  ★ NEW: Payment Management      │  ← parent only
│  [Mark as Paid] [Hold for Later]│
│  Status: Pending                │
│  Method: — | Notes: —           │
├─────────────────────────────────┤
│  ★ NEW: Payment Summary         │  ← parent only
│  Earned: $330 | Paid: $0        │
│  Outstanding: $330              │
├─────────────────────────────────┤
│  External Savings               │  (existing)
│  Outside Money: $0.00           │
├─────────────────────────────────┤
│  Savings Goals                  │  (existing)
│  + Add Goal                     │
├─────────────────────────────────┤
│  Financial Tips                 │  (existing)
└─────────────────────────────────┘
```

---

## Success Metrics

| Metric | Type | Target | Measurement |
|--------|------|--------|-------------|
| Parents who view "How to Pay" guide within first week | Leading | >50% of active parents | Track route navigation to `/how-to-pay` |
| Parents who record at least one payment action within 30 days | Leading | >30% of active parents | Count distinct `parent_user_id` in `payment_fulfillments` |
| Reduction in payment-related confusion feedback | Lagging | Qualitative — Dr. Rich reports fewer complaints | Stakeholder check-in at 30 and 60 days |
| Increase in Earnings screen engagement (time on screen) | Lagging | +15% | Analytics event tracking |
| Savings goal creation rate | Lagging | +10% (hypothesis: payment clarity motivates goal-setting) | Count new `savings_goals` records |

---

## Open Questions

1. **[Product — Robert/Dr. Rich]** What "period" should payments map to? The app currently shows cumulative earnings (not period-based). Should we add period tracking, or is a single "current balance" approach simpler for parents?

2. **[Product — Robert]** Should the payment status be visible to students by default, or should parents opt in to sharing it? Some parents may want to hold funds without the student seeing "Pending."

3. **[Product — Dr. Rich]** Is there an immediate need for an interim parent communication (email/banner) before the feature ships? The plan doc suggested this — should we draft it now?

4. **[Design]** Should the "How to Pay" guide be a full-screen route (like `/simulation`) or a bottom sheet modal? A route is more discoverable and bookmarkable; a modal feels lighter.

5. **[Engineering]** The current Earnings screen is already 867 lines. Should we extract the new Payment Status section into its own component (`src/components/earnings/PaymentStatus.tsx`) to keep the file manageable?

6. **[Product]** The `behavior_bonuses` table already has `status: pending/paid` and `paid_at`. Should we migrate this existing concept to use the new `payment_fulfillments` table, or keep them separate? Merging would unify the payment tracking model; keeping them separate avoids touching working code.

---

## Timeline Considerations

- **No hard external deadline**, but Dr. Rich has flagged this as an active pain point — speed matters for credibility.
- **No third-party dependencies.** This is entirely within our Supabase + Expo stack.
- **Migration must go first.** The `payment_fulfillments` table and RLS policies need to be created before any hook or UI work begins (per CLAUDE.md rule #3: never write code that depends on a future migration).
- **Suggested phasing:**
  - **Week 1:** Migration + RLS policies + `usePaymentFulfillments` hook + "How to Pay" guide content and route
  - **Week 2:** Earnings screen UI additions (status badge, payment management section, summary card)
  - **Week 3:** Polish, testing, edge cases (zero-state, multi-student households, student-only accounts)
