-- ============================================================
-- PATCH: Fix RLS for patient_assignments
-- Run this snippet in your Supabase SQL Editor
-- ============================================================

-- 1. Create a secure function to check staff status (avoids RLS recursion loops)
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('doctor', 'nurse')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop the old policies on patient_assignments that were causing the error
DROP POLICY IF EXISTS "assignments_select_all" ON public.patient_assignments;
DROP POLICY IF EXISTS "assignments_insert_staff" ON public.patient_assignments;
DROP POLICY IF EXISTS "assignments_delete_staff" ON public.patient_assignments;
DROP POLICY IF EXISTS "assignments_update_staff" ON public.patient_assignments;

-- 3. Add the improved robust policies
CREATE POLICY "assignments_select_all" ON public.patient_assignments
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "assignments_insert_staff" ON public.patient_assignments
  FOR INSERT WITH CHECK (public.is_staff());

CREATE POLICY "assignments_delete_staff" ON public.patient_assignments
  FOR DELETE USING (public.is_staff());
