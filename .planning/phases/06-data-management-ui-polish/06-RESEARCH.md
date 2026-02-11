# Phase 6: Data Management + UI Polish - Research

**Researched:** 2026-02-11
**Domain:** GDPR data export/deletion, React Native design system, skeleton screens, dark mode
**Confidence:** HIGH

## Summary

This phase covers four distinct technical domains: (1) GDPR-compliant data export with JSON/CSV/ZIP via the native share sheet, (2) cascading account deletion through a Supabase edge function, (3) design system consolidation with dark mode support, and (4) skeleton loading screens for all data-fetching views.

The existing codebase already has a mature theme system (`src/theme/`) with colors, typography, spacing, shadows, border radius, and common styles -- but 25 screen files contain approximately 660 hardcoded color references that need migration. The web app uses Tailwind defaults (no custom fonts), and the mobile theme colors already match the web app's `scholar` and `financial` color scales exactly. Dark mode token values are already defined in `colors.ts` but not wired to a context provider.

**Primary recommendation:** This phase is predominantly integration and polish work. The data export and account deletion features require a new Supabase edge function (`delete-account`) following the existing `delete-student` pattern. The design system work is a systematic audit-and-migrate task across all 25 screen files. Use `moti/skeleton` for skeleton screens since the project already has `react-native-reanimated` installed.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `expo-file-system` | SDK 54 (new API) | Write JSON/CSV files to device | Built into Expo SDK 54 with new object-based File/Directory classes; already bundled as transitive dependency |
| `expo-sharing` | ~2.0 | Open native share sheet for files | Official Expo solution for sharing files; uses system share sheet on iOS/Android |
| `moti` | ^0.30 | Skeleton screen shimmer animations | Built on react-native-reanimated (already installed); well-maintained, Expo-compatible |
| `expo-linear-gradient` | SDK 54 compatible | Required peer dependency for moti/skeleton | Official Expo gradient component; no native code concerns |
| `eslint-plugin-react-native` | ^4.x | Prevent hardcoded colors via `no-color-literals` rule | Established ESLint plugin specifically for React Native style enforcement |
| `expo-font` | SDK 54 compatible | Load custom fonts if needed | Built into Expo; already a transitive dependency |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `react-native-reanimated` | ~4.1.1 (installed) | Moti dependency, already in project | No new install needed |
| `@expo-google-fonts/inter` | latest | System-like font matching Tailwind defaults | Only if custom font decision is made; web app uses system/Tailwind default fonts |
| `date-fns` | ^4.1.0 (installed) | Format export timestamps | Already in project |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `moti/skeleton` | `react-native-skeleton-content` | Moti leverages existing reanimated dependency; skeleton-content pulls in additional native deps (masked-view, linear-gradient from community) |
| `moti/skeleton` | Hand-rolled Animated.View shimmer | Much more code, harder to maintain, no Skeleton.Group convenience |
| `expo-file-system` (new API) | `expo-file-system/legacy` | New API is the default in SDK 54; legacy is deprecated; new API uses File/Directory classes |
| Single edge function for deletion | Client-side cascading deletes | Edge function can use service_role key for auth.admin.deleteUser(); client cannot safely delete auth users |

### ZIP Creation Strategy

**Important finding:** JSZip does NOT work in React Native/Expo due to missing `stream` module. `react-native-zip-archive` requires a dev build (not Expo Go compatible).

**Recommended approach:** Since the user chose "ZIP with multiple CSVs" as an export format option, implement ZIP creation server-side via a Supabase edge function (`export-user-data`). The edge function:
1. Gathers all user data using service_role key
2. Uses Deno's built-in ZIP capabilities (or simple concatenation)
3. Returns the ZIP as a base64-encoded response
4. Client writes the base64 to a file and opens share sheet

**Alternative approach (simpler):** Skip ZIP entirely -- offer "JSON" and "CSV Bundle" where CSV Bundle is a single file with sections separated by headers, or multiple CSV files written individually and shared one at a time. This avoids the ZIP complexity entirely.

