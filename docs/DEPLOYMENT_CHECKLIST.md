# 📋 DEPLOYMENT & RELEASE CHECKLIST

## Phase 3: Supabase Edge Function Deployment

Complete this checklist to deploy the email invite system to production.

---

## ✅ PRE-DEPLOYMENT VERIFICATION

### Database Schema

- [ ] **Verify Schema Deployed**
  ```bash
  # Check Supabase dashboard → SQL Editor
  # Tables should exist: family_invites, invite_audit_logs
  ```
  - Expected tables:
    - ✓ `public.family_invites`
    - ✓ `public.invite_audit_logs`
  - Expected functions:
    - ✓ `cleanup_expired_invites()`
    - ✓ `log_invite_action()`

- [ ] **Check RLS Policies**
  - Go to Supabase → Authentication → Policies
  - On `family_invites` table, should see:
    - ✓ "Nurses can create family invites"
    - ✓ "Nurses can view their invites"
    - ✓ "Family can see their own invites"
    - ✓ "Family can accept/decline their invites"

- [ ] **Test Database Connection**
  - Open Supabase SQL Editor
  - Run:
    ```sql
    SELECT * FROM family_invites LIMIT 1;
    ```
    - Should return empty table (no error)

---

### SendGrid Configuration

- [ ] **API Key Created & Stored**
  - Has "Mail Send" Full Access
  - Format: `SG.xxxxx`
  - Location: Saved in secure password manager (NOT in code)

- [ ] **Sender Email Verified**
  - Email: kindarlerohit9@gmail.com
  - Status in SendGrid: ✓ Verified (green checkmark)
  - How to verify:
    - SendGrid Dashboard → Settings → Sender Authentication
    - Click "Verify a Single Sender"
    - Should see green ✓ next to your email

- [ ] **SendGrid API Key Has Correct Permissions**
  - Dashboard → Settings → API Keys
  - Your key should have:
    - ✓ Mail Send (read & write)
    - ✗ No other unnecessary permissions

---

### Supabase Configuration

- [ ] **Environment Secrets Set**
  - Go to Supabase → Settings → Secrets
  - Should have both:
    - ✓ `SENDGRID_API_KEY` = SG.xxxxx
    - ✓ `SENDER_EMAIL` = kindarlerohit9@gmail.com
  - Values should NOT be visible in plain text

- [ ] **Project URL Retrieved**
  - Supabase → Settings → API
  - Copy: Project URL (looks like: `https://xxxxx.supabase.co`)
  - Location: Save in `.env.local` or keep handy for testing

---

## 🚀 DEPLOYMENT STEPS

### Step 1: Deploy Edge Function

```bash
# From your project root directory
supabase functions deploy send-invite

# Expected output:
# ✓ Function send-invite deployed successfully
# ✓ Endpoint: https://PROJECT_ID.supabase.co/functions/v1/send-invite
```

**Verify deployment:**
```bash
# List all functions
supabase functions list

# Output should show:
# send-invite Active
```

**Alternative: Deploy via Supabase Dashboard**
1. Supabase → Functions
2. Click "New Function" → Name it `send-invite`
3. Copy entire contents of `supabase/functions/send-invite/index.ts`
4. Paste into editor
5. Click "Deploy"

### Step 2: Verify Function is Active

1. Open Supabase Dashboard
2. Navigate to: Functions (left sidebar)
3. Should see: `send-invite` with status "Active" ✓
4. Click on it → Should show endpoint URL

### Step 3: Start Development Server

```bash
npm run dev

# Expected output:
# ✓ http://localhost:5173/ ready in 200ms
# (or localhost:5174 if port is in use)
```

**Keep terminal running!** The dev server must stay active for testing.

---

## 🧪 TESTING PHASE

### Test 1: Browser Console Quick Test

**Duration:** 2 minutes

```bash
# While dev server is running:
1. Open browser → http://localhost:5173
2. Press F12 (or right-click → Inspect)
3. Go to Console tab
4. Paste and run:

testSendInviteEmail(
  'your_personal_email@gmail.com',
  'http://localhost:5173/invite?token=test123'
)

# Expected:
# ✅ Success message in popup
# 📧 Email arrives in ~30 seconds
```

**If it fails:**
- Check browser console for error message
- See Troubleshooting section below

### Test 2: Complete Invite Flow

**Duration:** 5 minutes

