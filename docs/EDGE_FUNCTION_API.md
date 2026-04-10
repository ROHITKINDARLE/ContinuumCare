# 📡 SUPABASE EDGE FUNCTION API REFERENCE

## Function Overview

**Name:** `send-invite`

**Purpose:** Securely send email invitations to family members with SendGrid

**Runtime:** Deno (TypeScript)

**Endpoint:** `POST /functions/v1/send-invite`

---

## Authentication

### Required

All requests must include:

```
Authorization: Bearer {access_token}
```

Where `{access_token}` is a valid Supabase auth token from logged-in user.

**To get token in browser:**
```typescript
const { data: { session } } = await supabase.auth.getSession();
const token = session?.access_token;
```

**To get token in React:**
```javascript
import { useAuth } from '@/contexts/AuthContext';

const { supabaseClient } = useAuth();
const { data: { session } } = await supabaseClient.auth.getSession();
```

### CORS

The function includes CORS headers:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

✅ Requests from any origin are allowed (pre-flight OPTIONS requests handled automatically)

---

## Request

### HTTP Method

```
POST
```

### URL

Replace `YOUR_PROJECT_ID` with your actual Supabase project ID:

```
https://YOUR_PROJECT_ID.supabase.co/functions/v1/send-invite
```

**Example:**
```
https://xcvbnmasdfqwerty.supabase.co/functions/v1/send-invite
```

### Headers

```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer YOUR_AUTH_TOKEN"
}
```

### Body

```json
{
  "email": "john@example.com",
  "inviteLink": "https://yourapp.com/invite/code123",
  "patientName": "Jane Doe",
  "nurseName": "Sarah Smith",
  "familyName": "John Doe"
}
```

**Field Descriptions:**

| Field | Type | Required | Description |
|-------|------|----------|---|
| `email` | string | ✅ Yes | Family member's email address (`user@domain.com`) |
| `inviteLink` | string | ✅ Yes | Full URL to accept invite (e.g., `https://yourapp.com/invite/abc123`) |
| `patientName` | string | ✅ Yes | Name of patient being invited to share records with |
| `nurseName` | string | ✅ Yes | Name of nurse sending the invitation |
| `familyName` | string | ✅ Yes | Name of family member being invited |

**Validation Rules:**

- `email`: Must be valid email format (contains @ and domain)
- `inviteLink`: Must start with http:// or https://
- All fields: No null/undefined values
- All fields: Non-empty strings

---

## Response

### Success Response (202 Accepted)

Email queued with SendGrid for delivery.

```json
{
  "success": true,
  "message": "Email sent successfully",
  "email": "john@example.com"
}
```

**Status Code:** `202 Accepted`

**Interpretation:** SendGrid accepted the email for delivery. Email typically arrives within 30 seconds.

### Error Responses

#### 400 Bad Request - Missing Fields

```json
{
  "success": false,
  "error": "Missing required fields: email, inviteLink"
}
```

**Common causes:**
- One or more fields omitted from request body
- Field value is null or empty string

**Fix:** Include all 5 required fields with non-empty values

---

#### 400 Bad Request - Invalid Email

```json
{
  "success": false,
  "error": "Invalid email address: john@example"
}
```

**Common causes:**
- Missing domain (e.g., john@example instead of john@example.com)
- Missing @ symbol
- Special characters in improper place

**Fix:** Use valid email format: `user@domain.com`

---

#### 401 Unauthorized

```json
{
  "success": false,
  "error": "SendGrid authentication failed - invalid API key"
}
```

**Common causes:**
- API key in Supabase Secrets is invalid
- API key expired
- API key doesn't have Mail Send permission

**Fix:**
1. Verify API key in Supabase → Settings → Secrets
2. Check API key in SendGrid Dashboard
3. Regenerate if necessary
4. Redeploy function: `supabase functions deploy send-invite`

---

#### 401 Unauthorized - Missing Sender Email

```json
{
  "success": false,
  "error": "SendGrid sender email not configured"
}
```

**Common causes:**
- SENDER_EMAIL secret not set in Supabase
- SENDER_EMAIL not verified in SendGrid