**Recommendation:** Use an edge function for data export. This is better anyway because it can access all user data via service_role (bypassing RLS complexity) and consolidate the export logic server-side.

**Installation:**
```bash
npx expo install expo-file-system expo-sharing expo-linear-gradient expo-font
npm install moti eslint-plugin-react-native
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  components/
    ui/
      SkeletonCard.tsx          # Reusable skeleton card component
      SkeletonList.tsx          # Reusable skeleton list component
      EmptyState.tsx            # Reusable empty state component
      ErrorState.tsx            # Reusable inline error with retry
      LoadingOverlay.tsx        # Modal progress overlay for export
  theme/
    colors.ts                   # Already exists - add ThemeContext wiring
    typography.ts               # Already exists - add fontFamily when custom font loaded
    spacing.ts                  # Already exists - no changes needed
    commonStyles.ts             # Already exists - extend with skeleton styles
    index.ts                    # Already exists - add ThemeProvider export
    ThemeContext.tsx             # NEW - React context for light/dark switching
  hooks/
    useTheme.ts                 # NEW - hook returning current theme colors
    useDataExport.ts            # NEW - data export logic
    useAccountDeletion.ts       # NEW - account deletion flow logic
  utils/
    csvFormatter.ts             # NEW - JSON to CSV conversion
    exportHelpers.ts            # NEW - file naming, metadata generation
supabase/
  functions/
    delete-account/index.ts     # NEW - cascade account deletion edge function
    export-user-data/index.ts   # NEW - server-side data gathering + optional ZIP
app/
  data-export.tsx               # NEW - export preview screen
  delete-account.tsx            # NEW - deletion confirmation screen
```

### Pattern 1: ThemeContext with useColorScheme
**What:** React context that combines system color scheme preference with manual override
**When to use:** All components that need theme-aware colors
**Example:**
```typescript
// src/theme/ThemeContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { lightTheme, darkTheme, ThemeColors } from './colors';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  colors: ThemeColors;
  mode: ThemeMode;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>('system');

  useEffect(() => {
    AsyncStorage.getItem('theme-mode').then((stored) => {
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        setMode(stored);
      }
    });
  }, []);

  const handleSetMode = (newMode: ThemeMode) => {
    setMode(newMode);
    AsyncStorage.setItem('theme-mode', newMode);
  };

  const isDark = mode === 'system' ? systemScheme === 'dark' : mode === 'dark';
  const colors = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ colors, mode, isDark, setMode: handleSetMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
```

### Pattern 2: Edge Function for Account Deletion
**What:** Server-side function using service_role to cascade-delete user and all related data
**When to use:** Account deletion requires deleting from auth.users which needs admin privileges
**Example:**
```typescript
// supabase/functions/delete-account/index.ts
// Pattern from existing delete-student function
import { serve } from 'https://deno.land/std@0.190.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'

serve(async (req) => {
  // 1. Verify auth token from request
  // 2. Confirm user identity matches token
  // 3. Check subscription status (require cancellation first)
  // 4. If parent: find all student relationships
  // 5. Delete student auth users first (cascade their data)
  // 6. Delete parent auth user (cascades parent data)
  // 7. Return success
})
```

### Pattern 3: Skeleton Screen with Moti
**What:** Shimmer loading placeholders that match actual content layout
**When to use:** Every screen that fetches data from Supabase
**Example:**
```typescript
// Source: https://moti.fyi/skeleton
import { Skeleton } from 'moti/skeleton';

function DashboardSkeleton() {
  return (
    <Skeleton.Group show={true}>
      <Skeleton height={120} radius={12} colorMode="light" />
      <View style={{ height: 16 }} />
      <Skeleton height={24} width="60%" radius={4} />
      <View style={{ height: 8 }} />
      <Skeleton height={16} width="80%" radius={4} />
    </Skeleton.Group>
  );
}

// Usage in screen:
function DashboardScreen() {
  const { data, isLoading, error, refetch } = useQuery(...);

  if (isLoading) return <DashboardSkeleton />;
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;
  if (!data?.length) return <EmptyState icon="bar-chart" title="No data yet" />;

  return <DashboardContent data={data} />;
}
```

