# Roadmap: Centsible Scholar Mobile

## Overview

This roadmap delivers a complete App Store and Google Play launch for Centsible Scholar Mobile. The app already has a substantial parent experience built (27 validated features). The v1.0 milestone adds the missing pieces: password reset, independent student experience, in-app purchase subscriptions, data privacy compliance, UI polish, and store assets. Phases are ordered to maximize Expo Go development time, isolating the EAS dev build requirement to a single phase (IAP wiring).

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Architecture Foundation** - Schema extensions, role detection, and subscription abstraction that gate all downstream work
- [ ] **Phase 2: Auth + Student Routing** - Password reset and independent student dashboard with role-based navigation
- [ ] **Phase 3: Student Daily Experience** - Combined daily assessment flow and parent QOD progress view
- [ ] **Phase 4: Subscription UI + Gates** - Paywall, feature gating, and restore purchases (Expo Go, mocked IAP)
- [ ] **Phase 5: IAP Wiring** - Real in-app purchase flow via RevenueCat with EAS dev builds
- [ ] **Phase 6: Data Management + UI Polish** - Data export, account deletion, and consistent design system across all screens
- [ ] **Phase 7: App Store Preparation** - Screenshots, metadata, assets, and production builds for submission

## Phase Details

### Phase 1: Architecture Foundation
**Goal**: The app's data layer and routing infrastructure support dual billing sources (Stripe + IAP), role-based experiences (parent vs student), and unified entitlement logic
**Depends on**: Nothing (first phase)
**Requirements**: None (enabler phase -- gates AUTH-04, DASH-03, SUB-01, SUB-02, SUB-03)
**Success Criteria** (what must be TRUE):
  1. App detects whether the logged-in user is a parent or student and routes them to the correct experience
  2. Subscription status can be checked without knowing whether the user subscribed via Stripe (web) or IAP (mobile)
  3. Student users cannot see or access parent-only screens (manage students, grade approval, subscription management)
  4. Existing parent login and dashboard continue to work exactly as before
**Plans**: 2 plans

Plans:
- [x] 01-01-PLAN.md -- Role detection in AuthContext + role-based routing with conditional tab visibility
- [x] 01-02-PLAN.md -- Subscription schema migration for IAP + platform-agnostic useSubscriptionStatus hook

### Phase 2: Auth + Student Routing
**Goal**: Users can recover locked accounts and students can sign in independently to see their own personalized dashboard
**Depends on**: Phase 1
**Requirements**: AUTH-04, DASH-03
**Success Criteria** (what must be TRUE):
  1. User can tap "Forgot Password" on the login screen, enter their email, receive a 6-digit code, and set a new password
  2. Student can sign in with their own email/password and land on a student-specific dashboard showing their GPA, earnings, streak, and behavior score
  3. Student sees a different tab bar than parent (Dashboard, Grades, Behavior, Learn, Settings) with no parent management tabs visible
  4. Parent can still switch between students and see all parent features after this phase
**Plans**: 3 plans

Plans:
- [ ] 02-01-PLAN.md -- OTP-based password reset flow (forgot password, code verification, new password)
- [ ] 02-02-PLAN.md -- Student dashboard with horizontal metric cards + onboarding gate + tab routing
- [ ] 02-03-PLAN.md -- Required interactive onboarding tutorial for new students + replay in Settings

### Phase 3: Student Daily Experience
**Goal**: Students have a streamlined daily check-in and parents can monitor education progress across all children
**Depends on**: Phase 2
**Requirements**: DASH-04, QOD-04
**Success Criteria** (what must be TRUE):
  1. Student can complete QOD answer and behavior self-assessment in a single combined flow (not two separate screens)
  2. Student sees a progress indicator during the combined assessment and a celebration/summary at completion
  3. Parent can view a family-wide QOD progress screen showing total XP, average correct percentage, active streaks, and per-student cards
  4. Combined assessment results persist correctly (QOD answer recorded, behavior scores saved, streaks updated)
**Plans**: TBD

Plans:
- [ ] 03-01: TBD
- [ ] 03-02: TBD

