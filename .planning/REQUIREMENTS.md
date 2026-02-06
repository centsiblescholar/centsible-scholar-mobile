# Requirements: Centsible Scholar Mobile

**Defined:** 2026-02-05
**Core Value:** Parents and students can do everything on mobile that they can on the web app -- same features, same data, native mobile experience.

## v1.0 Requirements (App Store Launch)

Requirements for first App Store and Google Play submission.

### Authentication

- [x] **AUTH-04**: User can reset password via email with OTP code (6-digit code flow)

### Student Experience

- [x] **DASH-03**: Student can sign in and see independent dashboard with own data (GPA, earnings, streak, behavior)
- [x] **DASH-04**: Student can complete daily assessment in single flow (QOD + behavior self-assessment combined)
- [x] **QOD-04**: Parent can view family-wide QOD progress (total XP, average correct %, active streaks, per-student cards)

### Subscriptions & Monetization

- [ ] **SUB-01**: User can subscribe via Apple IAP / Google Play Billing (3 tiers: Standard/Premium/Family, monthly/annual, 7-day trial)
- [x] **SUB-02**: App enforces subscription gates (free tier: 1 student + basic features; premium: unlimited students + all features)
- [x] **SUB-03**: User can restore purchases and manage subscription (Restore Purchases button, Manage Subscription link to platform settings)

### Data Management & Privacy

- [ ] **DATA-01**: User can export all personal data (JSON/CSV download) and delete account (in-app cascade deletion with confirmation)

### UI/UX Polish

- [ ] **STYLE-01**: All screens match web app design system (colors, typography, spacing, consistent theme)
- [ ] **STYLE-02**: UI meets App Store review quality (no placeholder text, loading/error/empty states, keyboard handling, 44pt touch targets, safe areas)

### Store Submission

- [ ] **STORE-01**: App Store metadata complete (screenshots 1290x2796 iPhone + 2048x2732 iPad, descriptions, keywords, privacy URL, support URL)
- [ ] **STORE-02**: App Store assets complete (1024x1024 icon, splash screen, demo credentials for reviewer)

## v2.0 Requirements

Deferred to post-launch release. Tracked but not in current roadmap.

### Financial Tools

- **BUDGET-01**: User can create budget plans with weekly/monthly planning
- **BUDGET-02**: User can track external savings accounts

### Analytics & Reports

- **REPORT-01**: User can view analytics reports with unified chart views
- **REPORT-02**: User can export data in CSV, JSON, and PDF formats
- **REPORT-03**: User can generate printable/shareable reports

### Education Content

- **RESOURCE-01**: User can download financial education resources and guides
- **FINED-01**: User can access financial education hub with content beyond daily QOD

## Out of Scope

Explicitly excluded from mobile app. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Influencer portal | Web-only feature, not needed for consumer mobile app launch |
| Admin panel | Web-only management tool, inappropriate for mobile context |
| Stripe payment flows | Mobile must use Apple IAP / Google Play Billing per App Store guidelines. Web continues using Stripe. |
| Landing page / marketing pages | Not applicable to mobile app - handled by App Store listing |
| Demo/preview pages | Web-only marketing tool |
| Cookie consent / policy pages | Not applicable to mobile apps |
| Dark mode | Theme system supports it but doubles QA surface area. Defer to v2.0. |
| iPad-optimized layouts | Phone-first design scales up via supportsTablet: true. Native iPad layouts deferred. |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-04 | Phase 2: Auth + Student Routing | Complete |
| DASH-03 | Phase 2: Auth + Student Routing | Complete |
| DASH-04 | Phase 3: Student Daily Experience | Complete |
| QOD-04 | Phase 3: Student Daily Experience | Complete |
| SUB-01 | Phase 5: IAP Wiring | Pending |
| SUB-02 | Phase 4: Subscription UI + Gates | Complete |
| SUB-03 | Phase 4: Subscription UI + Gates | Complete |
| DATA-01 | Phase 6: Data Management + UI Polish | Pending |
| STYLE-01 | Phase 6: Data Management + UI Polish | Pending |
| STYLE-02 | Phase 6: Data Management + UI Polish | Pending |
| STORE-01 | Phase 7: App Store Preparation | Pending |
| STORE-02 | Phase 7: App Store Preparation | Pending |

**Coverage:**
- v1.0 requirements: 12 total
- Mapped to phases: 12
- Unmapped: 0

---
*Requirements defined: 2026-02-05*
*Last updated: 2026-02-06 after Phase 2 completion*