### Pattern 4: Data Export with Edge Function + Share Sheet
**What:** Server gathers data, client writes file and opens share sheet
**When to use:** GDPR data export
**Example:**
```typescript
// Client-side hook
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

async function exportUserData(format: 'json' | 'csv') {
  // 1. Call edge function to gather all user data
  const { data } = await supabase.functions.invoke('export-user-data', {
    body: { format, includeStudents: true }
  });

  // 2. Write to local file
  const filename = `centsible-scholar-export-${new Date().toISOString().split('T')[0]}.${format === 'json' ? 'json' : 'zip'}`;
  const file = new File(Paths.cache, filename);
  file.create();
  file.write(data.content); // base64 decoded or raw string

  // 3. Share via native sheet
  await Sharing.shareAsync(file.uri, {
    mimeType: format === 'json' ? 'application/json' : 'application/zip',
    dialogTitle: 'Export Your Data',
  });
}
```

### Anti-Patterns to Avoid
- **Client-side auth.admin calls:** NEVER expose service_role key in the mobile app. Always use edge functions for admin operations.
- **JSZip in React Native:** Does not work due to missing `stream` polyfill. Use server-side ZIP creation or skip ZIP.
- **Hardcoded colors in new code:** All new code must import from `src/theme`. No hex literals.
- **Static `colors = lightTheme` import for dark mode:** The current `export const colors = lightTheme` pattern is NOT dynamic. Must use ThemeContext for dark mode support.
- **Direct file path strings with old API:** Use new `File` and `Directory` classes from expo-file-system (SDK 54 default), not `writeAsStringAsync` from legacy API.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Skeleton shimmer animation | Custom Animated.View with gradient | `moti/skeleton` with `Skeleton.Group` | Handles animation timing, group coordination, color modes, layout automatically |
| File sharing | Custom intent/activity launcher | `expo-sharing` `shareAsync()` | Platform-specific share sheet handling is complex; expo-sharing wraps it correctly for iOS/Android |
| ZIP file creation | JSZip or manual ZIP binary format | Supabase edge function with Deno built-in OR skip ZIP | JSZip breaks in RN; ZIP binary format is non-trivial; server-side is cleaner |
| CSV conversion | Manual string concatenation | Dedicated `csvFormatter.ts` utility with proper escaping | CSV has edge cases (commas in values, newlines, quotes) that need proper escaping |
| Color scheme detection | Manual Appearance API listener | `useColorScheme()` from react-native | Hook handles subscription, updates, and platform differences |
| ESLint no-color-literals | Custom ESLint rule | `eslint-plugin-react-native` `no-color-literals` | Already exists, well-tested, covers StyleSheet and inline styles |
| User deletion cascade | Manual table-by-table deletion | `auth.admin.deleteUser()` in edge function | Supabase handles cascade via foreign key constraints on auth.users |

**Key insight:** The data export feature benefits enormously from being an edge function. The edge function can use service_role to query ALL user tables without worrying about RLS complexity, can handle ZIP creation in Deno (which has proper stream support), and keeps the client simple (invoke function, write result, share file).

## Common Pitfalls

### Pitfall 1: expo-file-system API Migration (SDK 54)
**What goes wrong:** Using `writeAsStringAsync` from `expo-file-system` which is now the legacy API
**Why it happens:** Most tutorials and StackOverflow answers reference the old function-based API
**How to avoid:** Import from `expo-file-system` (new default) using `File` and `Directory` classes. Old API is at `expo-file-system/legacy`.
**Warning signs:** Import of `writeAsStringAsync`, `readAsStringAsync`, `documentDirectory` as string constant

