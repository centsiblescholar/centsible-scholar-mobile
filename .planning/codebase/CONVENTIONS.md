# Coding Conventions

**Analysis Date:** 2026-02-05

## Naming Patterns

**Files:**
- Hooks: `use[Feature].ts` (e.g., `useParentStudents.ts`, `useBehaviorAssessments.ts`)
- Components: `[FeatureName].tsx` (e.g., `signup.tsx`, `dashboard.tsx`)
- Contexts: `[Name]Context.tsx` (e.g., `AuthContext.tsx`, `StudentContext.tsx`)
- Utilities/Calculations: descriptive names (e.g., `gradeCalculations.ts`, `studentIds.ts`)
- Type definition files: `index.ts` or `types.ts` (e.g., `src/shared/types/index.ts`)

**Functions:**
- camelCase for all functions (e.g., `fetchParentStudents`, `calculateGradeReward`, `handleSignup`)
- Async functions follow same convention with `Async` suffix optional but descriptive (e.g., `fetchUserProfile`, `saveAssessment`)
- Factory/helper functions in hooks prefixed with their purpose (e.g., `fetch*`, `create*`, `update*`, `deactivate*`)
- Event handlers prefixed with `handle` or `on` (e.g., `handleSignup`, `onRefresh`)

**Variables:**
- camelCase for variables and parameters (e.g., `selectedStudent`, `baseRewardAmount`, `isLoading`)
- Boolean variables/states prefixed with `is`, `has`, or `can` (e.g., `isLoading`, `hasStudents`, `isParentView`)
- Constants in UPPERCASE_SNAKE_CASE (e.g., `STORAGE_KEY`, `GOAL_COLORS`, `MAX_BASE_AMOUNT`)
- useState values: `[value, setValue]` (e.g., `[firstName, setFirstName]`, `[goals, setGoals]`)

**Types:**
- PascalCase for interfaces and types (e.g., `StudentInfo`, `BehaviorAssessment`, `GradeEntry`)
- Union types with pipe-separated string literals (e.g., `'draft' | 'submitted' | 'approved'`)
- Generic type suffixes (e.g., `Input` for input types, `Profile` for profile types)
- Interfaces for object shapes, type aliases for unions and primitives

## Code Style

**Formatting:**
- No formatter configured (ESLint/Prettier not in use)
- Use standard indentation (2-4 spaces observed in components, 2 spaces in most code)
- Line length varies, no apparent limit enforced

**Linting:**
- No linting configuration found in repo (no `.eslintrc`, `biome.json`, etc.)
- Code follows React/TypeScript best practices by convention

## Import Organization

**Order:**
1. React/React Native imports from official packages
2. External third-party libraries (e.g., `expo-router`, `@supabase/supabase-js`)
3. Hook/context/utility imports from local `src/` paths
4. Relative imports as fallback

**Pattern:**
```typescript
import { useState, useCallback } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';
import { BehaviorAssessment } from '../shared/types';
import { calculateGPA } from '../shared/calculations';
```

**Path Aliases:**
- `@/*` → `src/*` (defined in `tsconfig.json`)
- `@/shared/*` → `src/shared/*`
- Use full paths from app root in components (e.g., `../../src/contexts/AuthContext`)

## Error Handling

**Patterns:**
- Try-catch with finally blocks for cleanup (see `useStudentManagement.ts`, `signup.tsx`)
- Errors logged with `console.error()` including context message
- User-facing errors shown via `Alert.alert()` in screens
- Custom error classes for domain-specific errors (e.g., `StudentCreationError` extends `Error`)
- Graceful fallbacks when queries fail (return `null` or `[]`)

**Example Pattern:**
```typescript
try {
  const data = await someAsyncOperation();
  // Handle success
} catch (error: any) {
  console.error('Context: specific error message:', error);
  // User-facing error handling
  Alert.alert('Title', error.message || 'Generic message');
} finally {
  setLoading(false);
}
```

