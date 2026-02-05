# Testing Patterns

**Analysis Date:** 2026-02-05

## Test Framework

**Status:** No testing framework configured

The project currently has:
- No test runner installed (Jest, Vitest, etc. not in `package.json`)
- No test files found in codebase (no `*.test.*` or `*.spec.*` files)
- No testing configuration (`jest.config.js`, `vitest.config.ts`, etc.)

**Package.json Dependencies:**
- `@tanstack/react-query`: ^5.90.11 - Data fetching library with built-in testing utilities
- `react-hook-form`: ^7.67.0 - Form library (testable with form testing libraries)
- `zod`: ^4.1.13 - Validation schema library (easily testable)

## Expected Test Structure (When Implemented)

Based on codebase architecture, testing should follow this structure:

**Location:**
- Co-located with implementations (e.g., `src/hooks/__tests__/useParentStudents.test.ts`)
- Or in `tests/` directory mirroring `src/` structure
- Screen/component tests in `app/__tests__/`

**Naming:**
- `[filename].test.ts` for hook tests
- `[filename].test.tsx` for component tests
- Test suites describe the module being tested

**Directory Pattern:**
```
src/
├── hooks/
│   ├── useParentStudents.ts
│   └── __tests__/
│       └── useParentStudents.test.ts
├── shared/
│   ├── calculations/
│   │   ├── gradeCalculations.ts
│   │   └── __tests__/
│       └── gradeCalculations.test.ts
└── contexts/
    ├── AuthContext.tsx
    └── __tests__/
        └── AuthContext.test.tsx
```

## What Should Be Tested (Recommended)

Based on code analysis, these areas are prime candidates for testing:

### 1. Calculation Functions
**Location:** `src/shared/calculations/`
- `calculateGradeReward()` - Pure function, deterministic
- `calculateGPA()` - Pure function, math-based
- `calculateAssessmentAverageScore()` - Pure function
- `calculateOverallAverageScore()` - Pure function
- `calculateAllocation()` - Complex business logic

**Test Pattern (Recommended):**
```typescript
describe('calculateGradeReward', () => {
  it('should return 0 for invalid grade entry', () => {
    const result = calculateGradeReward({ baseAmount: 0 } as GradeEntry);
    expect(result).toBe(0);
  });

  it('should apply correct multiplier for grade A', () => {
    const result = calculateGradeReward({
      grade: 'A',
      baseAmount: 100,
    } as GradeEntry);
    expect(result).toBe(100 * 1.0); // A is 1.0x multiplier
  });

  it('should handle edge case: negative base amount', () => {
    const result = calculateGradeReward({
      grade: 'B',
      baseAmount: -50,
    } as GradeEntry);
    expect(result).toBe(0); // Should return 0, not throw
  });
});
```

### 2. Hook Behavior
**Location:** `src/hooks/`
- Query key factories generate consistent keys
- Mutation onSuccess invalidates correct cache
- Enabled state respects dependencies (user ID, student ID)

**Test Pattern (Recommended with React Testing Library):**
```typescript
describe('useParentStudents', () => {
  it('should fetch students when user is authenticated', async () => {
    const { result } = renderHook(() => useParentStudents(), {
      wrapper: TestProviders,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.students).toHaveLength(expectedCount);
  });

  it('should not fetch when user is null', () => {
    // Mock useAuth to return null
    const { result } = renderHook(() => useParentStudents(), {
      wrapper: TestProviders,
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.students).toEqual([]);
  });
});
```

### 3. Error Handling
**Location:** Various - async boundaries
- Supabase errors are caught and logged
- User-facing Alert messages are appropriate
- Custom error classes (e.g., `StudentCreationError`) preserve error context

**Test Pattern (Recommended):**
```typescript
describe('Error handling', () => {
  it('should catch and log Supabase errors', async () => {
    const consoleSpy = jest.spyOn(console, 'error');

    // Mock supabase to throw error
    jest.mock('../integrations/supabase/client', () => ({
      supabase: {
        from: () => ({
          select: () => ({ throwError: true }),
        }),
      },
    }));

    // Expect error to be logged
    expect(consoleSpy).toHaveBeenCalledWith(
      'Error fetching parent students:',
      expect.any(Error)
    );
  });

  it('should provide user-friendly error messages', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    // Trigger error in signup
    expect(alertSpy).toHaveBeenCalledWith(
      'Signup Failed',
      expect.any(String)
    );
  });
});
```

