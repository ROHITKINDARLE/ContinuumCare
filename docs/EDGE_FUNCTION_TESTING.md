# 🧪 SUPABASE EDGE FUNCTION TESTING GUIDE

## ✅ YOUR SETUP (VERIFIED)

You have successfully:
- ✅ Created SendGrid API Key with Mail Send Full Access
- ✅ Verified sender email (kindarlerohit9@gmail.com)
- ✅ Created Supabase Secrets:
  - `SENDGRID_API_KEY` = SG.xxxxx
  - `SENDER_EMAIL` = kindarlerohit9@gmail.com
- ✅ Created Supabase Edge Function: `send-invite`

---

## 🚀 DEPLOYMENT CHECKLIST

### Step 1: Verify Edge Function File

**Ensure this file exists:**
```
supabase/functions/send-invite/index.ts
```

This is the **Deno TypeScript** function that:
- Accepts POST requests with `{ email, inviteLink, patientName, nurseName, familyName }`
- Calls SendGrid API via `https://api.sendgrid.com/v3/mail/send`
- Uses Supabase secrets: `SENDGRID_API_KEY` and `SENDER_EMAIL`
- Returns proper error handling + CORS headers
- Has 202 status handling (SendGrid queues emails)

### Step 2: Deploy Edge Function to Supabase

```bash
# In your project root, run:
supabase functions deploy send-invite

# Output should show:
# ✓ Function send-invite deployed successfully
```

**To verify it's deployed:**
1. Go to Supabase Dashboard
2. → Project → Edge Functions
3. Should see `send-invite` in the list
4. Status should be "✓ Active"

### Step 3: Verify Environment Variables

In Supabase Dashboard:
1. → Settings → Secrets
2. Verify:
   - ✓ `SENDGRID_API_KEY` is set
   - ✓ `SENDER_EMAIL` is set

---

## 🧪 TESTING OPTIONS

### Option 1: Browser Console (Quickest - No Code Changes)

**Step 1: Start your dev server**
```bash
npm run dev
# Server runs on http://localhost:5174
```

**Step 2: Open browser console**
- Press `F12` or right-click → Inspect → Console tab

**Step 3: Test function (copy & paste this)**
```javascript
testSendInviteEmail(
  'your_test_email@gmail.com',
  'http://localhost:5174/invite?token=test123'
)
```

**Example:**
```javascript
testSendInviteEmail(
  'rohit@example.com',
  'http://localhost:5174/invite?code=abc123xyz'
)
```

**Expected output in console:**
```
🧪 Testing edge function...
Email: rohit@example.com
Invite Link: http://localhost:5174/invite?code=abc123xyz
✅ Success! { success: true, message: "Email sent successfully", email: "rohit@example.com" }
```

**You should receive email in ~30 seconds** ✉️

---

### Option 2: Using Fetch Request Directly

If the console function doesn't work, try this fetch directly:

**Step 1: Get your Supabase URL**
- Go to Supabase Dashboard → Settings → API
- Copy "Project URL" (looks like: `https://xxxxx.supabase.co`)

**Step 2: Copy your auth token**
```javascript
// In browser console, run:
(await supabase.auth.getSession()).data?.session?.access_token
// Copy the entire token that prints
```

**Step 3: Test fetch request**
```javascript
fetch('https://YOUR_PROJECT_ID.supabase.co/functions/v1/send-invite', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_AUTH_TOKEN_HERE',
  },
  body: JSON.stringify({
    email: 'test@gmail.com',
    inviteLink: 'http://localhost:5174/invite?token=123',
    patientName: 'Jane Doe',
    nurseName: 'Sarah Smith',
    familyName: 'John Doe',
  }),
})
.then(r => r.json())
.then(data => {
  console.log('✅ Response:', data);
  if (data.success) {
    alert('✅ Email sent!');
  } else {
    alert('❌ Error: ' + data.error);
  }
})
.catch(err => {
  console.error('❌ Error:', err);
  alert('❌ Failed: ' + err.message);
});
```

---

### Option 3: React Component Button (Best for Testing)

