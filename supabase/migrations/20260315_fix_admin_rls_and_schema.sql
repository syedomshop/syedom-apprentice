-- =============================================
-- CRITICAL FIX: Admin RLS Policies + Missing Schema
-- Run this in Supabase Dashboard → SQL Editor
-- =============================================

-- 1. Define is_admin() function (checks email against admin whitelist)
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = _user_id
    AND email IN ('admin@syedomlabs.com', 'syedomshop@gmail.com')
  )
$$;

-- 2. Add missing columns to tasks table
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS task_file_url TEXT,
  ADD COLUMN IF NOT EXISTS deadline TIMESTAMPTZ;

-- 3. Add missing columns to submissions table
ALTER TABLE public.submissions
  ADD COLUMN IF NOT EXISTS timeliness TEXT DEFAULT 'on_time',
  ADD COLUMN IF NOT EXISTS intern_comment_v2 TEXT;

-- Rename if intern_comment has wrong constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'submissions' AND column_name = 'intern_comment'
    AND character_maximum_length IS NULL
  ) THEN
    ALTER TABLE public.submissions ALTER COLUMN intern_comment TYPE TEXT;
  END IF;
EXCEPTION WHEN others THEN NULL;
END $$;

-- 4. Create grades table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intern_id UUID REFERENCES public.intern_profiles(id) ON DELETE CASCADE NOT NULL,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  score INTEGER CHECK (score >= 0 AND score <= 100) NOT NULL,
  feedback TEXT,
  graded_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (intern_id, task_id)
);

ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;

-- 5. Add admin READ policies to all tables

-- intern_profiles: admin can read ALL
DROP POLICY IF EXISTS "Admins can read all intern_profiles" ON public.intern_profiles;
CREATE POLICY "Admins can read all intern_profiles"
  ON public.intern_profiles FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

-- intern_profiles: admin can insert
DROP POLICY IF EXISTS "Admins can insert intern_profiles" ON public.intern_profiles;
CREATE POLICY "Admins can insert intern_profiles"
  ON public.intern_profiles FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

-- intern_profiles: admin can delete
DROP POLICY IF EXISTS "Admins can delete intern_profiles" ON public.intern_profiles;
CREATE POLICY "Admins can delete intern_profiles"
  ON public.intern_profiles FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

-- tasks: admin can read
DROP POLICY IF EXISTS "Admins can read all tasks" ON public.tasks;
CREATE POLICY "Admins can read all tasks"
  ON public.tasks FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

-- tasks: fix insert/update/delete policies (was using 'admin'::app_role which doesn't exist)
DROP POLICY IF EXISTS "Admins can insert tasks" ON public.tasks;
CREATE POLICY "Admins can insert tasks"
  ON public.tasks FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update tasks" ON public.tasks;
CREATE POLICY "Admins can update tasks"
  ON public.tasks FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete tasks" ON public.tasks;
CREATE POLICY "Admins can delete tasks"
  ON public.tasks FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

-- intern_tasks: admin can read all
DROP POLICY IF EXISTS "Admins can read all intern_tasks" ON public.intern_tasks;
CREATE POLICY "Admins can read all intern_tasks"
  ON public.intern_tasks FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

-- intern_tasks: fix insert/update policies
DROP POLICY IF EXISTS "Admins can insert intern_tasks" ON public.intern_tasks;
CREATE POLICY "Admins can insert intern_tasks"
  ON public.intern_tasks FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update intern_tasks" ON public.intern_tasks;
CREATE POLICY "Admins can update intern_tasks"
  ON public.intern_tasks FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete intern_tasks" ON public.intern_tasks;
CREATE POLICY "Admins can delete intern_tasks"
  ON public.intern_tasks FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

-- submissions: admin can read all
DROP POLICY IF EXISTS "Admins can read all submissions" ON public.submissions;
CREATE POLICY "Admins can read all submissions"
  ON public.submissions FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

-- submissions: admin can update (for grading)
DROP POLICY IF EXISTS "Admins can update submissions" ON public.submissions;
CREATE POLICY "Admins can update submissions"
  ON public.submissions FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()));

-- submissions: interns can also update their own
DROP POLICY IF EXISTS "Interns can update own submissions" ON public.submissions;
CREATE POLICY "Interns can update own submissions"
  ON public.submissions FOR UPDATE TO authenticated
  USING (intern_id = public.get_intern_profile_id(auth.uid()));

-- grades: admin can do everything
DROP POLICY IF EXISTS "Admins can manage grades" ON public.grades;
CREATE POLICY "Admins can manage grades"
  ON public.grades FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- grades: interns can read own grades
DROP POLICY IF EXISTS "Interns can read own grades" ON public.grades;
CREATE POLICY "Interns can read own grades"
  ON public.grades FOR SELECT TO authenticated
  USING (intern_id = public.get_intern_profile_id(auth.uid()));

-- grades: service role
DROP POLICY IF EXISTS "Service role can manage grades" ON public.grades;
CREATE POLICY "Service role can manage grades"
  ON public.grades FOR ALL TO service_role
  USING (true);

-- ai_usage: admin can read
DROP POLICY IF EXISTS "Admins can read ai_usage" ON public.ai_usage;
CREATE POLICY "Admins can read ai_usage"
  ON public.ai_usage FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

-- notifications: admin can read all
DROP POLICY IF EXISTS "Admins can manage notifications" ON public.notifications;
CREATE POLICY "Admins can manage notifications"
  ON public.notifications FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- certificates: admin can manage
DROP POLICY IF EXISTS "Admins can manage certificates" ON public.certificates;
CREATE POLICY "Admins can manage certificates"
  ON public.certificates FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- batches: admin can manage
DROP POLICY IF EXISTS "Admins can manage batches" ON public.batches;
CREATE POLICY "Admins can manage batches"
  ON public.batches FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- pending_offers: admin can manage
DROP POLICY IF EXISTS "Admins can manage pending_offers" ON public.pending_offers;
CREATE POLICY "Admins can manage pending_offers"
  ON public.pending_offers FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- waitlist: admin can read
DROP POLICY IF EXISTS "Admins can read waitlist" ON public.waitlist;
CREATE POLICY "Admins can read waitlist"
  ON public.waitlist FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

-- ai_grading_results: admin can manage (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_grading_results') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Admins can read ai_grading_results" ON public.ai_grading_results';
    EXECUTE 'DROP POLICY IF EXISTS "Admins can update ai_grading_results" ON public.ai_grading_results';
    EXECUTE $p$
      CREATE POLICY "Admins can manage ai_grading_results"
      ON public.ai_grading_results FOR ALL TO authenticated
      USING (public.is_admin(auth.uid()))
      WITH CHECK (public.is_admin(auth.uid()))
    $p$;
  END IF;
EXCEPTION WHEN others THEN NULL;
END $$;

-- 6. Fix user_roles: let admins insert any role (for granting intern role on signup)
DROP POLICY IF EXISTS "Admins can manage user_roles" ON public.user_roles;
CREATE POLICY "Admins can manage user_roles"
  ON public.user_roles FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Keep existing: users can insert own role (for signup flow)
-- "Allow insert for authenticated users" already exists

-- 7. Index for is_admin() performance
CREATE INDEX IF NOT EXISTS idx_auth_users_email ON auth.users(email);
