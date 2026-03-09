# Centsible Scholar Mobile - Project Instructions

## Database Rules (CRITICAL)

1. **NEVER invent database tables or columns.** Before writing code that queries a table, verify it exists by running:
   ```sql
   SELECT column_name, data_type FROM information_schema.columns
   WHERE table_schema = 'public' AND table_name = '<table_name>';
   ```

2. **NEVER use `as any` to bypass Supabase type errors.** If TypeScript says a table doesn't exist in the types, it probably doesn't exist in the database. Verify before proceeding.

3. **NEVER write code that depends on a future migration.** If a table doesn't exist yet, either create it first via `apply_migration`, or don't write code that references it. No "pre-migration compatibility" hacks.

4. **Always check the real Supabase schema** (project ID: `uvsqsslrhftzfaqxsthx`) before modifying any hook or query. The source of truth is the live database, not planning docs or TODO lists.

5. **RLS policies matter.** Before adding a new query, check what RLS policies exist on the table. A query that works for one user role may fail for another.

## ID Semantics (VERIFIED)

- `student_profiles.user_id` = the **student's** auth user ID (NOT the parent's)
- `student_profiles.id` = profile record PK (UUID, different from user_id)
- `parent_student_relationships` links `parent_user_id` -> `student_user_id`
- `selectedStudent.user_id` from `useParentStudents` = student's auth user ID
- `selectedStudent.id` = student_profiles.id (profile PK)

## Architecture

- Expo SDK 54 managed workflow (no native ios/android dirs)
- EAS Build for cloud compilation
- Supabase backend with RLS
- TanStack React Query for all data hooks
- Expo Router with `(auth)` and `(tabs)` groups

## Conventions

- All data hooks should use `useQuery`/`useMutation` from React Query
- Never use AsyncStorage for data that should persist server-side
- Query by `student_user_id` or `user_id` consistently (not `student_id` unless it's a FK to `student_profiles.id`)