### Pitfall 2: Orphaned Auth Users on Deletion Failure
**What goes wrong:** Deleting public data first, then auth.users deletion fails, leaving orphaned profile data deleted but auth user intact
**Why it happens:** Non-transactional deletion sequence
**How to avoid:** Delete auth.users FIRST -- foreign key CASCADE handles public table cleanup. The existing `delete-student` edge function already follows this pattern (line 128: `auth.admin.deleteUser(studentUserId)` then cascade handles the rest).
**Warning signs:** Multiple DELETE queries before the auth.admin.deleteUser call

### Pitfall 3: Subscription Not Canceled Before Deletion
**What goes wrong:** User deletes account but RevenueCat subscription keeps billing
**Why it happens:** Account deletion doesn't automatically cancel App Store/Play Store subscriptions
**How to avoid:** The CONTEXT.md decision says "Require cancellation first" -- check subscription status before allowing deletion. Show a link to manage subscriptions in App Store/Play Store if active.
**Warning signs:** Deletion proceeds without subscription status check

### Pitfall 4: Static Theme Import Breaks Dark Mode
**What goes wrong:** Components import `colors` directly from `src/theme/colors.ts` which is always `lightTheme`
**Why it happens:** The current `export const colors = lightTheme` is a static assignment, not reactive
**How to avoid:** After adding ThemeContext, all screens must use `useTheme().colors` instead of importing `colors` directly. The `commonStyles.ts` also uses static `colors` import and will need refactoring.
**Warning signs:** `import { colors } from '../src/theme'` in screen files after ThemeContext exists

### Pitfall 5: CSV Escaping Edge Cases
**What goes wrong:** CSV export breaks when values contain commas, newlines, or double quotes
**Why it happens:** Naive CSV generation just joins with commas
**How to avoid:** Proper CSV escaping: wrap values containing commas/newlines/quotes in double quotes, and escape embedded double quotes by doubling them
**Warning signs:** CSV generation using simple `.join(',')` without value inspection

### Pitfall 6: Large Export Timeout
**What goes wrong:** Edge function times out gathering data for users with many students and records
**Why it happens:** Supabase edge functions have execution time limits
**How to avoid:** Query tables in parallel with `Promise.all()`, apply reasonable limits, consider pagination for very large datasets. Default Supabase edge function timeout is 60 seconds which should be sufficient for most users.
**Warning signs:** Sequential queries in the edge function

### Pitfall 7: Hardcoded Colors in Navigation Config
**What goes wrong:** Tab bar and header colors remain hardcoded after screen migration
**Why it happens:** `app/_layout.tsx` and `app/(tabs)/_layout.tsx` use hardcoded `#4F46E5` in `screenOptions`
**How to avoid:** These navigation configs also need theme migration. Since they're outside React component render (in `screenOptions`), they may need a different approach (theme object import or dynamic screenOptions function).
**Warning signs:** Hex colors remaining in `_layout.tsx` files

## Code Examples

### File Writing with New expo-file-system API (SDK 54)
```typescript
// Source: https://docs.expo.dev/versions/latest/sdk/filesystem/
import { File, Paths } from 'expo-file-system';

// Write JSON export
const exportData = { profile: {...}, students: [...], grades: [...] };
const filename = `centsible-scholar-export-2026-02-11.json`;
const file = new File(Paths.cache, filename);
file.create();
file.write(JSON.stringify(exportData, null, 2));

// file.uri is the local file path to pass to Sharing
console.log(file.uri); // e.g., file:///var/.../Library/Caches/centsible-scholar-export-2026-02-11.json
```

### Native Share Sheet
```typescript
// Source: https://docs.expo.dev/versions/latest/sdk/sharing/
import * as Sharing from 'expo-sharing';

const isAvailable = await Sharing.isAvailableAsync();
if (isAvailable) {
  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/json',
    dialogTitle: 'Export Your Centsible Scholar Data',
  });
}
```