**Fix:**
1. Add SENDER_EMAIL to Supabase Secrets
2. Verify email in SendGrid → Sender Authentication
3. Wait 10-15 minutes for verification
4. Redeploy function

---

#### 500 Internal Server Error

```json
{
  "success": false,
  "error": "Internal server error: [error details]"
}
```

**Common causes:**
- Deno runtime error
- Network connectivity issue
- Function timeout (>10 seconds)

**Fix:**
1. Check function logs: `supabase functions logs send-invite`
2. Verify all environment variables are set
3. Test with simpler request
4. Restart function: `supabase functions deploy send-invite`

---

## Usage Examples

### JavaScript/Fetch

```javascript
async function sendInviteEmail() {
  const { data: { session } } = await supabase.auth.getSession();
  
  const response = await fetch(
    'https://xcvbnmasdfqwerty.supabase.co/functions/v1/send-invite',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        email: 'john@example.com',
        inviteLink: 'https://continuum.app/invite/abc123',
        patientName: 'Jane Doe',
        nurseName: 'Sarah Smith',
        familyName: 'John Doe'
      })
    }
  );

  const data = await response.json();
  
  if (data.success) {
    console.log('✅ Email sent to', data.email);
  } else {
    console.error('❌ Error:', data.error);
  }
}
```

### React Hook

```javascript
import { useAuth } from '@/contexts/AuthContext';

export function useInviteEmail() {
  const { supabaseClient } = useAuth();

  const sendInvite = async (inviteData) => {
    const { data: { session } } = await supabaseClient.auth.getSession();
    
    const response = await fetch(
      `${supabaseClient.supabaseUrl}/functions/v1/send-invite`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify(inviteData)
      }
    );

    return await response.json();
  };

  return { sendInvite };
}
```

### Using inviteService.js

```javascript
import { createAndSendInvite } from '@/services/inviteService';

const result = await createAndSendInvite({
  patientId: 'patient-uuid',
  nurseName: 'Sarah Smith',
  familyEmail: 'john@example.com',
  familyName: 'John Doe',
  relationship: 'Spouse',
  notes: 'Father of patient' // optional
});

if (result.success) {
  console.log('Invite code:', result.inviteCode);
} else {
  console.error('Error:', result.error);
}
```

### Edge Function Tester

```javascript
import { sendInviteEmailDirect } from '@/services/edgeFunctionTester';

const result = await sendInviteEmailDirect({
  email: 'john@example.com',
  inviteLink: 'https://continuum.app/invite/abc123',
  patientName: 'Jane Doe',
  nurseName: 'Sarah Smith',
  familyName: 'John Doe'
});

console.log(result);
// { success: true, message: "...", email: "john@example.com" }
```

---

## Email Template

### HTML Email

The email contains:

**Header:**
- Gradient background (purple to pink)
- ContinuumCare branding

**Content:**
1. Personalized greeting: "Hi [familyName],"
2. Introduction: Nurse [nurseName] has invited you
3. Patient: "[patientName]"
4. Value proposition (4 bullet points):
   - Real-time health monitoring
   - Secure patient records access
   - Instant health alerts
   - Collaborative care coordination
5. Large blue button: "Accept Invitation & Sign Up"
   - Links to [inviteLink]

**Footer:**
- Link to accept invitation
- 7-day expiration notice
- HIPAA compliance notice
- Unsubscribe information (if applicable)

### Plain Text Email

Same content in plain text format with all links included.

---

## Rate Limiting

**Current:** No rate limiting implemented

**Recommended:** Add per-user rate limiting to prevent abuse

```javascript
// Example: 10 invites per hour per nurse
const userInviteCount = await getInviteCountLastHour(userId);
if (userInviteCount >= 10) {
  throw new Error('Rate limit exceeded: 10 invites per hour');
}
```

---

## Security Considerations

### API Key Protection

✅ **Secure:** Stored in Supabase Environment Secrets (encrypted)
❌ **Insecure:** Never commit to git or expose in frontend code

### Email Validation

✅ Uses regex validation
✅ Checks email format before sending

