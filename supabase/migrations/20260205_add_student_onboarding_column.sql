-- Add onboarding tracking for student profiles
ALTER TABLE student_profiles
ADD COLUMN IF NOT EXISTS has_completed_onboarding BOOLEAN DEFAULT false;

-- Comment for documentation
COMMENT ON COLUMN student_profiles.has_completed_onboarding IS 'Tracks whether student has completed the required interactive onboarding tutorial';
