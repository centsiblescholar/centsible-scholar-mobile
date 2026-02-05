# Centsible Scholar Mobile

## What This Is

A React Native / Expo mobile app that mirrors the full Centsible Scholar Premium web experience for the Apple App Store and Google Play. Parents manage student accounts, track grades, assess behavior, and teach financial literacy. Students log in independently to answer daily questions, self-assess behavior, view earnings, and manage savings goals. The app teaches kids financial responsibility through an allowance system tied to academic performance and behavior.

## Core Value

Parents and students can do everything on mobile that they can on the web app — same features, same data, native mobile experience.

## Requirements

### Validated

- [x] AUTH-01: Parent can sign up with email/password — existing
- [x] AUTH-02: Parent can sign in with email/password — existing
- [x] AUTH-03: Student can sign in with email/password — existing
- [x] DASH-01: Parent dashboard shows student metrics, GPA, rewards, behavior, bonuses — existing
- [x] DASH-02: Parent can switch between students via picker — existing
- [x] GRADE-01: Grades can be submitted with subject, letter grade, base amount — existing
- [x] GRADE-02: Grade analytics with distribution charts and earnings — existing
- [x] GRADE-03: GPA calculated from submitted grades — existing
- [x] BEHAV-01: Daily behavior assessment with 10 categories (1-5 scale) — existing
- [x] BEHAV-02: Behavior analytics with trend charts and category averages — existing
- [x] BEHAV-03: Behavior bonus calculated from assessment scores — existing
- [x] QOD-01: Daily financial literacy question with multiple choice — existing
- [x] QOD-02: Education bonus calculated from QOD accuracy — existing
- [x] QOD-03: Streak tracking and progress display — existing
- [x] EARN-01: Earnings summary with grade rewards and bonuses — existing
- [x] EARN-02: Allocation breakdown (taxes, retirement, savings, discretionary) — existing
- [x] EARN-03: Savings goals CRUD with progress tracking — existing
- [x] MGMT-01: Parent can create student accounts (name, email, password, grade, base reward) — existing
- [x] MGMT-02: Parent can edit and deactivate students — existing
- [x] MGMT-03: Parent can approve/reject student grades — existing
- [x] TERM-01: Term tracking with configurable lengths and snapshots — existing
- [x] TERM-02: GPA history chart across terms — existing
- [x] MEET-01: Family meeting scheduling with reminders — existing
- [x] MEET-02: Student self-assessment after meetings — existing
- [x] MEET-03: Meeting history with assessment scores — existing
- [x] SET-01: Settings screen with profile, subscription, notifications, support — existing
- [x] SET-02: Edit profile (name, grade level, base reward) — existing
- [x] SET-03: Push notification management — existing
- [x] NOTIF-01: Local notifications for meetings, grades, behavior alerts — existing

### Active

- [ ] AUTH-04: Password reset / forgot password flow
- [ ] DASH-03: Independent student dashboard (student logs in, sees own data)
- [ ] DASH-04: Student daily assessment flow (QOD + behavior self-assessment combined)
- [ ] QOD-04: Parent QOD progress view (family-wide stats across all students)
- [ ] BUDGET-01: Budget planner with weekly/monthly planning
- [ ] BUDGET-02: External savings tracking
- [ ] REPORT-01: Analytics reports with unified chart views
- [ ] REPORT-02: Data export (CSV, JSON, PDF)
- [ ] REPORT-03: Printable/shareable report generation
- [ ] DATA-01: Data management (export, backup, deletion requests)
- [ ] RESOURCE-01: Downloadable financial education resources/guides
- [ ] FINED-01: Financial education hub (content beyond QOD)
- [ ] SUB-01: In-app purchase subscription flow (Apple IAP / Google Play Billing)
- [ ] SUB-02: Subscription gate (restrict features for non-subscribers)
- [ ] SUB-03: Subscription restore and management
- [ ] STYLE-01: Match web app visual design system (colors, typography, spacing)
- [ ] STYLE-02: Polished UI for App Store review (no placeholder text, consistent styling)
- [ ] STORE-01: App Store metadata (screenshots, description, keywords)
- [ ] STORE-02: App icon, splash screen, launch assets

### Out of Scope

- Influencer portal — web-only, not needed for mobile App Store launch
- Admin panel — web-only management tool
- Stripe payments — replaced by Apple IAP / Google Play Billing on mobile
- Landing page / marketing pages — not applicable to mobile app
- Demo/preview pages — web-only marketing tool
- Cookie policy page — not applicable to mobile

## Context

- Web app reference: `/Users/robertisrael/Documents/GitHub/centsible-scholar-premium`
- Mobile app is brownfield — significant features already built and working
- Supabase backend is shared between web and mobile (same database, same edge functions)
- Students have real Supabase auth accounts — parents create them with email/password
- Database trigger `handle_new_user` auto-creates parent_profiles on signup
- expo-crypto does NOT work in Expo Go — use pure JS alternatives
- DO NOT auto-generate student emails — parents enter them manually
- `.insert().select().single()` triggers both INSERT and SELECT RLS — use edge functions or separate queries
- Web app uses Stripe; mobile must use Apple IAP / Google Play Billing
- App runs in Expo Go during development; will need EAS builds for store submission

## Constraints

- **Platform**: React Native / Expo (Expo Go compatible during dev, EAS build for production)
- **Backend**: Supabase (shared with web app — same DB, same edge functions, same RLS policies)
- **State**: TanStack React Query for server state, React Context for auth/student selection
- **Routing**: Expo Router (file-based)
- **Payments**: Apple IAP + Google Play Billing (NOT Stripe)
- **Store**: Must pass Apple App Store and Google Play review guidelines
- **No native modules in dev**: Expo Go doesn't support native dev builds — use JS alternatives

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Use Supabase edge function for student creation | Avoids RLS INSERT/SELECT race condition | Good |
| textContentType="oneTimeCode" for password fields | Prevents iOS Automatic Strong Password overlay | Good |
| AsyncStorage for session persistence | Standard Expo approach for auth token storage | Good |
| Skip influencer/admin on mobile | Web-only management tools, not needed for consumer app | -- Pending |
| Apple IAP / Google Play Billing for subscriptions | Required by App Store / Play Store guidelines | -- Pending |
| Full student login experience on mobile | Students need independent access for QOD, assessments, grades | -- Pending |

---
*Last updated: 2026-02-05 after initialization*
