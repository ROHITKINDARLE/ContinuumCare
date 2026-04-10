-- ============================================================================
-- FAMILY INVITES SCHEMA & POLICIES
-- Purpose: Allow nurses to securely invite family members via email
-- ============================================================================

-- ============================================================================
-- TABLE: family_invites
-- ============================================================================
CREATE TABLE IF NOT EXISTS family_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- References
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  nurse_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_by_auth_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Invite Details
  family_email TEXT NOT NULL,
  family_name TEXT NOT NULL,
  relationship TEXT, -- e.g., "Mother", "Son", "Spouse", etc.
  invite_code UUID NOT NULL UNIQUE DEFAULT uuid_generate_v4(),
  
  -- Status & Timestamps
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'declined')),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL DEFAULT (CURRENT_TIMESTAMP + INTERVAL '7 days'),
  accepted_at TIMESTAMP,
  
  -- Metadata
  notes TEXT,
  
  CONSTRAINT valid_email CHECK (family_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'),
  CONSTRAINT valid_dates CHECK (expires_at > created_at)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_family_invites_patient_id ON family_invites(patient_id);
CREATE INDEX IF NOT EXISTS idx_family_invites_nurse_id ON family_invites(nurse_id);
CREATE INDEX IF NOT EXISTS idx_family_invites_invite_code ON family_invites(invite_code);
CREATE INDEX IF NOT EXISTS idx_family_invites_family_email ON family_invites(family_email);
CREATE INDEX IF NOT EXISTS idx_family_invites_status ON family_invites(status);
CREATE INDEX IF NOT EXISTS idx_family_invites_created_by_auth_id ON family_invites(created_by_auth_id);
CREATE INDEX IF NOT EXISTS idx_family_invites_user_id ON family_invites(user_id);

-- ============================================================================
-- TABLE: invite_audit_logs (Optional: For compliance/debugging)
-- ============================================================================
CREATE TABLE IF NOT EXISTS invite_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invite_id UUID NOT NULL REFERENCES family_invites(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'created', 'email_sent', 'email_failed', 'accepted', 'expired', 'declined'
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  details JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_invite_audit_logs_invite_id ON invite_audit_logs(invite_id);
CREATE INDEX IF NOT EXISTS idx_invite_audit_logs_action ON invite_audit_logs(action);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on both tables
ALTER TABLE family_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE invite_audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLICY: family_invites - NURSES can create invites for their patients
-- ============================================================================
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
  -- Patient must exist and nurse must have access to it
  -- (doctors and nurses can create invites for their patients)
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

-- ============================================================================
-- POLICY: family_invites - NURSES can view their created invites
-- ============================================================================
CREATE POLICY "Nurses can view their invites" ON family_invites
FOR SELECT
USING (
  (
    -- Nurse can see invites they created
    nurse_id = auth.uid()
  )
  OR
  (
    -- Doctor can see invites for their patients
    EXISTS (
      SELECT 1 FROM profiles p1
      WHERE p1.id = auth.uid() AND p1.role = 'doctor'
    )
    AND
    EXISTS (
      SELECT 1 FROM patients p2
      WHERE p2.id = family_invites.patient_id
      AND p2.created_by = auth.uid()
    )
  )
  OR
  (
    -- Family members can see their own invites (even before signup)
    family_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
  OR
  (
    -- User can see invites linked to their profile after signup
    user_id = auth.uid()
  )
);

-- ============================================================================
-- POLICY: family_invites - FAMILY can update (accept/decline) their invites
-- ============================================================================
CREATE POLICY "Family can accept/decline invites" ON family_invites
FOR UPDATE
USING (
  -- Only family member can update their invite
  family_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  OR
  user_id = auth.uid()
)
WITH CHECK (
  -- Can only change status and accepted_at
  (
    status IN ('accepted', 'declined')
    OR
    status = 'pending'
  )
  AND
  (
    -- If status is accepted, must set user_id and accepted_at
    CASE
      WHEN status = 'accepted' THEN user_id = auth.uid() AND accepted_at IS NOT NULL
      ELSE true
    END
  )
);

-- ============================================================================
-- POLICY: invite_audit_logs - Admins/Staff can view audit logs
-- ============================================================================
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
    SELECT 1 FROM family_invites
    WHERE id = invite_audit_logs.invite_id
    AND (
      nurse_id = auth.uid()
      OR user_id = auth.uid()
    )
  )
);

-- ============================================================================
-- FUNCTION: Clean up expired invites (run periodically)
-- ============================================================================
CREATE OR REPLACE FUNCTION cleanup_expired_invites()
RETURNS TABLE(deleted_count INT) AS $$
DECLARE
  count INT;
BEGIN
  WITH deleted AS (
    UPDATE family_invites
    SET status = 'expired'
    WHERE status = 'pending' AND expires_at < CURRENT_TIMESTAMP
    RETURNING id
  )
  SELECT COUNT(*) INTO count FROM deleted;
  
  RETURN QUERY SELECT count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: Log invite actions for audit trail
-- ============================================================================
CREATE OR REPLACE FUNCTION log_invite_action(
  p_invite_id UUID,
  p_action TEXT,
  p_details JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO invite_audit_logs (invite_id, action, actor_id, details)
  VALUES (p_invite_id, p_action, auth.uid(), p_details);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGER: Log invite creation
-- ============================================================================
CREATE OR REPLACE FUNCTION log_invite_creation()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM log_invite_action(
    NEW.id,
    'created',
    jsonb_build_object(
      'family_name', NEW.family_name,
      'family_email', NEW.family_email,
      'relationship', NEW.relationship
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_log_invite_creation ON family_invites;
CREATE TRIGGER trigger_log_invite_creation
AFTER INSERT ON family_invites
FOR EACH ROW
EXECUTE FUNCTION log_invite_creation();

-- ============================================================================
-- GRANT PERMISSIONS (adjust based on your Supabase role setup)
-- ============================================================================
GRANT SELECT, INSERT, UPDATE ON family_invites TO authenticated;
GRANT SELECT ON invite_audit_logs TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_invites TO authenticated;
GRANT EXECUTE ON FUNCTION log_invite_action TO authenticated;

-- ============================================================================
-- NOTES FOR DEPLOYMENT
-- ============================================================================
-- 1. Run this entire script in Supabase SQL Editor
-- 2. Verify tables are created: SELECT * FROM family_invites LIMIT 0;
-- 3. Test inserting an invite as test nurse user
-- 4. Verify RLS policies work correctly
-- 5. Schedule cleanup_expired_invites() to run daily (via pg_cron if available)
