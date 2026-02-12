---
phase: 06-data-management-ui-polish
plan: 02
subsystem: api, ui
tags: [gdpr, data-export, edge-function, deno, fflate, zip, csv, expo-file-system, expo-sharing, share-sheet]

# Dependency graph
requires:
  - phase: 01-architecture-foundation
    provides: Supabase client, auth context, user profile hook
  - phase: 05-iap-wiring
    provides: Edge function patterns (revenuecat-webhook), tsconfig exclusion for supabase/functions
provides:
  - GDPR-compliant data export edge function (JSON and CSV/ZIP formats)
  - useDataExport hook for client-side export flow
  - Export preview screen with format selection and data summary
  - Privacy section in Settings (parent-only)
affects: [06-data-management-ui-polish]

# Tech tracking
tech-stack:
  added: [fflate (Deno, server-side ZIP creation via esm.sh)]
  patterns: [edge function auth via bearer token + getUser, base64 ZIP transfer, new expo-file-system File API for file writing]

key-files:
  created:
    - supabase/functions/export-user-data/index.ts
    - src/hooks/useDataExport.ts
    - app/data-export.tsx
  modified:
    - app/(tabs)/settings.tsx
    - app/_layout.tsx

key-decisions:
  - "fflate over JSZip for server-side ZIP creation in Deno (lighter, synchronous API)"
  - "New expo-file-system File API for both JSON (UTF8) and ZIP (base64) writing"
  - "Summary fetched on mount via actual export call (reuses same edge function)"
  - "Privacy section placed between Notifications and App sections in Settings"

patterns-established:
  - "Edge function auth: extract bearer token, supabaseAdmin.auth.getUser(token), check user_metadata"
  - "Base64 ZIP transfer: server creates ZIP, base64-encodes, client decodes and writes file"
  - "Export flow: edge function -> file write -> Sharing.shareAsync"

# Metrics
duration: 4min
completed: 2026-02-12
---

# Phase 6 Plan 2: GDPR Data Export Summary

**Server-side ZIP/JSON data export via Deno edge function with fflate, client-side file writing via new expo-file-system API, and native share sheet integration**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-12T16:02:14Z
- **Completed:** 2026-02-12T16:06:31Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Edge function gathers all parent + student data from 12 Supabase tables using service_role key
- JSON format returns structured object; CSV format returns base64-encoded ZIP with separate CSVs per table
- ZIP creation happens server-side in Deno using fflate (not client-side)
- Complete export flow: Settings > Privacy > Export My Data > preview > format selection > share sheet
- Students cannot see or access the export feature (isParent guard)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create export-user-data edge function with server-side ZIP creation** - `3de60e9` (feat)
2. **Task 2: Create useDataExport hook, data-export screen, and wire into Settings** - `c1329b9` (feat)

## Files Created/Modified
- `supabase/functions/export-user-data/index.ts` - Edge function: gathers user data, returns JSON or base64 ZIP with CSVs
- `src/hooks/useDataExport.ts` - Hook managing export state, edge function calls, file writing, sharing
- `app/data-export.tsx` - Export preview screen with summary counts, format selector, student toggle, progress overlay
- `app/(tabs)/settings.tsx` - Added Privacy section with "Export My Data" (parent-only)
- `app/_layout.tsx` - Registered data-export Stack.Screen as modal

## Decisions Made
- Used fflate over JSZip for Deno ZIP creation: synchronous `zipSync` API, lighter footprint, reliable esm.sh import
- Used new expo-file-system `File` API for both JSON (UTF8 string write) and ZIP (base64 encoding write) -- no need for legacy API
- Summary is fetched by calling the full export endpoint (returns summary alongside data) rather than a separate summary-only endpoint
- Privacy section placed between Notifications and App in Settings for logical grouping
- CSV escaping handles commas, newlines, and double quotes per RFC 4180

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
- Deploy edge function: `supabase functions deploy export-user-data`
- No additional secrets needed (uses existing SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY)

## Next Phase Readiness
- Data export feature is complete and ready for testing
- Edge function needs deployment to Supabase before it works in production
- Plan 3 (account deletion) can proceed independently

---
*Phase: 06-data-management-ui-polish*
*Completed: 2026-02-12*
