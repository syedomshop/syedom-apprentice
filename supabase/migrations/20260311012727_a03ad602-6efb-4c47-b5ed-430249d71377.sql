-- 1. Add admin task insert policy
CREATE POLICY "Admins can insert tasks"
ON public.tasks
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 2. Add admin task update policy
CREATE POLICY "Admins can update tasks"
ON public.tasks
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- 3. Add admin task delete policy
CREATE POLICY "Admins can delete tasks"
ON public.tasks
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- 4. Add admin update intern profiles policy
CREATE POLICY "Admins can update intern_profiles"
ON public.intern_profiles
FOR UPDATE
TO authenticated
USING (is_admin(auth.uid()));

-- 5. Add admin insert intern_tasks policy
CREATE POLICY "Admins can insert intern_tasks"
ON public.intern_tasks
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 6. Add admin update intern_tasks policy
CREATE POLICY "Admins can update intern_tasks"
ON public.intern_tasks
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));