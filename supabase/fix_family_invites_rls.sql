-- ============================================================================
-- FIX: family_invites RLS policies
-- Problem: "permission denied for table users"
-- Cause: RLS policies use (SELECT email FROM auth.users WHERE id = auth.uid())
--        which is NOT accessible to the 'authenticated' role.
-- Fix: Replace with auth.jwt() ->> 'email' which reads from the JWT token
--      and is always available to authenticated users.
-- ============================================================================

-- ============================================================
-- STEP 1: Drop existing policies that reference auth.users
-- ============================================================

DROP POLICY IF EXISTS "Nurses can view their invites"       ON family_invites;
DROP POLICY IF EXISTS "Family can accept/decline invites"   ON family_invites;
DROP POLICY IF EXISTS "Nurses can create invites"           ON family_invites;
DROP POLICY IF EXISTS "Staff can view audit logs"           ON invite_audit_logs;

-- Also drop any duplicate/old policies that may exist
DROP POLICY IF EXISTS "nurses_can_view_invites"             ON family_invites;
DROP POLICY IF EXISTS "family_can_update_invites"          ON family_invites;

-- ============================================================
-- STEP 2: Re-create policies using auth.jwt() ->> 'email'
--         instead of (SELECT email FROM auth.users ...)
-- ============================================================

-- Policy: nurses INSERT invites
CREATE POLICY "Nurses can create invites" ON family_invites
FOR INSERT
WITH CHECK (
  -- Must be a nurse
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'nurse'
  )
  AND
  -- Patient must exist
  EXISTS (
    SELECT 1 FROM patients
    WHERE id = family_invites.patient_id
  )
  AND
  -- Auth ID matches the creator
  created_by_auth_id = auth.uid()
  AND
  -- Nurse ID matches the creator's profile
  nurse_id = auth.uid()
);

-- Policy: nurses/doctors/family SELECT invites
CREATE POLICY "Nurses can view their invites" ON family_invites
FOR SELECT
USING (
  -- Nurse can see invites they created
  nurse_id = auth.uid()
  OR
  -- Doctor can see invites for their patients
  (
    EXISTS (
      SELECT 1 FROM profiles p1
      WHERE p1.id = auth.uid() AND p1.role = 'doctor'
    )
    AND
    EXISTS (
      SELECT 1 FROM patients p2
      WHERE p2.id = family_invites.patient_id
    )
  )
  OR
  -- Family members can see their own invites by matching email from JWT
  family_email = (auth.jwt() ->> 'email')
  OR
  -- User can see invites linked to their profile after signup
  user_id = auth.uid()
);

-- Policy: family UPDATE (accept/decline) their invites
CREATE POLICY "Family can accept/decline invites" ON family_invites
FOR UPDATE
USING (
  -- Family member identified by email in JWT
  family_email = (auth.jwt() ->> 'email')
  OR
  user_id = auth.uid()
  OR
  -- Nurse who created the invite can also update it (e.g., mark as expired)
  nurse_id = auth.uid()
)
WITH CHECK (
  -- Allow nurses to update status
  nurse_id = auth.uid()
  OR
  -- Allow the family member to accept/decline
  (
    (family_email = (auth.jwt() ->> 'email') OR user_id = auth.uid())
    AND status IN ('accepted', 'declined', 'pending')
  )
);

-- Policy: nurses INSERT into invite_audit_logs
-- (The trigger log_invite_creation fires as the table owner, but direct inserts from the service need this)
CREATE POLICY "Staff can insert audit logs" ON invite_audit_logs
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('doctor', 'nurse')
  )
  OR
  -- Allow family members to log acceptance
  EXISTS (
    SELECT 1 FROM family_invites fi
    WHERE fi.id = invite_audit_logs.invite_id
    AND (fi.user_id = auth.uid() OR fi.family_email = (auth.jwt() ->> 'email'))
  )
);

-- Policy: staff/family SELECT audit logs
CREATE POLICY "Staff can view audit logs" ON invite_audit_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('doctor', 'nurse')
  )
  OR
  -- Users can view logs for their own invites
  EXISTS (
    SELECT 1 FROM family_invites fi
    WHERE fi.id = invite_audit_logs.invite_id
    AND (fi.nurse_id = auth.uid() OR fi.user_id = auth.uid())
  )
);

-- ============================================================
-- STEP 3: Grant INSERT on invite_audit_logs to authenticated
-- (may be missing if the original schema didn't include it)
-- ============================================================
GRANT SELECT, INSERT ON invite_audit_logs TO authenticated;

-- ============================================================
-- VERIFY: these should now return no "permission denied" errors
-- SELECT auth.jwt() ->> 'email';   -- Should return your email
-- SELECT * FROM family_invites;    -- Should work
-- ============================================================