### Phase 4: Subscription UI + Gates
**Goal**: The app enforces a free/premium boundary and presents a polished paywall, all testable in Expo Go
**Depends on**: Phase 1
**Requirements**: SUB-02, SUB-03
**Success Criteria** (what must be TRUE):
  1. Non-subscribed user hits a paywall when trying to access premium features (grade entry, behavior analytics, earnings, savings goals, additional students beyond 1)
  2. Paywall screen shows plan comparison, monthly/annual toggle, 7-day free trial disclosure, Terms of Service link, and Privacy Policy link
  3. User can tap "Restore Purchases" in Settings and the app checks for existing entitlements
  4. User can tap "Manage Subscription" in Settings and is taken to the platform-native subscription management screen
  5. No Stripe payment references, external payment links, or "manage on website" text exist anywhere in the mobile app
**Plans**: TBD

Plans:
- [ ] 04-01: TBD
- [ ] 04-02: TBD

### Phase 5: IAP Wiring
**Goal**: Users can purchase subscriptions through Apple App Store or Google Play with real money, completing the monetization flow
**Depends on**: Phase 4
**Requirements**: SUB-01
**Success Criteria** (what must be TRUE):
  1. User can select a subscription plan on the paywall and complete a real purchase through Apple StoreKit or Google Play Billing
  2. After purchase completes, the app immediately unlocks premium features without requiring a restart or manual refresh
  3. Subscription status syncs to Supabase via RevenueCat webhook so the web app recognizes the mobile subscription
  4. EAS development builds compile and run successfully on both iOS and Android
**Plans**: TBD

Plans:
- [ ] 05-01: TBD
- [ ] 05-02: TBD

### Phase 6: Data Management + UI Polish
**Goal**: The app meets Apple's data privacy requirements and every screen presents a polished, consistent experience worthy of App Store review
**Depends on**: Phase 3, Phase 5
**Requirements**: DATA-01, STYLE-01, STYLE-02
**Success Criteria** (what must be TRUE):
  1. User can export all personal data (grades, assessments, earnings, profile) as JSON or CSV via the native share sheet
  2. User can delete their account in-app with a confirmation flow that warns about data loss and offers a download-first option
  3. Account deletion cascades correctly (child records, student accounts if parent, auth user) and signs the user out
  4. All screens use consistent colors, typography, and spacing from the design system with no hardcoded values or placeholder text
  5. Every data-fetching screen has proper loading, error, and empty states with 44pt minimum touch targets and safe area compliance
**Plans**: TBD

Plans:
- [ ] 06-01: TBD
- [ ] 06-02: TBD
- [ ] 06-03: TBD

### Phase 7: App Store Preparation
**Goal**: The app is submitted to Apple App Store and Google Play with all required assets, metadata, and review materials
**Depends on**: Phase 6
**Requirements**: STORE-01, STORE-02
**Success Criteria** (what must be TRUE):
  1. App icon (1024x1024), splash screen, and launch assets are finalized and configured in the project
  2. App Store screenshots exist for iPhone (1290x2796) and iPad (2048x2732) showing key screens with real-looking data
  3. App Store metadata is complete: name, subtitle, description, keywords, age rating (12+), privacy policy URL, support URL, and privacy nutrition labels
  4. Review notes include demo credentials for both parent and student accounts with pre-populated data
  5. Production EAS builds compile and run cleanly on both iOS and Android
**Plans**: TBD

Plans:
- [ ] 07-01: TBD
- [ ] 07-02: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7
Note: Phase 4 depends on Phase 1 (not Phase 3), so Phases 2-3 and Phase 4 could overlap.

| Phase | Plans Complete | Status | Completed |
|-------|---------------|--------|-----------|
| 1. Architecture Foundation | 2/2 | Complete | 2026-02-05 |
| 2. Auth + Student Routing | 0/3 | Planned | - |
| 3. Student Daily Experience | 0/TBD | Not started | - |
| 4. Subscription UI + Gates | 0/TBD | Not started | - |
| 5. IAP Wiring | 0/TBD | Not started | - |
| 6. Data Management + UI Polish | 0/TBD | Not started | - |
| 7. App Store Preparation | 0/TBD | Not started | - |
