# Codebase Structure

**Analysis Date:** 2026-02-05

## Directory Layout

```
centsible-scholar-mobile/
├── app/                          # Expo Router file-based routing
│   ├── index.tsx                 # Root splash/auth router
│   ├── _layout.tsx               # Root layout (providers)
│   ├── (auth)/                   # Auth group (login/signup)
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   └── signup.tsx
│   ├── (tabs)/                   # Main app tabs group
│   │   ├── _layout.tsx
│   │   ├── dashboard.tsx
│   │   ├── grades.tsx
│   │   ├── behavior.tsx
│   │   ├── learn.tsx
│   │   ├── earnings.tsx
│   │   └── settings.tsx
│   ├── edit-profile.tsx          # Modal screens
│   ├── student-management.tsx
│   ├── grade-approval.tsx
│   ├── family-meetings.tsx
│   └── term-tracking.tsx
├── src/                          # Application source code
│   ├── contexts/                 # Global state contexts
│   │   ├── AuthContext.tsx
│   │   └── StudentContext.tsx
│   ├── hooks/                    # React Query hooks for data fetching
│   │   ├── useParentStudents.ts
│   │   ├── useStudentGrades.ts
│   │   ├── useBehaviorAssessments.ts
│   │   ├── useEducationBonus.ts
│   │   ├── useBehaviorBonus.ts
│   │   ├── useStudentManagement.ts
│   │   ├── useStudentProfile.ts
│   │   ├── useUserProfile.ts
│   │   ├── useSavingsGoals.ts
│   │   ├── useTermTracking.ts
│   │   ├── useFamilyMeetings.ts
│   │   ├── useGradeApproval.ts
│   │   ├── useQuestionOfTheDay.ts
│   │   ├── useSubscriptionStatus.ts
│   │   ├── useNotifications.ts
│   │   └── [more hooks]
│   ├── integrations/             # External service clients
│   │   └── supabase/
│   │       ├── client.ts         # Supabase client + auth helpers
│   │       └── types.ts          # Auto-generated DB types
│   ├── shared/                   # Shared across features
│   │   ├── calculations/
│   │   │   ├── index.ts
│   │   │   ├── constants.ts
│   │   │   ├── gradeCalculations.ts
│   │   │   ├── behaviorCalculations.ts
│   │   │   └── allocationCalculations.ts
│   │   ├── types/
│   │   │   └── index.ts          # Shared TypeScript interfaces
│   │   ├── utils/
│   │   │   ├── gradeConversion.ts
│   │   │   └── studentIds.ts
│   │   └── validation/
│   │       └── constants.ts
│   ├── components/               # Reusable UI components
│   │   ├── forms/                # Form components
│   │   └── ui/                   # Generic UI components
│   ├── services/                 # Utility services
│   │   └── notifications.ts
│   ├── theme/                    # Design system
│   │   ├── index.ts
│   │   ├── colors.ts
│   │   ├── typography.ts
│   │   ├── spacing.ts
│   │   └── commonStyles.ts
│   ├── data/                     # Static data
│   │   └── questionBank.ts
│   └── lib/                      # Generic utilities
├── supabase/                     # Supabase migrations and functions
│   └── migrations/
├── assets/                       # Images, icons
├── ios/                          # iOS native build (Xcode)
├── android/                      # Android native build
├── package.json                  # Node dependencies
├── tsconfig.json                 # TypeScript config with path aliases
├── app.json                      # Expo config
├── babel.config.js               # Babel config
├── metro.config.js               # Metro bundler config
└── expo-env.d.ts                 # Expo environment types
```

## Directory Purposes

