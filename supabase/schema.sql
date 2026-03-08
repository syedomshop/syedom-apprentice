-- =============================================
-- SYEDOM LABS INTERNEE PORTAL — FULL SQL SCHEMA
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. ENUM TYPES
-- =============================================

CREATE TYPE public.app_role AS ENUM ('admin', 'intern');
CREATE TYPE public.internship_status AS ENUM ('active', 'completed', 'removed');
CREATE TYPE public.task_status AS ENUM ('pending', 'in_progress', 'completed');
CREATE TYPE public.submission_status AS ENUM ('submitted', 'graded');

-- 2. TABLES
-- =============================================

-- 2a. user_roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, role)
);

-- 2b. intern_profiles
CREATE TABLE public.intern_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  intern_id TEXT NOT NULL UNIQUE,
  university TEXT NOT NULL,
  field TEXT NOT NULL,
  start_date DATE DEFAULT CURRENT_DATE,
  status internship_status DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2c. tasks
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  difficulty TEXT DEFAULT 'Beginner',
  youtube_link TEXT,
  estimated_time TEXT,
  learning_objective TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2d. intern_tasks
CREATE TABLE public.intern_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intern_id UUID REFERENCES public.intern_profiles(id) ON DELETE CASCADE NOT NULL,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  status task_status DEFAULT 'pending',
  assigned_date DATE DEFAULT CURRENT_DATE,
  UNIQUE (intern_id, task_id)
);

-- 2e. submissions
CREATE TABLE public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intern_id UUID REFERENCES public.intern_profiles(id) ON DELETE CASCADE NOT NULL,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  repo_link TEXT,
  file_url TEXT,
  explanation TEXT,
  ai_score INTEGER CHECK (ai_score >= 0 AND ai_score <= 10),
  ai_feedback TEXT,
  status submission_status DEFAULT 'submitted',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2f. ai_usage
CREATE TABLE public.ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE DEFAULT CURRENT_DATE NOT NULL,
  tokens_used INTEGER DEFAULT 0,
  api_calls INTEGER DEFAULT 0,
  UNIQUE (date)
);

-- 3. SECURITY DEFINER FUNCTIONS
-- =============================================

-- 3a. Check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 3b. Get intern profile id for a user
CREATE OR REPLACE FUNCTION public.get_intern_profile_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.intern_profiles WHERE user_id = _user_id LIMIT 1
$$;

-- 3c. Count active interns (for seat limit)
CREATE OR REPLACE FUNCTION public.count_active_interns()
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER FROM public.intern_profiles WHERE status = 'active'
$$;

-- 3d. Check seat availability (MAX 50)
CREATE OR REPLACE FUNCTION public.check_seat_available()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (SELECT COUNT(*) FROM public.intern_profiles WHERE status = 'active') < 50
$$;

-- 4. ROW LEVEL SECURITY
-- =============================================

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intern_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intern_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

-- 4a. user_roles policies
CREATE POLICY "Users can read own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can read all roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Allow insert for authenticated users"
  ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- 4b. intern_profiles policies
CREATE POLICY "Users can read own profile"
  ON public.intern_profiles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON public.intern_profiles FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own profile"
  ON public.intern_profiles FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can read all profiles"
  ON public.intern_profiles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all profiles"
  ON public.intern_profiles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 4c. tasks policies (readable by all authenticated)
CREATE POLICY "Authenticated users can read tasks"
  ON public.tasks FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can manage tasks"
  ON public.tasks FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Service role can insert (for edge functions)
CREATE POLICY "Service role can insert tasks"
  ON public.tasks FOR INSERT TO service_role
  WITH CHECK (true);

-- 4d. intern_tasks policies
CREATE POLICY "Interns can read own tasks"
  ON public.intern_tasks FOR SELECT TO authenticated
  USING (intern_id = public.get_intern_profile_id(auth.uid()));

CREATE POLICY "Admins can read all intern tasks"
  ON public.intern_tasks FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage intern tasks"
  ON public.intern_tasks FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role can manage intern tasks"
  ON public.intern_tasks FOR ALL TO service_role
  USING (true);

-- 4e. submissions policies
CREATE POLICY "Interns can read own submissions"
  ON public.submissions FOR SELECT TO authenticated
  USING (intern_id = public.get_intern_profile_id(auth.uid()));

CREATE POLICY "Interns can create submissions"
  ON public.submissions FOR INSERT TO authenticated
  WITH CHECK (intern_id = public.get_intern_profile_id(auth.uid()));

CREATE POLICY "Admins can read all submissions"
  ON public.submissions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update submissions"
  ON public.submissions FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role can manage submissions"
  ON public.submissions FOR ALL TO service_role
  USING (true);

-- 4f. ai_usage policies
CREATE POLICY "Admins can read ai_usage"
  ON public.ai_usage FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role can manage ai_usage"
  ON public.ai_usage FOR ALL TO service_role
  USING (true);

-- 5. INDEXES
-- =============================================

CREATE INDEX idx_intern_profiles_user_id ON public.intern_profiles(user_id);
CREATE INDEX idx_intern_profiles_status ON public.intern_profiles(status);
CREATE INDEX idx_intern_tasks_intern_id ON public.intern_tasks(intern_id);
CREATE INDEX idx_intern_tasks_task_id ON public.intern_tasks(task_id);
CREATE INDEX idx_submissions_intern_id ON public.submissions(intern_id);
CREATE INDEX idx_submissions_task_id ON public.submissions(task_id);
CREATE INDEX idx_ai_usage_date ON public.ai_usage(date);

-- =============================================
-- pg_cron SQL (run separately after enabling pg_cron and pg_net extensions)
-- =============================================
-- 
-- -- Enable extensions first:
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- CREATE EXTENSION IF NOT EXISTS pg_net;
--
-- -- Daily task generation at 03:00 UTC
-- SELECT cron.schedule(
--   'daily-generate-tasks',
--   '0 3 * * *',
--   $$
--   SELECT net.http_post(
--     url := 'https://tmsxfbrszqwsppmbkmmd.supabase.co/functions/v1/generate-tasks',
--     headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtc3hmYnJzenF3c3BwbWJrbW1kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4NTY3MDYsImV4cCI6MjA4ODQzMjcwNn0.xDq7IzmYPgqp6KRqL2iP17y0XmcW9lur3PRNsstYtkw"}'::jsonb,
--     body := '{}'::jsonb
--   ) AS request_id;
--   $$
-- );
--
-- -- AI usage monitoring every 30 minutes
-- SELECT cron.schedule(
--   'ai-usage-monitor',
--   '*/30 * * * *',
--   $$
--   SELECT net.http_post(
--     url := 'https://tmsxfbrszqwsppmbkmmd.supabase.co/functions/v1/monitor-ai-usage',
--     headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtc3hmYnJzenF3c3BwbWJrbW1kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4NTY3MDYsImV4cCI6MjA4ODQzMjcwNn0.xDq7IzmYPgqp6KRqL2iP17y0XmcW9lur3PRNsstYtkw"}'::jsonb,
--     body := '{}'::jsonb
--   ) AS request_id;
--   $$
-- );
--
-- -- Nightly intern cleanup at 00:00 UTC
-- SELECT cron.schedule(
--   'nightly-intern-cleanup',
--   '0 0 * * *',
--   $$
--   UPDATE public.intern_profiles
--   SET status = 'completed'
--   WHERE status = 'active'
--     AND start_date + INTERVAL '90 days' < CURRENT_DATE;
--   $$
-- );
-- =============================================
