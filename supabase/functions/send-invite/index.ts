// supabase/functions/send-invite/index.ts
// Send family member invite via SendGrid

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get environment variables
    const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY");
    const SENDER_EMAIL = Deno.env.get("SENDER_EMAIL");

    if (!SENDGRID_API_KEY || !SENDER_EMAIL) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing environment variables: SENDGRID_API_KEY or SENDER_EMAIL",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parse request body
    const { email, inviteLink, patientName, nurseName, familyName } = await req.json();

    // Validate inputs
    if (!email || !inviteLink) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required fields: email, inviteLink",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid email address",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Generate email HTML
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; margin: 20px 0; font-weight: bold; }
    .button:hover { background: #764ba2; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
    .highlight { color: #667eea; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>You're Invited to ContinuumCare</h1>
    </div>
    <div class="content">
      <p>Hi <span class="highlight">${familyName || "Family Member"}</span>,</p>
      
      <p>${nurseName ? `<span class="highlight">${nurseName}</span> has invited you to join <strong>ContinuumCare</strong>` : "You have been invited to join <strong>ContinuumCare</strong>"} to view and manage medical information for <span class="highlight">${
      patientName || "your patient"
    }</span>.</p>
      
      <p>ContinuumCare makes it easy to:</p>
      <ul>
        <li>View patient visit history and medical records</li>
        <li>Track health alerts and important updates</li>
        <li>Access prescriptions and lab reports</li>
        <li>Download medical history reports</li>
      </ul>
      
      <p style="text-align: center;">
        <a href="${inviteLink}" class="button">Accept Invitation & Sign Up</a>
      </p>
      
      <p style="font-size: 12px; color: #666;">
        <strong>Security Note:</strong> This link will expire in 7 days. If you didn't expect this invitation, you can safely ignore this email.
      </p>
      
      <p>If the button above doesn't work, copy and paste this link into your browser:<br>
      <code style="background: #f0f0f0; padding: 10px; display: block; overflow-wrap: break-word; margin: 10px 0;">
        ${inviteLink}
      </code>
      </p>
      
      <div class="footer">
        <p>© 2026 ContinuumCare. All rights reserved.</p>
        <p>This is a secure, HIPAA-compliant healthcare platform. Your data is encrypted and protected.</p>
      </div>
    </div>
  </div>
</body>
</html>
    `;

    // Plain text version
    const textContent = `
Hi ${familyName || "Family Member"},

${nurseName ? `${nurseName} has invited you to join ContinuumCare` : "You have been invited to join ContinuumCare"} to view and manage medical information for ${
      patientName || "your patient"
    }.

ContinuumCare makes it easy to:
- View patient visit history and medical records
- Track health alerts and important updates
- Access prescriptions and lab reports
- Download medical history reports

Accept the invitation here:
${inviteLink}

Security Note: This link will expire in 7 days. If you didn't expect this invitation, you can safely ignore this email.

---
© 2026 ContinuumCare. All rights reserved.
This is a secure, HIPAA-compliant healthcare platform.
    `;

    // Call SendGrid API
    const sendGridResponse = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: email }],
          },
        ],
        from: {
          email: SENDER_EMAIL,
          name: "ContinuumCare",
        },
        subject: "You're invited to ContinuumCare",
        content: [
          {
            type: "text/plain",
            value: textContent,
          },
          {
            type: "text/html",
            value: htmlContent,
          },
        ],
        reply_to: {
          email: SENDER_EMAIL,
        },
      }),
    });

    // Handle SendGrid response
    if (sendGridResponse.status === 202) {
      // 202 = Accepted (email queued for delivery)
      return new Response(
        JSON.stringify({
          success: true,
          message: "Email sent successfully",
          email: email,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } else if (sendGridResponse.status === 400) {
      const errorData = await sendGridResponse.json();
      return new Response(
        JSON.stringify({
          success: false,
          error: "SendGrid validation error",
          details: errorData,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } else if (sendGridResponse.status === 401) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "SendGrid authentication failed - invalid API key",
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } else {
      const errorText = await sendGridResponse.text();
      return new Response(
        JSON.stringify({
          success: false,
          error: `SendGrid API error: ${sendGridResponse.status}`,
          details: errorText,
        }),
        {
          status: sendGridResponse.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Unknown error occurred",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
