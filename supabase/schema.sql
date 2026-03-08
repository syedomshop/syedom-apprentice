-- =============================================
-- SYEDOM LABS INTERNSHIP PROGRAM — FULL SQL SCHEMA
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. ENUM TYPES
CREATE TYPE public.app_role AS ENUM ('intern');
CREATE TYPE public.internship_status AS ENUM ('active', 'completed', 'removed');
CREATE TYPE public.task_status AS ENUM ('pending', 'in_progress', 'completed');
CREATE TYPE public.submission_status AS ENUM ('submitted', 'graded');
CREATE TYPE public.offer_status AS ENUM ('pending', 'sent');
CREATE TYPE public.certificate_status AS ENUM ('issued', 'revoked');

-- 2. TABLES

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
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  intern_id TEXT NOT NULL UNIQUE,
  field TEXT NOT NULL,
  start_date DATE,
  status internship_status DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2c. tasks (weekly, 8 weeks per role)
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  difficulty TEXT DEFAULT 'Beginner',
  week_number INTEGER NOT NULL CHECK (week_number >= 1 AND week_number <= 8),
  field TEXT NOT NULL,
  youtube_link TEXT,
  estimated_time TEXT,
  learning_objective TEXT,
  mentor_explanation TEXT,
  deliverable TEXT,
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
  ai_score INTEGER CHECK (ai_score >= 0 AND ai_score <= 100),
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

-- 2g. pending_offers (for delayed offer letter emails)
CREATE TABLE public.pending_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intern_profile_id UUID REFERENCES public.intern_profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  field TEXT NOT NULL,
  intern_id TEXT NOT NULL,
  send_after TIMESTAMPTZ NOT NULL,
  status offer_status DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2h. certificates
CREATE TABLE public.certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intern_id UUID REFERENCES public.intern_profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  certificate_code TEXT NOT NULL UNIQUE,
  student_name TEXT NOT NULL,
  field TEXT NOT NULL,
  average_score INTEGER NOT NULL,
  tasks_completed INTEGER NOT NULL,
  status certificate_status DEFAULT 'issued',
  issued_at TIMESTAMPTZ DEFAULT now()
);

-- 3. SECURITY DEFINER FUNCTIONS

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.get_intern_profile_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT id FROM public.intern_profiles WHERE user_id = _user_id LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.count_active_interns()
RETURNS INTEGER
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER FROM public.intern_profiles WHERE status = 'active'
$$;

CREATE OR REPLACE FUNCTION public.check_seat_available()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT (SELECT COUNT(*) FROM public.intern_profiles WHERE status = 'active') < 50
$$;

CREATE OR REPLACE FUNCTION public.get_intern_week(_intern_id UUID)
RETURNS INTEGER
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT LEAST(8, GREATEST(1,
    EXTRACT(DAY FROM (CURRENT_DATE - start_date))::INTEGER / 7 + 1
  ))
  FROM public.intern_profiles WHERE id = _intern_id
$$;

-- 4. ROW LEVEL SECURITY

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intern_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intern_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- user_roles
CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Allow insert for authenticated users" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- intern_profiles
CREATE POLICY "Users can read own profile" ON public.intern_profiles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can update own profile" ON public.intern_profiles FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own profile" ON public.intern_profiles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
-- Public read for portfolio pages (only name, username, field, status)
CREATE POLICY "Public can read basic profiles" ON public.intern_profiles FOR SELECT TO anon USING (true);

-- tasks
CREATE POLICY "Authenticated users can read tasks" ON public.tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Service role can insert tasks" ON public.tasks FOR INSERT TO service_role WITH CHECK (true);

-- intern_tasks
CREATE POLICY "Interns can read own tasks" ON public.intern_tasks FOR SELECT TO authenticated USING (intern_id = public.get_intern_profile_id(auth.uid()));
CREATE POLICY "Interns can insert own tasks" ON public.intern_tasks FOR INSERT TO authenticated WITH CHECK (intern_id = public.get_intern_profile_id(auth.uid()));
CREATE POLICY "Service role can manage intern tasks" ON public.intern_tasks FOR ALL TO service_role USING (true);

-- submissions
CREATE POLICY "Interns can read own submissions" ON public.submissions FOR SELECT TO authenticated USING (intern_id = public.get_intern_profile_id(auth.uid()));
CREATE POLICY "Interns can create submissions" ON public.submissions FOR INSERT TO authenticated WITH CHECK (intern_id = public.get_intern_profile_id(auth.uid()));
CREATE POLICY "Service role can manage submissions" ON public.submissions FOR ALL TO service_role USING (true);

-- ai_usage
CREATE POLICY "Service role can manage ai_usage" ON public.ai_usage FOR ALL TO service_role USING (true);

-- pending_offers
CREATE POLICY "Service role can manage pending_offers" ON public.pending_offers FOR ALL TO service_role USING (true);

-- certificates
CREATE POLICY "Public can read certificates" ON public.certificates FOR SELECT TO anon USING (true);
CREATE POLICY "Authenticated can read certificates" ON public.certificates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Service role can manage certificates" ON public.certificates FOR ALL TO service_role USING (true);

-- 5. INDEXES

CREATE INDEX idx_intern_profiles_user_id ON public.intern_profiles(user_id);
CREATE INDEX idx_intern_profiles_status ON public.intern_profiles(status);
CREATE INDEX idx_intern_profiles_username ON public.intern_profiles(username);
CREATE INDEX idx_tasks_field_week ON public.tasks(field, week_number);
CREATE INDEX idx_intern_tasks_intern_id ON public.intern_tasks(intern_id);
CREATE INDEX idx_submissions_intern_id ON public.submissions(intern_id);
CREATE INDEX idx_pending_offers_status ON public.pending_offers(status, send_after);
CREATE INDEX idx_certificates_code ON public.certificates(certificate_code);

-- =============================================
-- pg_cron SQL (run separately after enabling pg_cron and pg_net)
-- =============================================
-- 
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- CREATE EXTENSION IF NOT EXISTS pg_net;
--
-- -- Process pending offer letters every 15 minutes
-- SELECT cron.schedule(
--   'process-pending-offers',
--   '*/15 * * * *',
--   $$
--   SELECT net.http_post(
--     url := 'https://tmsxfbrszqwsppmbkmmd.supabase.co/functions/v1/process-pending-offers',
--     headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtc3hmYnJzenF3c3BwbWJrbW1kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4NTY3MDYsImV4cCI6MjA4ODQzMjcwNn0.xDq7IzmYPgqp6KRqL2iP17y0XmcW9lur3PRNsstYtkw"}'::jsonb,
--     body := '{}'::jsonb
--   ) AS request_id;
--   $$
-- );
--
-- -- Daily task generation at 03:00
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
-- -- Nightly intern cleanup at 00:00
-- SELECT cron.schedule(
--   'nightly-intern-cleanup',
--   '0 0 * * *',
--   $$
--   UPDATE public.intern_profiles
--   SET status = 'completed'
--   WHERE status = 'active'
--     AND start_date + INTERVAL '56 days' < CURRENT_DATE;
--   $$
-- );
