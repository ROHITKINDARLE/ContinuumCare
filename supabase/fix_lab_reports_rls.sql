-- ============================================================
-- PATCH: Fix RLS for lab_reports 
-- Run this snippet in your Supabase SQL Editor
-- ============================================================

-- Ensure the is_staff helper function exists
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('doctor', 'nurse')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the old lab_reports policies
DROP POLICY IF EXISTS "lab_reports_select" ON public.lab_reports;
DROP POLICY IF EXISTS "lab_reports_insert_staff" ON public.lab_reports;

-- Add updated, highly reliable policies
CREATE POLICY "lab_reports_select" ON public.lab_reports
  FOR SELECT USING (
    public.is_staff() 
    OR 
    EXISTS (
      SELECT 1 FROM public.patient_assignments pa
      WHERE pa.patient_id = lab_reports.patient_id AND pa.profile_id = auth.uid()
    )
  );

CREATE POLICY "lab_reports_insert_staff" ON public.lab_reports
  FOR INSERT WITH CHECK (public.is_staff());

-- While we are at it, let's make sure the lab-reports storage bucket actually exists!
INSERT INTO storage.buckets (id, name, public)
VALUES ('lab-reports', 'lab-reports', false)
ON CONFLICT (id) DO NOTHING;

-- And fix the Storage policies so they use auth.uid()
DROP POLICY IF EXISTS "storage_upload_authenticated" ON storage.objects;
DROP POLICY IF EXISTS "storage_read_authenticated" ON storage.objects;

CREATE POLICY "storage_upload_authenticated" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'lab-reports' AND auth.uid() IS NOT NULL
  );

CREATE POLICY "storage_read_authenticated" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'lab-reports' AND auth.uid() IS NOT NULL
  );