```
1. Login as Nurse
   - Email: nurse@example.com
   - Password: (your test password)

2. View a patient
   - Go to Patients → Pick a patient

3. Click "Invite Family Member"
   - Button in right sidebar

4. Fill form:
   - Name: John Test
   - Email: your_personal_email@gmail.com
   - Relationship: Spouse
   - Notes: (empty is ok)

5. Click "Send Invite"
   - Modal should show: "Invite sent to your_personal_email@gmail.com"
   - Should display invite code

6. Check email
   - Subject: "You're invited to ContinuumCare"
   - From: kindarlerohit9@gmail.com
   - Contains: Accept button with link

7. Click link in email
   - Should redirect to /invite/{code}

8. Sign up as family member
   - Name: John Test
   - Email: your_personal_email@gmail.com
   - Password: Create one
   - Click "Create Account"

9. Verify access
   - Should access dashboard
   - Can see patient's information
```

**Success Criteria:**
- ✅ Email received
- ✅ Link works
- ✅ Signup works
- ✅ Can view patient data
- ✅ No error messages

### Test 3: Error Handling

**Test invalid email:**
```javascript
testSendInviteEmail(
  'notemail',  // Missing @
  'http://localhost:5173/invite?token=test'
)
// Expected: Error message "Invalid email address"
```

**Test missing data:**
```javascript
testSendInviteEmail(
  '',  // Empty email
  ''   // Empty link
)
// Expected: Error "Missing required fields"
```

**Test unauthorized:**
1. Open DevTools Console
2. Clear auth token:
   ```javascript
   await supabase.auth.signOut();
   testSendInviteEmail('test@gmail.com', 'http://localhost:5173/invite/test')
   // Expected: Unauthorized error
   ```

---

## 📊 PRODUCTION CHECKLIST

### Code Quality

- [ ] **No console.log() statements left**
  - Search project for: `console.log`
  - Remove all development logging

- [ ] **No hardcoded secrets**
  - Check all files for API keys
  - Check `.env` files don't contain real secrets
  - `.env` should only have placeholders

- [ ] **Error handling complete**
  - All edge cases handled
  - User-friendly error messages shown
  - No technical errors exposed to users

- [ ] **Code review completed**
  - Have another developer review:
    - `supabase/functions/send-invite/index.ts`
    - `src/services/inviteService.js`
    - `src/services/edgeFunctionTester.js`

### Security

- [ ] **CORS properly configured**
  - Function allows requests from your domain
  - CSRF protection in place (if needed)

- [ ] **Rate limiting implemented** (recommended)
  - Prevent sending 1000 invites per second
  - Example: 10 invites per hour per user

- [ ] **Email validation robust**
  - Handles edge cases
  - Regex validation works for international emails

- [ ] **Authorization checked**
  - Only nurses can create invites ✓
  - Only family with link can accept ✓
  - RLS policies prevent unauthorized access ✓

- [ ] **Audit logging enabled**
  - Invite creation logged ✓
  - Invite acceptance logged ✓
  - Can trace all invite activity for compliance

### Infrastructure

- [ ] **Environment variables set in production**
  - Supabase → Settings → Secrets
  - Both variables configured:
    - SENDGRID_API_KEY
    - SENDER_EMAIL

- [ ] **Database has adequate backups**
  - Supabase automatically backs up daily
  - Can restore from backup if needed

- [ ] **Function monitoring set up**
  - Can view logs: `supabase functions logs send-invite`
  - Can see errors if they occur
  - Alerts configured (if available)

- [ ] **SendGrid account secured**
  - API key is secret (not shared)
  - Backup API key created
  - Account 2FA enabled (if available)

### Documentation

- [ ] **README updated**
  - New feature documented
  - Setup instructions included

- [ ] **API documentation created**
  - ✓ Endpoint documented
  - ✓ Request/response formats documented
  - ✓ Error codes documented
  - ✓ Examples provided

- [ ] **Testing guide provided**
  - Step-by-step testing documented
  - Troubleshooting guide created
  - Known issues documented

- [ ] **Deployment guide created**
  - This checklist! ✓
  - Step-by-step instructions
  - Rollback procedures

---

## 🚀 PRODUCTION DEPLOYMENT

### Before Going Live

**48 hours before launch:**
- [ ] Test complete flow with real SendGrid account
- [ ] Verify all emails delivering to inbox (not spam)
- [ ] Check SendGrid dashboard shows emails in Activity log
- [ ] Have support team review documentation

**24 hours before launch:**
- [ ] Notify stakeholders of launch time
- [ ] Prepare rollback plan
- [ ] Test edge case scenarios
- [ ] Brief team on new feature

**launch time:**
- [ ] Deploy to production environment
- [ ] Monitor function logs for errors
- [ ] Check SendGrid delivery reports
- [ ] Be available for support calls

### Launch Steps

1. **Ensure all tests pass locally**
   - ✅ Browser console test works
   - ✅ Complete flow works
   - ✅ Error handling works

2. **Deploy to production**
   - Already deployed to Supabase (edge function)
   - Build frontend: `npm run build`
   - Deploy frontend to production (Vercel, Netlify, etc.)

