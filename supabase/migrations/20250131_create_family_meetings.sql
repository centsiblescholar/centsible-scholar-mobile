-- Create family_meetings table (6-step MI-based meeting framework)
CREATE TABLE IF NOT EXISTS public.family_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scheduled_date TIMESTAMPTZ,
  scheduled_time TEXT,
  recurrence TEXT CHECK (recurrence IN ('weekly', 'biweekly', 'monthly')),
  is_active BOOLEAN NOT NULL DEFAULT false,
  current_step INTEGER DEFAULT 0,
  step_notes JSONB NOT NULL DEFAULT '{}'::jsonb,
  goals_reviewed JSONB NOT NULL DEFAULT '[]'::jsonb,
  started_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create meeting_child_evaluations table (4-category, 0-3 scale)
CREATE TABLE IF NOT EXISTS public.meeting_child_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES public.family_meetings(id) ON DELETE CASCADE,
  student_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  express_complaints INTEGER NOT NULL CHECK (express_complaints >= 0 AND express_complaints <= 3),
  parents_listened INTEGER NOT NULL CHECK (parents_listened >= 0 AND parents_listened <= 3),
  parents_asked_questions INTEGER NOT NULL CHECK (parents_asked_questions >= 0 AND parents_asked_questions <= 3),
  liked_meeting INTEGER NOT NULL CHECK (liked_meeting >= 0 AND liked_meeting <= 3),
  total_score INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create meeting_goals table
CREATE TABLE IF NOT EXISTS public.meeting_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES public.family_meetings(id) ON DELETE CASCADE,
  student_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  goal_text TEXT NOT NULL,
  specifics JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'dropped')),
  reviewed_in_meeting_id UUID REFERENCES public.family_meetings(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create meeting_conflict_queue table
CREATE TABLE IF NOT EXISTS public.meeting_conflict_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  added_by TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'discussed', 'resolved')),
  discussed_in_meeting_id UUID REFERENCES public.family_meetings(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_family_meetings_user_id ON public.family_meetings(user_id);
CREATE INDEX IF NOT EXISTS idx_meeting_child_evaluations_meeting_id ON public.meeting_child_evaluations(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_goals_meeting_id ON public.meeting_goals(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_goals_status ON public.meeting_goals(status);
CREATE INDEX IF NOT EXISTS idx_meeting_conflict_queue_user_id ON public.meeting_conflict_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_meeting_conflict_queue_status ON public.meeting_conflict_queue(status);

-- Enable RLS
ALTER TABLE public.family_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_child_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_conflict_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies for family_meetings
CREATE POLICY "Users can view own meetings" ON public.family_meetings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own meetings" ON public.family_meetings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meetings" ON public.family_meetings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own meetings" ON public.family_meetings
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for meeting_child_evaluations (parent access via meeting ownership)
CREATE POLICY "Users can view evaluations for own meetings" ON public.meeting_child_evaluations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.family_meetings fm
      WHERE fm.id = meeting_id AND fm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create evaluations for own meetings" ON public.meeting_child_evaluations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.family_meetings fm
      WHERE fm.id = meeting_id AND fm.user_id = auth.uid()
    )
  );

-- RLS Policies for meeting_goals (parent access via meeting ownership)
CREATE POLICY "Users can view goals for own meetings" ON public.meeting_goals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.family_meetings fm
      WHERE fm.id = meeting_id AND fm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create goals for own meetings" ON public.meeting_goals
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.family_meetings fm
      WHERE fm.id = meeting_id AND fm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update goals for own meetings" ON public.meeting_goals
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.family_meetings fm
      WHERE fm.id = meeting_id AND fm.user_id = auth.uid()
    )
  );

-- RLS Policies for meeting_conflict_queue (user owns their conflicts)
CREATE POLICY "Users can view own conflicts" ON public.meeting_conflict_queue
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own conflicts" ON public.meeting_conflict_queue
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conflicts" ON public.meeting_conflict_queue
  FOR UPDATE USING (auth.uid() = user_id);