### Moti Skeleton Loading
```typescript
// Source: https://moti.fyi/skeleton
import { Skeleton } from 'moti/skeleton';
import { useTheme } from '../src/theme/ThemeContext';

function CardSkeleton() {
  const { isDark } = useTheme();
  const colorMode = isDark ? 'dark' : 'light';

  return (
    <Skeleton.Group show={true}>
      <View style={{ padding: 16 }}>
        <Skeleton height={24} width="60%" radius={4} colorMode={colorMode} />
        <View style={{ height: 12 }} />
        <Skeleton height={16} width="100%" radius={4} colorMode={colorMode} />
        <View style={{ height: 8 }} />
        <Skeleton height={16} width="80%" radius={4} colorMode={colorMode} />
      </View>
    </Skeleton.Group>
  );
}
```

### CSV Formatting with Proper Escaping
```typescript
// src/utils/csvFormatter.ts
function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function arrayToCsv(headers: string[], rows: Record<string, unknown>[]): string {
  const headerLine = headers.map(escapeCsvValue).join(',');
  const dataLines = rows.map(row =>
    headers.map(header => escapeCsvValue(row[header])).join(',')
  );
  return [headerLine, ...dataLines].join('\n');
}
```

### Edge Function: Account Deletion Pattern
```typescript
// supabase/functions/delete-account/index.ts
// Follows existing delete-student pattern
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// Verify requesting user's identity
const token = req.headers.get('authorization')?.replace('Bearer ', '');
const { data: { user } } = await supabaseAdmin.auth.getUser(token!);

// Check subscription status
const { data: subscription } = await supabaseAdmin
  .from('user_subscriptions')
  .select('status')
  .eq('user_id', user.id)
  .in('status', ['active', 'trialing'])
  .maybeSingle();

if (subscription) {
  return new Response(JSON.stringify({
    success: false,
    error: 'Please cancel your subscription before deleting your account'
  }), { status: 400 });
}

// If parent, delete student auth users first (cascade handles their data)
const { data: students } = await supabaseAdmin
  .from('parent_student_relationships')
  .select('student_user_id')
  .eq('parent_user_id', user.id);

for (const student of students || []) {
  await supabaseAdmin.auth.admin.deleteUser(student.student_user_id);
}

// Delete the parent auth user (cascade handles parent_profiles, etc.)
await supabaseAdmin.auth.admin.deleteUser(user.id);
```

### ESLint Configuration for Color Enforcement
```javascript
// eslint.config.js (flat config format for modern ESLint)
import reactNativePlugin from 'eslint-plugin-react-native';

export default [
  {
    plugins: { 'react-native': reactNativePlugin },
    rules: {
      'react-native/no-color-literals': 'error',
      'react-native/no-inline-styles': 'warn',
    },
  },
];
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `expo-file-system` function-based API | `expo-file-system` File/Directory class-based API | SDK 54 (2026) | Must use `new File()`, `new Directory()`, not `writeAsStringAsync()` |
| `expo-file-system/next` import path | `expo-file-system` (default) | SDK 54 | Old `/next` path was preview; now default. Legacy at `/legacy` |
| JSZip for ZIP creation | Server-side or react-native-zip-archive | N/A | JSZip never worked in RN; always needed native or server solution |
| `react-native-skeleton-placeholder` (linear-gradient dep) | `moti/skeleton` (reanimated-based) | ~2024 | Moti uses reanimated (already installed), avoids unmaintained linear-gradient chain |
| Static color imports | ThemeContext + useTheme hook | Standard practice | Required for dark mode support |
| `.eslintrc` config files | `eslint.config.js` flat config | ESLint 9+ | New flat config format is the standard |

**Deprecated/outdated:**
- `writeAsStringAsync` / `readAsStringAsync` from `expo-file-system` -- use `File.write()` / `File.text()` instead
- `FileSystem.documentDirectory` string constant -- use `Paths.document` or `Paths.cache`
- `react-native-skeleton-placeholder` -- pulls in unmaintained native dependencies

## Web App Color Reference

The web app and mobile app color scales already match perfectly:

### Scholar Blue (Primary)
| Shade | Web (tailwind.config.ts) | Mobile (colors.ts) | Match |
|-------|--------------------------|---------------------|-------|
| 500 | `#0ea5e9` | `#0ea5e9` | EXACT |
| 600 | `#0284c7` | `#0284c7` | EXACT |

