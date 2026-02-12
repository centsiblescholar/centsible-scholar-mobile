-- Create family_meetings table
CREATE TABLE IF NOT EXISTS public.family_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scheduled_date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'missed', 'cancelled')),
  notes TEXT,
  attendees TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create meeting_assessments table
CREATE TABLE IF NOT EXISTS public.meeting_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES public.family_meetings(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  student_name TEXT NOT NULL,
  participation_rating INTEGER NOT NULL CHECK (participation_rating >= 1 AND participation_rating <= 5),
  goal_progress_rating INTEGER NOT NULL CHECK (goal_progress_rating >= 1 AND goal_progress_rating <= 5),
  communication_rating INTEGER NOT NULL CHECK (communication_rating >= 1 AND communication_rating <= 5),
  overall_rating NUMERIC(3,2) NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_family_meetings_user_id ON public.family_meetings(user_id);
CREATE INDEX IF NOT EXISTS idx_family_meetings_status ON public.family_meetings(status);
CREATE INDEX IF NOT EXISTS idx_family_meetings_scheduled_date ON public.family_meetings(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_meeting_assessments_meeting_id ON public.meeting_assessments(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_assessments_student_id ON public.meeting_assessments(student_id);

-- Enable RLS
ALTER TABLE public.family_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_assessments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for family_meetings
-- Users can view their own meetings
CREATE POLICY "Users can view own meetings" ON public.family_meetings
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own meetings
CREATE POLICY "Users can create own meetings" ON public.family_meetings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own meetings
CREATE POLICY "Users can update own meetings" ON public.family_meetings
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own meetings
CREATE POLICY "Users can delete own meetings" ON public.family_meetings
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for meeting_assessments
-- Users can view assessments for meetings they own
CREATE POLICY "Users can view assessments for own meetings" ON public.meeting_assessments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.family_meetings fm
      WHERE fm.id = meeting_id AND fm.user_id = auth.uid()
    )
  );

-- Users can create assessments for meetings they own
CREATE POLICY "Users can create assessments for own meetings" ON public.meeting_assessments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.family_meetings fm
      WHERE fm.id = meeting_id AND fm.user_id = auth.uid()
    )
  );

-- Users can update assessments for meetings they own
CREATE POLICY "Users can update assessments for own meetings" ON public.meeting_assessments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.family_meetings fm
      WHERE fm.id = meeting_id AND fm.user_id = auth.uid()
    )
  );

-- Users can delete assessments for meetings they own
CREATE POLICY "Users can delete assessments for own meetings" ON public.meeting_assessments
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.family_meetings fm
      WHERE fm.id = meeting_id AND fm.user_id = auth.uid()
    )
  );

-- Function to auto-update missed meetings
CREATE OR REPLACE FUNCTION public.update_missed_meetings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.family_meetings
  SET status = 'missed', updated_at = now()
  WHERE status = 'scheduled'
    AND scheduled_date < now();
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.update_missed_meetings() TO authenticated;