**Supabase Error Handling:**
- Check `error` property from destructured response
- Special handling for specific error codes (e.g., `error.code === 'PGRST116'` for not found)
- Throw errors to propagate to component-level catch blocks

## Logging

**Framework:** console (no dedicated logging library)

**Patterns:**
- Validation warnings: `console.warn()` (e.g., invalid inputs to calculation functions)
- Operation errors: `console.error()` with descriptive context message
- Debug info: `console.log()` in calculations showing input/output (see `gradeCalculations.ts`)
- Log at async boundaries where errors are likely (fetch, mutations, auth)

**Example:**
```typescript
console.error('Error fetching parent students:', relError);
console.warn('Invalid grade entry provided to calculateGradeReward');
console.log(`Grade ${grade} with base $${baseAmount} = $${reward.toFixed(2)} reward`);
```

## Comments

**When to Comment:**
- Document parameters and return values in JSDoc blocks
- Explain non-obvious business logic or constraints
- Mark workarounds or temporary solutions
- Document important side effects and dependencies

**JSDoc/TSDoc:**
- Used for function parameter and return documentation
- Example format: `@param studentUserId - Description`
- Seen in hooks and utility functions (e.g., `fetchStudentGrades`)

**Pattern:**
```typescript
/**
 * Fetches grades for a student.
 *
 * @param studentUserId - The student's user_id from student_profiles.user_id
 * @param profileId - The student's profile record ID (fallback for dashboard_grades)
 */
async function fetchStudentGrades(
  studentUserId: string,
  profileId?: string
): Promise<StudentGrade[]>
```

## Function Design

**Size:** Small focused functions with single responsibility
- Fetch functions separated from mutation functions
- Business logic extracted to `src/shared/calculations/` module
- Hooks return focused object with related data and methods

**Parameters:**
- Pass objects with specific shapes rather than multiple parameters
- Use TypeScript interfaces for parameter shapes (e.g., `CreateStudentInput`)
- Optional parameters indicated with `?` in interface

**Return Values:**
- Hooks return object with: `{ data, isLoading, error, refetch, mutationFn, isMutating }`
- Fetch functions return typed data or throw errors
- Mutation functions return type-safe results or throw custom errors

## Module Design

**Exports:**
- Named exports for functions and types (not default exports)
- Barrel exports in `index.ts` files (e.g., `src/shared/calculations/index.ts`)
- Context providers export both the provider component and custom hook

**Barrel Files:**
Used extensively for organization:
- `src/shared/calculations/index.ts` exports all calculation functions
- `src/shared/types/index.ts` exports all shared type definitions
- Re-exports allow `import { calculateGPA } from '../shared/calculations'`

**Pattern:**
```typescript
// In index.ts
export * from './constants';
export * from './gradeCalculations';
export * from './behaviorCalculations';
export * from './allocationCalculations';

// Usage
import { calculateGPA, GRADE_MULTIPLIERS } from '../shared/calculations';
```

## React Patterns

**Hooks:**
- Use `useQuery` with `queryKey` factories for data fetching
- Use `useMutation` with `useQueryClient.invalidateQueries()` for cache management
- Custom hooks return object with data, loading, error, and action methods
- Query keys structured with factory functions for consistency

**Context:**
- Throw error if used outside provider: `throw new Error('Hook must be used within Provider')`
- Providers initialize state and manage lifecycle
- Custom hook wrapper (e.g., `useAuth()`) validates context exists

**Components:**
- Functional components only
- Extract business logic to hooks
- Use `ScrollView` with `refreshControl` for pull-to-refresh
- Input validation before async operations

## TypeScript

**Config:** `tsconfig.json` with `strict: true` enabled
- Strict null checks enforced
- Path aliases configured (`@/*`, `@/shared/*`)

**Types:**
- Export types alongside implementations
- Use `as const` for literal type assertions when needed
- Non-null assertion `!` used judiciously (e.g., `user!.id` when enabled state guarantees it)

---

*Convention analysis: 2026-02-05*
