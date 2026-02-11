# Phase 6: Data Management + UI Polish - Context

**Gathered:** 2026-02-11
**Status:** Ready for planning

<domain>
## Phase Boundary

The app meets Apple's data privacy requirements (GDPR-compliant data export and account deletion) and every screen presents a polished, consistent experience worthy of App Store review (design system consistency, loading/error/empty states, accessibility compliance).

This phase does NOT add new features — it standardizes existing screens and adds required privacy controls.

</domain>

<decisions>
## Implementation Decisions

### Data Export Experience
- **Data scope**: Everything (all tables the user owns) — comprehensive GDPR-compliant export
  - Include: profile, students, grades, assessments, QOD answers, earnings, behavior scores, streak history
  - Exclude: password hashes, payment methods, subscription IDs (sensitive auth/payment details)
- **Export structure**: Both formats offered — user chooses "Export as single JSON file" or "Export as ZIP with multiple CSVs"
  - Single JSON: `{profile: {...}, students: [...], grades: [...]}`
  - ZIP: Separate files per table (students.csv, grades.csv, assessments.csv, etc.)
- **CSV handling**: Flatten to multiple CSV files — relational via IDs (students.csv, grades.csv, etc.)
- **Preview**: Show preview screen first — display summary with breakdown ("2 students, 145 grades, 89 assessments, 2.4 MB") before opening share sheet
- **Metadata**: Minimal metadata — just export_date at top of file
- **Student data inclusion**: Ask at export time — "Include student data?" checkbox for parent exports
- **File naming**: Descriptive with timestamp — `centsible-scholar-export-2026-02-11.json`
- **Access location**: Settings only — Settings → Privacy → Export My Data
- **Student access**: Parent-only feature — students don't see export option
- **Processing UI**: Modal with progress bar — overlay blocks screen, shows "Preparing export... 45%"
- **Error handling**: Retry with full export — show error alert with Retry button

### Account Deletion Flow
- **Confirmation steps**: Two-step confirmation — warning screen + "Type DELETE to confirm" before deletion
- **Warnings**: General warning — "All your data will be permanently deleted"
- **Export nudge**: No export nudge — export is separate in Settings, deletion doesn't mention it
- **Parent with students**: Cascade delete students automatically — warn "This will also delete 2 student accounts" then cascade all child records
- **Subscription handling**: Require cancellation first — "Cancel your subscription before deleting" error if active subscription exists
- **Execution**: Immediate deletion + sign out — delete database records, invalidate session, redirect to login (no grace period)
- **Access location**: Settings → Account → Delete Account — requires navigation, harder to find accidentally
- **Student access**: Parent-only (students can't delete) — only parents see delete account option
- **Visual style**: Red destructive button — bright red, clearly dangerous (iOS/Android standard)
- **Error handling**: Block deletion, show error — "Deletion failed: [reason]. Contact support."

### Design System Application
- **Web parity approach**: Mobile-native adaptation — use web colors but adapt typography/spacing for mobile
- **Color palette**: Match web app colors — extract exact hex values from web app CSS
- **Parent vs student visual differences**: Subtle accent differences — same structure, different accent colors (parent: blue, student: purple)
- **Typography**: Custom font from web app — match web app's font for brand consistency
- **Spacing system**: 8pt grid system — all spacing in multiples of 8 (8, 16, 24, 32)
- **Theme structure**: Single theme.ts file — all colors, fonts, spacing in one file (single source of truth)
- **Button styling**: Props-based styling — single Button component with variant prop
- **Hardcoded values**: Both (audit + prevent) — fix existing hardcoded values AND add ESLint rule to prevent future violations
- **Inline styles**: Migrate to theme tokens — replace all inline colors/fonts with theme references for full compliance
- **Dark mode**: Yes, build theme with light/dark — design theme.ts for both modes upfront (easier to add dark mode later)
- **Icons**: Ionicons library (current) — continue using @expo/vector-icons
- **Component audit**: Full component inventory — document all components, standardize variants (comprehensive catalog)
- **Web app reference**: Extract exact values from CSS — parse web app CSS for colors/fonts/spacing
- **Documentation**: Create design system docs — document theme structure, usage examples, dos/don'ts
- **Animations**: Animations ad-hoc — handle animations per-component (not in theme)

### Loading and Empty States
- **Loading indicator**: Skeleton screens (shimmer) — loading placeholders that animate, shows structure
- **Empty state tone**: Friendly and helpful — illustrations + encouraging messages ("Add your first student to get started!")
- **Error presentation**: Inline with retry button — error message in place + "Try Again" button for self-service recovery

### Claude's Discretion
- Offline state handling — choose based on app criticality (network errors vs explicit offline mode)
- Exact skeleton animation timing
- Empty state illustration style/sourcing
- Error message copy specifics
- Component inventory organization structure
- ESLint rule configuration details

</decisions>

<specifics>
## Specific Ideas

None — open to standard approaches for privacy controls, design system implementation, and state management.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 06-data-management-ui-polish*
*Context gathered: 2026-02-11*