3. **Verify in production**
   - Test with production domain
   - Verify SendGrid is sending emails
   - Check that links point to production (not localhost)

4. **Monitor for issues**
   - First hour: Watch error logs
   - Check SendGrid dashboard
   - Monitor email delivery rates

---

## 🔄 ROLLBACK PROCEDURE

**If something goes wrong:**

### Rollback Option 1: Disable Edge Function

```bash
# Temporarily disable function (keep code intact)
supabase functions delete send-invite

# To revert delete:
supabase functions deploy send-invite
```

### Rollback Option 2: Disable Invite Feature

**In `src/pages/PatientProfile.jsx`:**
```javascript
// Temporarily hide invite button
return (
  <div>
    {/* <button onClick={() => setShowInviteModal(true)}>
      Invite Family Member
    </button> */}
    {/* Feature under maintenance */}
  </div>
);
```

### Rollback Option 3: Stop SendGrid Emails

**In `supabase/functions/send-invite/index.ts`:**
```typescript
// Temporarily return error
if (true) {
  return new Response(
    JSON.stringify({ 
      success: false, 
      error: "Feature temporarily down for maintenance" 
    }),
    { status: 503, headers }
  );
}
```

---

## 📞 SUPPORT & MONITORING

### Ongoing Monitoring

**Daily:**
- [ ] Check SendGrid dashboard → Activity
- [ ] Look for failed emails or bounces
- [ ] Ask users if invites are working

**Weekly:**
- [ ] Review edge function logs
- [ ] Check invite acceptance rate
- [ ] Monitor for suspicious activity

**Monthly:**
- [ ] Review SendGrid analytics
- [ ] Check email delivery metrics
- [ ] Update documentation if needed

### Common Support Questions

**Q: "I didn't receive the invite email"**
A:
1. Check spam/junk folder
2. Verify email address is correct
3. Wait 1-2 minutes (might be delayed)
4. Check SendGrid activity dashboard

**Q: "The link is broken"**
A:
1. Make sure link has full URL (not just invite code)
2. Verify app is running (not in maintenance)
3. Check browser console for errors

**Q: "Can I resend an invite?"**
A:
1. Currently: Delete old invite, create new one
2. Future: Implement "Resend Invite" button

---

## 📈 SUCCESS METRICS

After going live, track:

| Metric | Target | How to Measure |
|--------|--------|---|
| Email delivery rate | > 95% | SendGrid dashboard |
| Invite acceptance rate | > 50% | Database queries |
| Response time | < 500ms | Edge function logs |
| Error rate | < 1% | Function error tracking |
| User satisfaction | > 4/5 | Customer feedback |

---

## 🐛 TROUBLESHOOTING

### Problem: "Function returns 404"

**Solution:**
1. Verify deployment: `supabase functions list`
2. Check function name is exactly: `send-invite`
3. Redeploy: `supabase functions deploy send-invite`
4. Wait 30 seconds and test again

### Problem: "Unauthorized" error

**Solution:**
1. Verify auth token being sent
2. Check user is logged in
3. Try logging out and back in
4. Verify Supabase session is valid

### Problem: "Email stuck in pending"

**Solution:**
1. Check SendGrid API key is valid
2. Verify sender email verified in SendGrid
3. Check SendGrid activity dashboard
4. Verify email format is valid
5. Try with different email address

### Problem: "Emails going to spam"

**Solution:**
1. Add SPF/DKIM records (SendGrid documentation)
2. Use branded domain instead of @gmail.com (better practice)
3. Build reputation by sending small volume first
4. Monitor spam complaints on SendGrid

### Problem: "CORS error in browser"

**Solution:**
- Edge function has CORS headers
- Verify you're calling edge function (not SendGrid API directly)
- Check Authorization header is included
- Try from Postman first (easier debugging)

---

## 📝 SIGN-OFF

**Person responsible for deployment:**
- Name: ___________________
- Date: ___________________
- Time: ___________________
- Status: ✅ Deployed / ❌ Rollback

**Testing completed by:**
- Name: ___________________
- Date: ___________________
- Email test: ✅ Pass / ❌ Fail
- Flow test: ✅ Pass / ❌ Fail

**Approved for production:**
- Name: ___________________
- Date: ___________________
- Notes: ___________________

---

**Congratulations! 🎉 Email invite system is now live!**

### Next Steps After Launch

1. Monitor for 7 days
2. Gather user feedback
3. Plan improvements:
   - Resend invite button
   - Invite templates
   - Rate limiting
   - Analytics dashboard
4. Schedule post-launch review

---

**Document Version:** 1.0
**Last Updated:** 2024-01-15
**Maintained By:** [Your Name]
