# Architecture

**Analysis Date:** 2026-02-05

## Pattern Overview

**Overall:** Layered client-server architecture with context-based state management and React Query data fetching.

**Key Characteristics:**
- React Native/Expo for cross-platform mobile (iOS/Android via Expo Go)
- Supabase for backend (PostgreSQL, RLS, auth, edge functions)
- TanStack React Query for server state management with optimistic updates
- React Context API for shared app state (Auth, StudentContext)
- File-based routing with Expo Router

## Layers

**Presentation Layer:**
- Purpose: UI screens and user interactions
- Location: `app/` directory with Expo Router file-based routing
- Contains: Tab-based navigation, auth flows, feature screens
- Depends on: Contexts (AuthContext, StudentContext), Hooks, Components
- Used by: Entry point is `app/_layout.tsx` (root layout)

**State Management Layer:**
- Purpose: Maintain application state (auth session, selected student, data caching)
- Location: `src/contexts/` for global state, `src/hooks/` for data queries
- Contains:
  - `AuthContext.tsx`: Auth state (user, session, loading)
  - `StudentContext.tsx`: Student selection state (selectedStudent, students list)
  - Query hooks: `useStudentGrades`, `useBehaviorAssessments`, `useEducationBonus`, etc.
- Depends on: Supabase client, React Query
- Used by: All screens and components

**Integration Layer:**
- Purpose: Communicate with backend services
- Location: `src/integrations/supabase/`
- Contains:
  - `client.ts`: Supabase client initialization with AsyncStorage session persistence
  - `types.ts`: Auto-generated database types
- Provides: Auth helpers (signUpWithEmail, signInWithEmail, signOut, getCurrentUser, ensureParentProfile), database queries via supabase object

**Shared Logic Layer:**
- Purpose: Reusable business logic and calculations
- Location: `src/shared/`
- Contains:
  - `calculations/`: Grade rewards, GPA, behavior scoring, allocation breakdown formulas
  - `types/`: Shared TypeScript interfaces (Grade, BehaviorAssessment, SavingsGoal, etc.)
  - `utils/`: Utility functions (grade conversion, student ID generation)
  - `validation/`: Input validation constants
- Used by: Hooks, screens, components

## Data Flow

**Authentication Flow:**
1. User lands on `app/index.tsx` → checks `AuthContext.loading` and `AuthContext.user`
2. If not authenticated, redirects to `app/(auth)/login` via `<Redirect>`
3. Login/signup screens call auth helpers from `src/integrations/supabase/client.ts`
4. `AuthProvider` (via `onAuthStateChange` listener) updates `AuthContext` with new user/session
5. Authenticated users redirect to `app/(tabs)/dashboard`

**Parent-Student Data Flow:**
1. Parent logs in → `AuthProvider` sets user in context
2. `StudentProvider` calls `useParentStudents()` hook
3. Hook queries `parent_student_relationships` then `student_profiles` tables
4. Populates `StudentContext` with students list and auto-selects first student
5. Child components use `useStudent()` to access `selectedStudent`
6. When viewing student data, query hooks receive `selectedStudent.user_id` and `selectedStudent.id` as parameters
7. Dashboard (`app/(tabs)/dashboard.tsx`) uses both IDs to fetch grades and assessments keyed by `student_user_id`

**Data Fetching and Caching:**
- Query Client initialized in `app/_layout.tsx` with staleTime: 5 minutes for default, 2 minutes for most data queries
- React Query automatically handles:
  - Caching by query keys (e.g., `['studentGrades', 'list', userId]`)
  - Background refetching on focus
  - Stale-while-revalidate pattern
- Screens use pull-to-refresh via `RefreshControl` to manually trigger refetch
- Example: Dashboard calls `refetchGrades()`, `refetchBehavior()`, etc. in parallel during refresh

**State Management:**
- Global auth state: `AuthContext` (user, session, loading)
- Global app state: `StudentContext` (selectedStudent, students, isParentView)
- Server state: React Query (queries and mutations)
- UI state: Local component state (modals, pickers, loading flags)

## Key Abstractions

**AuthContext:**
- Purpose: Manages auth state across entire app
- Location: `src/contexts/AuthContext.tsx`
- Pattern: Context provider with custom hook `useAuth()`
- Initializes on mount with `supabase.auth.getSession()`
- Listens to `onAuthStateChange` for real-time auth events
- Provides: `{ user, session, loading }`