### CORS

✅ Allows requests from any origin (public function)
⚠️ Consider restricting to your domain in production:

```typescript
const corsOrigin = Deno.env.get('ALLOWED_ORIGIN') || '*';
headers.set('Access-Control-Allow-Origin', corsOrigin);
```

### Authorization

✅ Requires valid auth token from Supabase
✅ Prevents unauthenticated access

### Input Sanitization

✅ Validates all required fields
✅ No SQL injection possible (no database direct calls)
✅ No template injection (pre-built email template)

---

## Monitoring & Debugging

### View Function Logs

```bash
supabase functions logs send-invite
```

**Example output:**
```
2024-01-15 10:30:45 - ✅ Email request received
2024-01-15 10:30:45 - 📧 Sending to: john@example.com
2024-01-15 10:30:46 - ✅ SendGrid response: 202
2024-01-15 10:30:46 - ✅ Function completed
```

### SendGrid Dashboard

1. Go to https://app.sendgrid.com
2. Click "Activity → Mail Activity"
3. See all emails sent with status:
   - ✅ Delivered
   - ⏳ Processed
   - ❌ Failed
   - 📬 Bounced

**For failed emails:** Click email → See error reason

---

## Testing Checklist

- [ ] Edge function deployed: `supabase functions deploy send-invite`
- [ ] Supabase secrets configured: SENDGRID_API_KEY, SENDER_EMAIL
- [ ] SendGrid sender email verified
- [ ] Auth token available
- [ ] Test email sent and received
- [ ] Response status is 202
- [ ] Email content is correct
- [ ] All links are clickable
- [ ] No duplicates sent
- [ ] Logs show successful request

---

## Performance

**Response Time:** 200-500ms (including SendGrid API call)

**Email Delivery Time:** 10-30 seconds to inbox

**Timeout:** 10 seconds (Supabase edge function limit)

---

## Common Integration Patterns

### Pattern 1: Invite After Patient Added

```javascript
async function addPatientAndInvite(patientData, familyData) {
  // Create patient
  const patient = await createPatient(patientData);
  
  // Send family invite
  const invite = await createAndSendInvite({
    patientId: patient.id,
    nurseName: currentNurse.name,
    familyEmail: familyData.email,
    familyName: familyData.name,
    relationship: familyData.relationship
  });
  
  return { patient, invite };
}
```

### Pattern 2: Batch Invites

```javascript
async function inviteMultipleFamilyMembers(patientId, familyMembers) {
  const results = [];
  
  for (const family of familyMembers) {
    try {
      const result = await createAndSendInvite({
        patientId,
        nurseName: currentNurse.name,
        familyEmail: family.email,
        familyName: family.name,
        relationship: family.relationship
      });
      results.push({ email: family.email, success: true });
    } catch (error) {
      results.push({ 
        email: family.email, 
        success: false, 
        error: error.message 
      });
    }
  }
  
  return results;
}
```

### Pattern 3: Retry on Failure

```javascript
async function sendInviteWithRetry(inviteData, maxRetries = 3) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await createAndSendInvite(inviteData);
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        // Wait 2 seconds before retry
        await new Promise(r => setTimeout(r, 2000));
      }
    }
  }
  
  throw new Error(`Failed after ${maxRetries} attempts: ${lastError.message}`);
}
```

---

## Support & Troubleshooting

**Issue: 404 Function Not Found**
- Verify deployment: `supabase functions list`
- Redeploy: `supabase functions deploy send-invite`

**Issue: 500 Internal Error**
- Check logs: `supabase functions logs send-invite`
- Verify secrets are set
- Check for typos in environment variables

**Issue: Email Not Received**
- Check spam folder
- Verify sender email is verified in SendGrid
- Check SendGrid dashboard → Activity
- Verify email format is valid

**Issue: CORS Error**
- Function already handles CORS
- Try making request from Postman first (no CORS)
- Check Authorization header is included

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024-01-15 | Initial release |

---

**Questions?** Check the testing guide: [EDGE_FUNCTION_TESTING.md](./EDGE_FUNCTION_TESTING.md)