Create a test component:

```jsx
// src/pages/TestInviteEmail.jsx
import { useState } from 'react';
import { sendInviteEmailDirect } from '../services/edgeFunctionTester';
import { Mail, CheckCircle, AlertCircle, Loader } from 'lucide-react';

export default function TestInviteEmail() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState('');

  const handleTest = async () => {
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const result = await sendInviteEmailDirect({
        email: email || 'test@example.com',
        inviteLink: 'http://localhost:5174/invite?token=test123',
        patientName: 'Jane Doe',
        nurseName: 'Sarah Smith',
        familyName: 'John Doe',
      });

      setSuccess(true);
      alert(`✅ Email sent to ${email}!\nCheck your inbox in a few moments.`);
    } catch (err) {
      setError(err.message);
      alert(`❌ Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '500px', margin: '0 auto' }}>
      <h1>📧 Test Edge Function</h1>

      <div style={{ marginBottom: '20px' }}>
        <label>Email to test:</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your_email@gmail.com"
          style={{
            width: '100%',
            padding: '10px',
            marginTop: '5px',
            border: '1px solid #ddd',
            borderRadius: '6px',
          }}
        />
      </div>

      <button
        onClick={handleTest}
        disabled={loading}
        style={{
          padding: '10px 20px',
          background: '#667eea',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        {loading ? (
          <>
            <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} />
            Sending...
          </>
        ) : (
          <>
            <Mail size={18} />
            Send Test Email
          </>
        )}
      </button>

      {error && (
        <div
          style={{
            marginTop: '20px',
            padding: '15px',
            background: '#fee2e2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {success && (
        <div
          style={{
            marginTop: '20px',
            padding: '15px',
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            color: '#065f46',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <CheckCircle size={20} />
          ✅ Email sent successfully!
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
```

Then add to your App.jsx for testing:
```jsx
// Temporarily add this route for testing
<Route path="/test-email" element={<TestInviteEmail />} />
```

Visit: `http://localhost:5174/test-email`

---

## 🔍 TROUBLESHOOTING

### Issue: "Function not found" or 404 error

**Solution:**
1. Verify function is deployed: `supabase functions deploy send-invite`
2. Check Supabase dashboard → Edge Functions → `send-invite` shows as Active
3. Restart dev server: `npm run dev`

```bash
# Check deployment status
supabase functions list
```

### Issue: "Unauthorized" or 401 error

**Possible causes:**
1. Missing auth token
2. User not logged in

**Solution:**
```javascript
// Make sure you're logged in first
const { data: { user } } = await supabase.auth.getUser();
console.log('Logged in as:', user?.email);
```

If not logged in:
```javascript
// Login first
await supabase.auth.signInWithPassword({
  email: 'nurse@example.com',
  password: 'your_password',
});
```

### Issue: "SENDGRID_API_KEY is missing"

**Solution:**
1. Check Supabase Secrets are set:
   - Dashboard → Settings → Secrets
   - Should have `SENDGRID_API_KEY` and `SENDER_EMAIL`
2. Redeploy function: `supabase functions deploy send-invite`

### Issue: "Invalid email address" error

**Solution:**
- Check email format: `user@domain.com`
- Valid examples:
  - ✅ test@gmail.com
  - ✅ john.doe@company.co.uk
  - ❌ plaintext (missing @)
  - ❌ user@.com (missing domain)

### Issue: Email not received in inbox

**Checklist:**
1. Check spam/junk folder
2. Verify sender email is verified in SendGrid:
   - SendGrid Dashboard → Sender Authentication
   - Should show green ✓ for kindarlerohit9@gmail.com
3. Check edge function logs:
   ```bash
   supabase functions logs send-invite
   ```
4. If logs show "email_failed":
   - API key invalid
   - Sender email not verified
   - Email validation failed

### Issue: CORS errors in browser console

**Solution:**
The edge function includes proper CORS headers. If you still see CORS errors:
1. Check that you're calling: `https://YOUR_PROJECT_ID.supabase.co/functions/v1/send-invite`
2. Not: `https://api.sendgrid.com/...` (that won't work from browser)

---

## 📊 EXPECTED RESPONSES

### Success Response (202 from SendGrid)
```json
{
  "success": true,
  "message": "Email sent successfully",
  "email": "test@gmail.com"
}
```

### Error Response - Invalid Email
```json
{
  "success": false,
  "error": "Invalid email address"
}
```

### Error Response - Missing Fields
```json
{
  "success": false,
  "error": "Missing required fields: email, inviteLink"
}
```

### Error Response - API Key Invalid
```json
{
  "success": false,
  "error": "SendGrid authentication failed - invalid API key"
}
```

---

## 📧 WHAT TO EXPECT IN RECEIVED EMAIL

**From:**
```
ContinuumCare <kindarlerohit9@gmail.com>
```

**Subject:**
```
You're invited to ContinuumCare
```

**Body (HTML):**
- Professional gradient header
- Personalized greeting
- Patient name mention
- 4-point value proposition (bullet list)
- Large blue "Accept Invitation & Sign Up" button
- Click link in footer
- 7-day expiration warning
- HIPAA compliance notice

**Body (Plain Text):**
- Same content, text format
- All links included as clickable text

---

## 🔄 FULL FLOW TESTING

### Complete Test Flow

1. **Nurse logs in**
   ```
   Login page → nurse@example.com
   ```

2. **Nurse views patient**
   ```
   Patients → Click patient → Patient profile
   ```

3. **Nurse clicks "Invite Family Member"**
   ```
   Right sidebar → "Invite Family Member" button
   ```

4. **Nurse fills form**
   ```
   Name: John Doe
   Email: john@gmail.com
   Relationship: Spouse
   Click "Send Invite"
   ```

5. **Check success**
   ```
   ✅ Modal shows: "Invite sent to john@gmail.com"
   ✅ Invite code displayed
   ```

6. **Check email reception**
   ```
   ✉️ Email received in john@gmail.com inbox
   Subject: "You're invited to ContinuumCare"
   ```

7. **Family member clicks link**
   ```
   Email → Click "Accept Invitation" button
   Redirect to → /invite/{invite_code}
   ```

8. **Family signs up**
   ```
   Fill signup form → Set password
   Click "Create Account & Accept Invitation"
   ```

9. **Verify access**
   ```
   ✅ Redirect to dashboard
   ✅ Can see patient
   ✅ Can download medical reports
   ```

---

## 💡 PERFORMANCE & LIMITS

**SendGrid (Free Tier):**
- ✅ Up to 100 emails per day
- ✅ Unlimited contacts
- ✅ Email validation included
- ✅ Bounce/complaint tracking

**Edge Function Execution:**
- ✅ 10 second timeout
- ✅ Deno runtime (TypeScript native)
- ✅ CORS enabled
- ✅ Request size limit: 10MB

---

## 🔐 SECURITY BEST PRACTICES

✅ **API Key:**
- Stored in Supabase Secrets (encrypted)
- Never exposed in frontend code
- Never committed to git

✅ **Authorization:**
- Edge function requires auth token
- Only authenticated users can send invites

✅ **Rate Limiting:**
- Consider implementing per-user rate limit
- Example: 10 invites per hour per nurse

✅ **Validation:**
- Email format validated
- Required fields checked
- Link format verified

---

## 📋 QUICK REFERENCE

| Task | Command/Action |
|------|---|
| Deploy edge function | `supabase functions deploy send-invite` |
| View function logs | `supabase functions logs send-invite` |
| Test in console | `testSendInviteEmail('email@test.com', 'link')` |
| Check secrets | Supabase Dashboard → Settings → Secrets |
| View emails sent | SendGrid Dashboard → Activity |
| Test component | Visit `http://localhost:5174/test-email` |

---

## 🎯 NEXT STEPS

1. ✅ Verify edge function is deployed
2. ✅ Check Supabase secrets are set
3. ✅ Test using browser console
4. ✅ Check email reception
5. ✅ Test complete invite flow
6. ✅ Deploy to production

You're all set! 🚀
