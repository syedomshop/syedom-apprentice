-- AI Grading Results table (stores pending AI results before admin approval)
CREATE TABLE IF NOT EXISTS public.ai_grading_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID REFERENCES public.submissions(id) ON DELETE CASCADE,
  intern_id UUID REFERENCES public.intern_profiles(id) ON DELETE CASCADE NOT NULL,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  ai_score INTEGER CHECK (ai_score >= 0 AND ai_score <= 100),
  ai_grade TEXT,
  ai_feedback TEXT,
  ai_strengths TEXT,
  ai_improvements TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  batch_id UUID REFERENCES public.batches(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  UNIQUE(intern_id, task_id)
);

ALTER TABLE public.ai_grading_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage ai_grading_results" ON public.ai_grading_results
  FOR ALL TO service_role USING (true);

CREATE POLICY "Admins can read ai_grading_results" ON public.ai_grading_results
  FOR SELECT TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update ai_grading_results" ON public.ai_grading_results
  FOR UPDATE TO authenticated USING (is_admin(auth.uid()));

CREATE INDEX idx_ai_grading_results_status ON public.ai_grading_results(status);
CREATE INDEX idx_ai_grading_results_batch ON public.ai_grading_results(batch_id);
CREATE INDEX idx_ai_grading_results_intern ON public.ai_grading_results(intern_id);
