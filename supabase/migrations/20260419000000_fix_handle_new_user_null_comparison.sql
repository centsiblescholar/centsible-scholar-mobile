-- Fix: handle_new_user trigger silently skipped profile creation for all
-- Apple/Google sign-ups due to a NULL-comparison bug.
--
-- Root cause:
--   The original function used `v_role != 'student'`. When `v_role` is NULL
--   (the normal case for social sign-ups — Apple/Google don't set a `role`
--   field), this expression evaluates to NULL, not TRUE. Then
--   `v_user_type IS NULL AND NULL` = NULL, and `IF NULL THEN ...` does NOT
--   execute. Result: v_user_type stayed NULL, neither the parent_profiles
--   nor student_profiles INSERT ran, the user landed in auth.users with no
--   profile, and downstream role resolution failed with "missing role
--   information".
--
-- Fix:
--   Replace `v_role != 'student'` with `v_role IS DISTINCT FROM 'student'`
--   which correctly treats NULL as "not equal to 'student'".
--
-- This file also version-controls the trigger for the first time — prior
-- to this migration the function lived only in the Supabase project with
-- no migration history. The migration is idempotent (CREATE OR REPLACE +
-- CREATE TRIGGER IF NOT EXISTS).
--
-- Note: The application no longer depends on this trigger for correctness.
-- `src/contexts/AuthContext.tsx` derives role from the profile tables, and
-- `src/integrations/supabase/client.ts`'s `ensureParentProfile` creates the
-- row client-side when missing. The trigger is kept as a fast path so that
-- a parent_profiles row exists immediately on signup without a second round
-- trip.

CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
DECLARE
  v_user_type TEXT;
  v_role TEXT;
BEGIN
  -- Get user type from metadata
  v_user_type := NEW.raw_user_meta_data->>'user_type';
  v_role := NEW.raw_user_meta_data->>'role';

  -- For social sign-ups (Google/Apple), user_type is NULL.
  -- Default to 'parent' unless the edge function explicitly set role='student'.
  -- IS DISTINCT FROM handles NULL correctly (NULL IS DISTINCT FROM 'student' = TRUE),
  -- whereas `v_role != 'student'` returns NULL when v_role is NULL and the IF skips.
  IF v_user_type IS NULL AND v_role IS DISTINCT FROM 'student' THEN
    v_user_type := 'parent';
    -- Also set user_type in metadata so subsequent logins don't need fallback
    NEW.raw_user_meta_data := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb) || '{"user_type": "parent"}'::jsonb;
  END IF;

  -- Create appropriate profile based on user type.
  -- ON CONFLICT guards against re-entry if the trigger fires more than once
  -- (e.g. identity linking) or races with client-side ensureParentProfile.
  IF v_user_type = 'parent' THEN
    INSERT INTO public.parent_profiles (
      user_id,
      email,
      first_name,
      last_name,
      onboarding_completed
    ) VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'first_name', NEW.raw_user_meta_data->>'given_name', ''),
      COALESCE(NEW.raw_user_meta_data->>'last_name', NEW.raw_user_meta_data->>'family_name', ''),
      false
    )
    ON CONFLICT (user_id) DO NOTHING;
  ELSIF v_user_type = 'student' THEN
    INSERT INTO public.student_profiles (
      user_id,
      name,
      email,
      grade_level,
      is_active
    ) VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'grade_level', '6th'),
      true
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$function$;

-- Ensure the trigger exists and points at the (now fixed) function. Safe to
-- re-run: we drop and recreate so this migration can fix drift if the trigger
-- was removed or pointed at a different function.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- One-time backfill: heal any users created during the buggy period.
-- Any auth.users row with no parent_profiles AND no student_profiles that
-- isn't explicitly marked role='student' gets a parent_profiles row.
-- This mirrors the default-to-parent logic of the trigger above.
INSERT INTO public.parent_profiles (user_id, email, first_name, last_name, onboarding_completed)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'first_name', u.raw_user_meta_data->>'given_name', ''),
  COALESCE(u.raw_user_meta_data->>'last_name', u.raw_user_meta_data->>'family_name', ''),
  false
FROM auth.users u
WHERE
  (u.raw_user_meta_data->>'role') IS DISTINCT FROM 'student'
  AND NOT EXISTS (SELECT 1 FROM public.parent_profiles pp WHERE pp.user_id = u.id)
  AND NOT EXISTS (SELECT 1 FROM public.student_profiles sp WHERE sp.user_id = u.id)
ON CONFLICT (user_id) DO NOTHING;

-- Also set user_type metadata on any auth.users still missing it, so the
-- next sign-in's JWT carries the correct role claim. This is a hint only —
-- the app derives role from profiles — but it keeps metadata consistent.
UPDATE auth.users
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"user_type": "parent"}'::jsonb
WHERE
  (raw_user_meta_data->>'user_type') IS NULL
  AND (raw_user_meta_data->>'role') IS DISTINCT FROM 'student'
  AND EXISTS (SELECT 1 FROM public.parent_profiles pp WHERE pp.user_id = auth.users.id);
