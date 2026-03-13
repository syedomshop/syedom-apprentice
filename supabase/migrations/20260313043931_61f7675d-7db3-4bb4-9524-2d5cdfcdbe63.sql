
-- Add deadline and task_file_url to tasks table
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS deadline timestamptz;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS task_file_url text;

-- Add timeliness column to submissions (on_time / late)
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS timeliness text DEFAULT 'on_time';

-- Create grades table
CREATE TABLE IF NOT EXISTS public.grades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  intern_id uuid NOT NULL REFERENCES public.intern_profiles(id) ON DELETE CASCADE,
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  score integer NOT NULL DEFAULT 0,
  feedback text,
  graded_at timestamptz DEFAULT now(),
  UNIQUE(intern_id, task_id)
);

-- RLS for grades
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Interns can read own grades" ON public.grades
  FOR SELECT TO authenticated
  USING (intern_id = get_intern_profile_id(auth.uid()));

CREATE POLICY "Admins can read all grades" ON public.grades
  FOR SELECT TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert grades" ON public.grades
  FOR INSERT TO authenticated
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update grades" ON public.grades
  FOR UPDATE TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Service role can manage grades" ON public.grades
  FOR ALL TO service_role
  USING (true);
