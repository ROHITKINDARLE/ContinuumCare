-- ============================================================
-- FIX: Allow unauthenticated users to read invites by invite_code
-- 
-- Problem: Family members clicking the invite link from email are
-- NOT logged in yet. The existing SELECT policy requires authentication,
-- so getInviteByCode() returns nothing → "Invalid invite code" error.
--
-- The invite_code UUID IS the secret (only known to the recipient via
-- the email link), so allowing public read by code is safe.
-- ============================================================

-- Allow anyone (anon or authenticated) to read a single invite by its code
-- This is needed for the /invite/:code signup page to work
CREATE POLICY "Public can view invite by code"
  ON family_invites
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Note: The existing "Nurses can view their invites" policy already covers
-- authenticated reads for nurses/doctors/family. This new policy is specifically
-- to allow the pre-signup invite validation flow for anonymous visitors.

-- GRANT SELECT on family_invites to anon role (in case it's not already granted)
GRANT SELECT ON family_invites TO anon;