### Financial Green (Secondary)
| Shade | Web (tailwind.config.ts) | Mobile (colors.ts) | Match |
|-------|--------------------------|---------------------|-------|
| 500 | `#22c55e` | `#22c55e` | EXACT |
| 600 | `#16a34a` | `#16a34a` | EXACT |

### CSS Variables (Light Theme)
| Web Variable | HSL Value | Hex Equivalent | Mobile Token |
|-------------|-----------|----------------|--------------|
| `--primary` | `198 100% 38%` | `#0078c2` (scholar blue area) | `colors.primary` (currently indigo -- needs decision) |
| `--secondary` | `142 72% 29%` | `#147a3e` (financial green area) | `colors.secondary` |
| `--destructive` | `0 84.2% 60.2%` | `#ef4444` | `colors.error` |
| `--border` | `214.3 31.8% 91.4%` | `#e2e8f0` | `colors.border` |

### Font Decision
**Finding:** The web app has NO custom font-family configured. It uses Tailwind's default font stack which resolves to system fonts (San Francisco on iOS, Roboto on Android). The mobile app's `typography.ts` already uses `System` font on iOS and `Roboto` on Android via `getFontFamily()`.

**Recommendation:** Do NOT add a custom font. The current system font usage is correct and matches the web app's visual feel. System fonts render faster (no loading) and feel native.

### Primary Color Discrepancy
**Important finding:** The mobile app currently uses `indigo[600]` (`#4F46E5`) as `colors.primary`, but the web app's `--primary` CSS variable maps to scholar blue (`198 100% 38%`). The existing theme has a comment "Current: transitioning to scholar" on the indigo scale.

**Recommendation for planner:** The theme migration should consider whether to switch primary from indigo to scholar blue to match the web app, or keep indigo. This is a visual design decision, not a technical one. Flag for user decision.

## Hardcoded Values Audit Summary

| File Category | Files | Hardcoded Color Count | Priority |
|---------------|-------|----------------------|----------|
| Tab screens | 7 (`dashboard`, `grades`, `behavior`, `earnings`, `learn`, `daily`, `settings`) | ~450 | HIGH -- most visible |
| Modal screens | 6 (`edit-profile`, `paywall`, `manage-subscription`, etc.) | ~120 | MEDIUM |
| Layout files | 3 (`_layout.tsx` files) | ~8 | HIGH -- affects all screens |
| Auth screens | 4 (`login`, `signup`, `forgot-password`, `verify-reset-code`) | ~45 | MEDIUM |
| Onboarding | 4 (`welcome`, `how-it-works`, `profile`, `celebration`) | ~37 | LOW -- seen once |

**Total:** ~660 hardcoded `backgroundColor: '#...'` or `color: '#...'` instances across 25 files.

## Database Tables for Export

Based on types.ts analysis, tables containing user-owned data (filtered by `user_id`):

| Table | Description | Export |
|-------|-------------|--------|
| `parent_profiles` | Parent profile data | YES |
| `student_profiles` | Student profile data | YES (if parent includes students) |
| `parent_student_relationships` | Parent-student links | YES |
| `behavior_assessments` | Daily behavior scores | YES |
| `behavior_assessments_complete` | Completed assessments | YES |
| `student_grades` | Grade records | YES |
| `question_of_day_results` | QOD answers | YES |
| `savings_goals` | Student savings goals | YES |
| `behavior_bonuses` | Behavior bonus records | YES |
| `family_meetings` | Meeting records | YES |
| `term_configs` | Term configuration | YES |
| `term_snapshots` | Term snapshot history | YES |
| `student_badges` | Achievement badges | YES |
| `user_subscriptions` | Subscription history | YES (status only, not payment IDs) |
| `users` | Core user record | YES |