**app/ - Expo Router Routes:**
- Purpose: File-based routing structure (maps directly to URL/screen navigation)
- Contains: Screen components organized by route groups
- Key files: `_layout.tsx` defines navigation structure, regular `.tsx` files are screens
- Special: `(auth)` and `(tabs)` are route groups (parentheses don't appear in URLs)

**src/contexts/ - Global State:**
- Purpose: App-wide state management using React Context API
- Contains: `AuthContext` (user/session), `StudentContext` (student selection)
- Pattern: Provider component + custom hook for consumption
- Initialization: Providers wrapped in `app/_layout.tsx`

**src/hooks/ - Data Fetching:**
- Purpose: React Query hooks encapsulating server state
- Contains: Custom hooks for each data domain (grades, assessments, bonuses, notifications, etc.)
- Pattern: Each hook manages queries, mutations, caching for one domain
- Key: All hooks use userId parameter (falls back to auth user) for flexibility

**src/integrations/supabase/ - Backend Integration:**
- Purpose: Supabase client and helpers
- Contains:
  - `client.ts`: Client initialization, auth functions (signUpWithEmail, signInWithEmail, signOut, ensureParentProfile)
  - `types.ts`: TypeScript types for database schema (auto-generated from Supabase)

**src/shared/calculations/ - Business Logic:**
- Purpose: Pure functions for calculations (no side effects)
- Contains:
  - Grade → reward calculations
  - GPA calculations
  - Behavior scoring and averaging
  - Allocation breakdown (taxes, retirement, savings, discretionary)
- Pattern: Deterministic functions exported as module

**src/shared/types/ - Type Definitions:**
- Purpose: Shared TypeScript interfaces used across app
- Contains: Grade, BehaviorAssessment, SavingsGoal, TermConfig, AllocationBreakdown, etc.
- Usage: Imported by hooks, contexts, screens, components

**src/shared/utils/ - Utility Functions:**
- Purpose: Helper functions (grade conversion, ID generation)
- Contains: Grade letter → number conversion, student_user_id generation patterns

**src/shared/validation/ - Input Validation:**
- Purpose: Validation rules and constants
- Used by: Forms with React Hook Form + Zod resolver

**src/components/ - Reusable UI:**
- Purpose: Reusable React components (forms, buttons, cards, etc.)
- Structure: `forms/` for form inputs, `ui/` for generic UI components
- Note: Most screens are monolithic (all styling inline); minimal component reuse currently

**src/services/ - Utility Services:**
- Purpose: Non-Supabase services (notifications, logging, etc.)
- Contains: `notifications.ts` for push notifications setup

**src/theme/ - Design System:**
- Purpose: Centralized styling, colors, typography
- Contains:
  - `colors.ts`: Color palette
  - `typography.ts`: Font sizes, weights
  - `spacing.ts`: Margin/padding scales
  - `commonStyles.ts`: Shared StyleSheet definitions

**src/data/ - Static Data:**
- Purpose: Hardcoded data (question banks, constants)
- Contains: `questionBank.ts` for Question of the Day data

**supabase/ - Backend Infrastructure:**
- Purpose: Database migrations and Supabase config
- Contains: SQL migrations for schema, edge functions
- Trigger: `handle_new_user` creates parent_profiles on signup

## Key File Locations

**Entry Points:**
- `app/index.tsx`: Initial route check (auth state) → redirect to login or dashboard
- `app/_layout.tsx`: Root layout wrapping entire app with providers (QueryClientProvider, AuthProvider, StudentProvider)
- `app/(auth)/login.tsx`: Login screen with email/password form
- `app/(auth)/signup.tsx`: Signup screen with email/password/name form

**Core State:**
- `src/contexts/AuthContext.tsx`: Auth user and session state
- `src/contexts/StudentContext.tsx`: Selected student and parent-managed students list
- `app/_layout.tsx`: QueryClient configuration (staleTime, retry logic)

**Key Data Fetching:**
- `src/hooks/useParentStudents.ts`: Fetch parent's managed students
- `src/hooks/useStudentGrades.ts`: Fetch grades for a student
- `src/hooks/useBehaviorAssessments.ts`: Fetch behavior assessments
- `src/hooks/useEducationBonus.ts`: Calculate education bonus
- `src/hooks/useBehaviorBonus.ts`: Calculate behavior bonus

**Authentication & Integration:**
- `src/integrations/supabase/client.ts`: Supabase client, auth helpers (signUpWithEmail, signInWithEmail, signOut)
- `src/integrations/supabase/types.ts`: Database schema types

**Calculations:**
- `src/shared/calculations/gradeCalculations.ts`: Grade rewards, GPA
- `src/shared/calculations/behaviorCalculations.ts`: Behavior scoring
- `src/shared/calculations/allocationCalculations.ts`: Reward allocation breakdown

**Screens:**
- `app/(tabs)/dashboard.tsx`: Main dashboard with grades, behavior, bonuses, allocation
- `app/(tabs)/grades.tsx`: Manage and view grades
- `app/(tabs)/behavior.tsx`: Daily behavior assessments
- `app/(tabs)/learn.tsx`: Question of the Day
- `app/(tabs)/earnings.tsx`: View earnings history and bonuses
- `app/(tabs)/settings.tsx`: Account settings, profile, logout
- `app/student-management.tsx`: Parent view to add/manage students
- `app/grade-approval.tsx`: Parent approves student grades
- `app/edit-profile.tsx`: Edit user profile (modal)
- `app/term-tracking.tsx`: View term summaries and snapshots

## Naming Conventions

**Files:**
- Screens: kebab-case `(login.tsx, dashboard.tsx, student-management.tsx)`
- Hooks: camelCase with `use` prefix `(useStudentGrades.ts, useBehaviorAssessments.ts)`
- Components: PascalCase `(if any exist in src/components/)`
- Types/types: index.ts barrel export or domain-specific `.ts` files
- Utils: kebab-case or camelCase for function names `(gradeConversion.ts)`

**Directories:**
- Feature areas: lowercase `(hooks/, services/, integrations/)`
- Route groups: parentheses `((auth), (tabs))`
- Index files: `index.ts` for barrel exports (calculations, theme)

**Exports:**
- Contexts: Named exports for Provider and hook (AuthProvider, useAuth)
- Hooks: Named exports for hook function (useParentStudents)
- Calculations: Named exports for each function (calculateGPA, calculateAllocation)
- Types: Named exports for interfaces (Grade, BehaviorAssessment)

## Where to Add New Code

**New Feature (e.g., "Savings Goals"):**
- Hook for data: `src/hooks/useSavingsGoals.ts` (useQuery, useMutation)
- Calculations: `src/shared/calculations/savingsCalculations.ts` if needed
- Screens: `app/(tabs)/savings.tsx` or `app/savings-detail.tsx`
- Tab entry: Add to `app/(tabs)/_layout.tsx` Tabs.Screen
- Types: Add to `src/shared/types/index.ts`

**New Screen (non-tab):**
- Location: `app/{screenName}.tsx` at root app level
- Register: Add to `app/_layout.tsx` Stack.Screen
- Navigation: Use `router.push()` or Link from screens

**Utility/Helper Function:**
- Shared calculation: `src/shared/calculations/{domain}Calculations.ts`
- Shared utility: `src/shared/utils/{domain}.ts`
- Service: `src/services/{domain}.ts`
- Export via: `src/shared/utils/index.ts` or `src/shared/calculations/index.ts`

**Reusable Component:**
- Form component: `src/components/forms/{ComponentName}.tsx`
- UI component: `src/components/ui/{ComponentName}.tsx`
- Most components currently live inline in screens; refactor if reused 2+ times

**New Query Hook:**
- Location: `src/hooks/use{Domain}{Action}.ts` (e.g., useSavingsGoalsCreate.ts)
- Pattern:
  ```typescript
  import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
  import { useAuth } from '../contexts/AuthContext';

  export const domainKeys = { all: ['domain'], list: (id: string) => [...domainKeys.all, 'list', id] };

  async function fetchDomain(userId: string) { /* query */ }

  export function useDomain(userId?: string) {
    const { user } = useAuth();
    const targetId = userId || user?.id || '';
    const { data, isLoading, refetch } = useQuery({ queryKey: domainKeys.list(targetId), ... });
    return { data, isLoading, refetch };
  }
  ```

## Special Directories

**dist/ - Build Output:**
- Purpose: Generated static assets for web/Expo build
- Generated: Yes (by Expo build)
- Committed: No

**ios/ and android/ - Native Code:**
- Purpose: Native app configuration and build
- Contains: Xcode project, gradle config, native plugins
- Committed: Yes (for EAS builds)

**.expo/ - Expo Cache:**
- Purpose: Local Expo development cache
- Generated: Yes (by `expo start`)
- Committed: No

**supabase/migrations/ - Database Schema:**
- Purpose: Database migrations (SQL)
- Committed: Yes
- Pattern: Numbered `.sql` files for schema changes

**assets/ - Static Resources:**
- Purpose: App icons, splash screens, images
- Key files: `icon.png`, `splash-icon.png`, `adaptive-icon.png`
- Committed: Yes

---

*Structure analysis: 2026-02-05*