**StudentContext:**
- Purpose: Manages which student's data is being viewed
- Location: `src/contexts/StudentContext.tsx`
- Pattern: Context provider with custom hook `useStudent()`
- Dependencies: Consumes `useAuth()` and `useParentStudents()`
- Auto-selects first student when list loads
- Determines `isParentView` based on `hasStudents`
- Provides: `{ selectedStudent, setSelectedStudent, students, isLoading, hasStudents, isParentView }`

**Query Hooks (React Query):**
- Purpose: Encapsulate server state queries and mutations
- Pattern: Each hook manages one data domain (grades, assessments, bonuses, etc.)
- Examples: `useStudentGrades`, `useBehaviorAssessments`, `useBehaviorBonus`, `useEducationBonus`
- Always accept optional `userId` parameter (falls back to `useAuth().user.id`)
- Return: data arrays, loading/error states, refetch function, mutation functions
- Location: `src/hooks/`

**Calculation Functions:**
- Purpose: Pure functions for financial and academic calculations
- Location: `src/shared/calculations/`
- Examples:
  - `calculateGradeReward()`: Grade letter → reward amount
  - `calculateGPA()`: GradeEntry[] → GPA
  - `calculateAllocation()`: Total reward → { taxes, retirement, savings, discretionary }
  - `calculateOverallAverageScore()`: BehaviorAssessment[] → average
- No side effects, deterministic

## Entry Points

**Root Layout:**
- Location: `app/_layout.tsx`
- Triggers: App startup
- Responsibilities:
  - Initialize QueryClient with default staleTime
  - Wrap with QueryClientProvider, AuthProvider, StudentProvider
  - Define Stack navigator structure
  - Configure header styles

**Splash/Auth Router:**
- Location: `app/index.tsx`
- Triggers: After RootLayout loads
- Responsibilities:
  - Check auth loading state
  - Show loading spinner while initializing
  - Redirect to `/(auth)/login` if unauthenticated
  - Redirect to `/(tabs)/dashboard` if authenticated

**Auth Stack:**
- Location: `app/(auth)/_layout.tsx`, `app/(auth)/login.tsx`, `app/(auth)/signup.tsx`
- Triggers: User not authenticated
- Responsibilities:
  - Login form: email/password → `signInWithEmail()`
  - Signup form: email/password/name → `signUpWithEmail()` → `ensureParentProfile()` fallback
  - Handle auth errors
  - Redirect to dashboard on success

**Tabs Navigator:**
- Location: `app/(tabs)/_layout.tsx`
- Triggers: User authenticated
- Structure: Dashboard, Grades, Behavior, Learn, Earnings, Settings tabs
- Each tab: `app/(tabs)/{tabname}.tsx`
- Responsibilities: Navigation between feature areas

**Feature Screens:**
- Locations: `app/(tabs)/dashboard.tsx`, `app/student-management.tsx`, `app/grade-approval.tsx`, etc.
- Triggers: Tab/screen navigation
- Responsibilities:
  - Fetch data via hooks
  - Display UI
  - Handle user interactions
  - Trigger mutations/refetches

## Error Handling

**Strategy:** Try-catch in async functions, error states in React Query, console.error logging.

**Patterns:**
- Auth errors: Caught in signup/login screens, displayed to user
- Query errors: Stored in `error` state from useQuery, displayed conditionally
- Mutation errors: Caught in `.mutateAsync()` calls
- Fallback for RLS INSERT/SELECT issue: Separate INSERT from SELECT in `ensureParentProfile()`
- No global error boundary currently; errors logged to console

## Cross-Cutting Concerns

**Logging:**
- Strategy: `console.error()` and `console.log()` for debugging
- Locations: Auth flow, data fetching, error scenarios
- No structured logging service

**Validation:**
- Strategy: Zod for form input validation (in signup/login forms)
- Locations: `src/shared/validation/`
- Uses: `@hookform/resolvers` for React Hook Form integration

**Authentication:**
- Strategy: Supabase Auth with JWT tokens stored in AsyncStorage
- RLS policies on database tables enforce row-level security
- Parent accounts created with `user_type: 'parent'` metadata
- Students created via `create-student` edge function or direct table inserts
- Parent-student relationships tracked in `parent_student_relationships` table

**Parent-Managed Students:**
- Student created with generated `student_user_id` (UUID)
- Parent's `user_id` linked in `parent_student_relationships`
- Student data queried by `student_user_id`, not auth user ID
- Enables viewing multiple students' data from single parent account

---

*Architecture analysis: 2026-02-05*