**Exclude from export:** `admin_audit_log`, `admin_users`, `payment_audit_log`, `stripe_*`, `webhook_events`, `coaching_*`, `influencer_*`, `data_retention_*`

## Open Questions

1. **Primary color: indigo vs scholar blue**
   - What we know: Web app uses scholar blue as `--primary`; mobile currently uses indigo `#4F46E5`
   - What's unclear: Whether this is intentional brand differentiation or legacy
   - Recommendation: Ask user before migrating. The `_layout.tsx`, `app.json` splash screens all use `#4F46E5`

2. **Edge function deployment scope**
   - What we know: The mobile app currently only has `revenuecat-webhook` edge function deployed
   - What's unclear: Whether `delete-student` and `create-student` are deployed in this Supabase project or only in the web app's project
   - Recommendation: Confirm during planning whether shared Supabase project or separate

3. **commonStyles.ts refactoring for dark mode**
   - What we know: `commonStyles.ts` imports `colors` statically, making it incompatible with runtime theme switching
   - What's unclear: Whether to convert to a factory function `createCommonStyles(colors)` or use a hook `useCommonStyles()`
   - Recommendation: Convert to `createCommonStyles(colors: ThemeColors)` factory pattern for performance (avoids hook overhead)

4. **Moti New Architecture compatibility**
   - What we know: There is a known GitHub issue (#337) about Moti Skeleton with New Architecture
   - What's unclear: Whether this has been resolved in latest moti version
   - Recommendation: Test moti/skeleton early in implementation; `newArchEnabled: true` in app.json. If incompatible, fall back to hand-rolled reanimated shimmer.

## Sources

### Primary (HIGH confidence)
- Expo FileSystem documentation (SDK 54 new API) - File/Directory classes, Paths API
- Expo Sharing documentation - shareAsync API, platform support
- Moti Skeleton documentation - installation, props, Skeleton.Group API
- Supabase auth.admin.deleteUser documentation - parameters, service_role requirement
- Existing `delete-student/index.ts` edge function in web app - cascade deletion pattern
- Web app `tailwind.config.ts` - exact scholar/financial color scales
- Web app `index.css` - CSS custom properties for theme colors
- Mobile app `src/theme/` - existing theme system (colors, typography, spacing, commonStyles)
- Mobile app `src/integrations/supabase/types.ts` - database schema for export scope

### Secondary (MEDIUM confidence)
- eslint-plugin-react-native GitHub - no-color-literals rule documentation
- Expo blog post on SDK 54 file system upgrade
- React Native useColorScheme documentation - dark mode detection

### Tertiary (LOW confidence)
- Moti New Architecture compatibility status - issue #337 may or may not be resolved
- JSZip React Native incompatibility - confirmed by GitHub issue but workarounds may exist

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All recommended libraries are official Expo/well-established, versions verified against SDK 54
- Architecture: HIGH - Patterns follow existing codebase conventions (edge functions, React Query hooks, theme system)
- Data export: HIGH - expo-file-system + expo-sharing is the standard Expo approach; edge function pattern proven by existing delete-student
- Account deletion: HIGH - Directly follows existing delete-student edge function pattern with service_role auth.admin.deleteUser
- Design system: HIGH - Theme system already exists and is well-structured; work is migration not creation
- Skeleton screens: MEDIUM - Moti is well-established but New Architecture compatibility needs validation
- Dark mode: HIGH - Pattern is well-documented; existing colors.ts already has dark theme values
- ESLint enforcement: HIGH - eslint-plugin-react-native no-color-literals is an established solution
- Pitfalls: HIGH - Based on direct codebase analysis and official documentation

**Research date:** 2026-02-11
**Valid until:** 2026-03-11 (30 days - stable ecosystem)