### 4. Type Validation
**Location:** `src/shared/types/index.ts` and `src/shared/validation/`
- Type guards for discriminated unions (e.g., `BehaviorAssessmentStatus`)
- Validation constants enforce business rules

**Test Pattern (Recommended with Zod):**
```typescript
describe('Type validation', () => {
  it('should validate grade values', () => {
    const validGrades: Grade[] = ['A', 'B', 'C', 'D', 'F'];
    validGrades.forEach(grade => {
      expect(VALID_GRADES).toContain(grade);
    });
  });

  it('should reject invalid grades', () => {
    const invalidGrade = 'G' as any;
    expect(VALID_GRADES.includes(invalidGrade)).toBe(false);
  });

  it('should enforce behavior score range', () => {
    const config = BEHAVIOR_SCORE_CONFIG;
    expect(config.MIN).toBe(1);
    expect(config.MAX).toBe(5);
    // Validation ensures scores 1-5 only
  });
});
```

### 5. Context & Provider Logic
**Location:** `src/contexts/`
- `AuthProvider` initializes session correctly
- `StudentProvider` auto-selects first student
- Custom hooks throw error outside provider

**Test Pattern (Recommended):**
```typescript
describe('StudentProvider', () => {
  it('should auto-select first student when loaded', async () => {
    const { result } = renderHook(() => useStudent(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={testQueryClient}>
          <AuthProvider>
            <StudentProvider>{children}</StudentProvider>
          </AuthProvider>
        </QueryClientProvider>
      ),
    });

    await waitFor(() => {
      expect(result.current.selectedStudent).toBeTruthy();
      expect(result.current.selectedStudent?.id).toBe('first-student-id');
    });
  });
});
```

## Manual Testing Practices

Since automated tests aren't configured, the following manual testing patterns are observed:

**Browser/Console Logging:**
- Calculation results logged in `gradeCalculations.ts`: `console.log('Grade A with base $100 = $100.00 reward')`
- Error context logged at async boundaries

**Validation During Form Input:**
- Input validation before submission in `signup.tsx`
- Password confirmation check before attempting signup
- Email format validation by HTML input type="email"

**State Inspection:**
- Loading states (`isLoading`, `isPending`) prevent double-clicks
- Error objects available in hook returns for UI display
- Query stale times (2-5 minutes) tested by manual refresh

## Recommended Testing Setup

When implementing tests, use:

**Test Runner:** Jest or Vitest
```json
{
  "devDependencies": {
    "vitest": "^latest",
    "@testing-library/react": "^14.0.0",
    "@testing-library/react-native": "^12.0.0"
  }
}
```

**Config File:** `vitest.config.ts`
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'react-native',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.d.ts', 'src/**/*.test.{ts,tsx}'],
    },
  },
});
```

**Test Commands:**
```bash
npm run test              # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # Generate coverage report
```

## Coverage Goals (Not Currently Enforced)

Recommended targets:

**High Priority (80%+):**
- `src/shared/calculations/` - Pure functions, high-impact business logic
- `src/shared/validation/` - Validates all user input rules
- Error handling paths in hooks

**Medium Priority (60%+):**
- Hook data fetching and cache management
- Context providers and custom hooks
- Form submission logic

**Lower Priority (40%+):**
- UI component rendering (covered by manual testing)
- Navigation flows (tested manually)
- Styling and layout

## Mocking Strategy

**What to Mock:**
- Supabase client (`src/integrations/supabase/client.ts`)
- React Query in unit tests (use `@testing-library/react-query`)
- Async storage in hook tests

**What NOT to Mock:**
- Pure calculation functions (test directly)
- Type definitions and constants
- Validation logic (test with real validators)

**Supabase Mock Example:**
```typescript
jest.mock('../integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: mockStudents,
          error: null,
        }),
      }),
    })),
    auth: {
      getSession: jest.fn().mockResolvedValue({
        data: { session: mockSession },
      }),
    },
  },
}));
```

---

*Testing analysis: 2026-02-05*
