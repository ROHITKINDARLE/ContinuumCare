/**
 * INVITE SERVICE
 * Handles family member invitations via email
 * Features: Create invites, send emails, validate tokens, track audit logs
 */

import { supabase } from '../lib/supabase';

/**
 * Email configuration - swap this out for your email provider
 * Supports: Supabase Edge Functions, SendGrid, Resend, etc.
 */
const EMAIL_CONFIG = {
  provider: 'supabase', // 'supabase' | 'sendgrid' | 'resend' | 'console'
  // For development, can override with 'console'
  devMode: process.env.NODE_ENV === 'development',
};

/**
 * Generate a professional email template for family invite
 */
function generateEmailHTML(data) {
  const { familyName, patientName, nurseName, inviteLink, expiresIn } = data;

  return `
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
      <p>Hi <span class="highlight">${escapeHtml(familyName)}</span>,</p>
      
      <p><span class="highlight">${escapeHtml(nurseName)}</span> has invited you to join <strong>ContinuumCare</strong> to view and manage medical information for <span class="highlight">${escapeHtml(patientName)}</span>.</p>
      
      <p>ContinuumCare makes it easy to:</p>
      <ul>
        <li>View patient visit history and medical records</li>
        <li>Track health alerts and important updates</li>
        <li>Access prescriptions and lab reports</li>
        <li>Download medical history reports</li>
      </ul>
      
      <p style="text-align: center;">
        <a href="${escapeHtml(inviteLink)}" class="button">Accept Invitation & Sign Up</a>
      </p>
      
      <p style="font-size: 12px; color: #666;">
        <strong>Security Note:</strong> This link will expire in ${expiresIn}. If you didn't expect this invitation, you can safely ignore this email.
      </p>
      
      <p>If the button above doesn't work, copy and paste this link into your browser:<br>
      <code style="background: #f0f0f0; padding: 10px; display: block; overflow-wrap: break-word; margin: 10px 0;">
        ${escapeHtml(inviteLink)}
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
}

/**
 * Plain text email template
 */
function generateEmailText(data) {
  const { familyName, patientName, nurseName, inviteLink, expiresIn } = data;

  return `
Hi ${familyName},

${nurseName} has invited you to join ContinuumCare to view and manage medical information for ${patientName}.

ContinuumCare makes it easy to:
- View patient visit history and medical records
- Track health alerts and important updates
- Access prescriptions and lab reports
- Download medical history reports

Accept the invitation here:
${inviteLink}

Security Note: This link will expire in ${expiresIn}. If you didn't expect this invitation, you can safely ignore this email.

---
© 2026 ContinuumCare. All rights reserved.
This is a secure, HIPAA-compliant healthcare platform.
  `;
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Send email via configured provider
 * Development: logs to console
 * Production: uses real email service
 */
async function sendEmail(options) {
  const { to, subject, htmlBody, textBody, metadata } = options;

  console.log('📧 Email to send:', { to, subject });

  // Development mode: log only
  if (EMAIL_CONFIG.devMode && EMAIL_CONFIG.provider === 'console') {
    console.log('📧 [DEV MODE] Email contents:', {
      to,
      subject,
      htmlBody: htmlBody.substring(0, 200) + '...',
      textBody: textBody.substring(0, 200) + '...',
    });
    return { success: true, messageId: `dev-${Date.now()}` };
  }

  // Production: use Supabase Edge Function via supabase.functions.invoke()
  // This handles authentication automatically — no manual JWT headers needed
  if (EMAIL_CONFIG.provider === 'supabase' || EMAIL_CONFIG.provider === 'sendgrid') {
    try {
      const { data, error } = await supabase.functions.invoke('send-invite', {
        body: {
          email: to,
          inviteLink: metadata?.inviteLink,
          patientName: metadata?.patientName,
          nurseName: metadata?.nurseName,
          familyName: metadata?.familyName,
        },
      });

      if (error) {
        // FunctionsHttpError contains the actual response body
        const detail = error.context?.json?.error
          || error.context?.json?.message
          || error.message
          || 'Edge function error';
        throw new Error(detail);
      }

      if (data && data.success === false) {
        throw new Error(data.error || 'Edge function returned failure');
      }

      return { success: true, provider: 'supabase' };
    } catch (error) {
      console.error('❌ Edge function error:', error);
      throw error;
    }
  }

  throw new Error(`Unknown email provider: ${EMAIL_CONFIG.provider}`);
}


/**
 * Create a family invite and send email
 * @param {Object} inviteData - { patientId, familyName, familyEmail, relationship, notes }
 * @returns {Object} - { success, inviteId, inviteCode, message }
 */
export async function createAndSendInvite(inviteData) {
  try {
    const { patientId, familyName, familyEmail, relationship, notes } = inviteData;

    // Validate inputs
    if (!patientId || !familyName || !familyEmail) {
      throw new Error('Missing required fields: patientId, familyName, familyEmail');
    }

    if (!familyEmail.includes('@')) {
      throw new Error('Invalid email address');
    }

    // Get current user (nurse)
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      throw new Error('Authentication required');
    }

    // Get nurse profile
    const { data: nurseProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .eq('id', authUser.id)
      .single();

    if (profileError || !nurseProfile || nurseProfile.role !== 'nurse') {
      throw new Error('Only nurses can create family invites');
    }

    // Get patient name for email
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('id, full_name')
      .eq('id', patientId)
      .single();

    if (patientError || !patient) {
      throw new Error('Patient not found');
    }

    // Check if invite already exists and is not expired/declined
    const { data: existingInvite } = await supabase
      .from('family_invites')
      .select('id, status')
      .eq('patient_id', patientId)
      .eq('family_email', familyEmail)
      .in('status', ['pending', 'accepted'])
      .single();

    if (existingInvite) {
      throw new Error('An active invite already exists for this email address');
    }

    // Generate invite
    const { data: invite, error: inviteError } = await supabase
      .from('family_invites')
      .insert([
        {
          patient_id: patientId,
          nurse_id: authUser.id,
          created_by_auth_id: authUser.id,
          family_name: familyName,
          family_email: familyEmail,
          relationship: relationship || null,
          notes: notes || null,
          status: 'pending',
        },
      ])
      .select('id, invite_code, expires_at')
      .single();

    if (inviteError) {
      console.error('Invite creation error:', inviteError);
      throw new Error(`Failed to create invite: ${inviteError.message}`);
    }

    // Generate invite link using configured app URL
    // Set VITE_APP_URL in .env to your deployed URL (e.g. https://your-app.vercel.app)
    const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
    const inviteLink = `${baseUrl}/invite/${invite.invite_code}`;


    // Calculate expiry in human-readable format
    const expiresAt = new Date(invite.expires_at);
    const now = new Date();
    const daysUntilExpiry = Math.ceil(
      (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    const expiresIn =
      daysUntilExpiry === 1
        ? '1 day'
        : daysUntilExpiry === 7
          ? '7 days'
          : `${daysUntilExpiry} days`;

    // Prepare email
    const emailData = {
      familyName,
      patientName: patient.full_name,
      nurseName: nurseProfile.full_name,
      inviteLink,
      expiresIn,
    };

    const htmlBody = generateEmailHTML(emailData);
    const textBody = generateEmailText(emailData);

    // Send email
    try {
      await sendEmail({
        to: familyEmail,
        subject: `You're invited to ContinuumCare for ${patient.full_name}`,
        htmlBody,
        textBody,
        metadata: {
          // Fields the edge function reads
          inviteLink,
          patientName: patient.full_name,
          nurseName: nurseProfile.full_name,
          familyName,
          // Extra audit fields
          inviteId: invite.id,
          inviteCode: invite.invite_code,
          patientId,
        },
      });

      // Log email sent
      await supabase.from('invite_audit_logs').insert([
        {
          invite_id: invite.id,
          action: 'email_sent',
          actor_id: authUser.id,
          details: { email_to: familyEmail },
        },
      ]);
    } catch (emailError) {
      console.error('Email send error:', emailError);

      // Log email failure
      await supabase.from('invite_audit_logs').insert([
        {
          invite_id: invite.id,
          action: 'email_failed',
          actor_id: authUser.id,
          details: { error: emailError.message },
        },
      ]).then(() => {}).catch(() => {}); // Don't let audit log failure break the flow

      // Return success but flag that email failed so UI can show a warning
      return {
        success: true,
        emailSent: false,
        emailError: emailError.message,
        inviteId: invite.id,
        inviteCode: invite.invite_code,
        inviteLink,
        message: `Invite created for ${familyEmail} — but the email failed to send. Share the invite link manually.`,
      };
    }

    return {
      success: true,
      emailSent: true,
      inviteId: invite.id,
      inviteCode: invite.invite_code,
      inviteLink,
      message: `Invite sent to ${familyEmail}`,
    };
  } catch (error) {
    console.error('❌ Create invite error:', error);
    return {
      success: false,
      message: error.message || 'Failed to create invite',
    };
  }
}


/**
 * Validate and retrieve invite details by code
 * @param {string} inviteCode - UUID invite code
 * @returns {Object} - Invite details if valid
 */
export async function getInviteByCode(inviteCode) {
  try {
    if (!inviteCode) {
      throw new Error('Invite code is required');
    }

    // Use SECURITY DEFINER RPC to bypass RLS/GRANT issues for anon users.
    // The function runs with admin privileges and validates the invite server-side.
    const { data, error } = await supabase.rpc('get_family_invite', {
      p_invite_code: inviteCode,
    });

    if (error) {
      console.error('RPC error:', error);
      throw new Error('Invalid invite code');
    }

    if (!data || data.success === false) {
      throw new Error(data?.error || 'Invalid invite code');
    }

    return {
      success: true,
      invite: {
        id: data.id,
        patientId: data.patient_id,
        patientName: data.patient_name,
        nurseName: data.nurse_name,
        familyName: data.family_name,
        familyEmail: data.family_email,
        relationship: data.relationship,
        inviteCode: data.invite_code,
        expiresAt: data.expires_at,
      },
    };
  } catch (error) {
    console.error('❌ Get invite error:', error);
    return {
      success: false,
      message: error.message || 'Failed to retrieve invite',
    };
  }
}

/**
 * Accept invite after user signs up
 * Links family member to patient and creates relationship
 * @param {string} inviteCode - UUID invite code
 * @param {string} userId - Supabase auth user ID
 * @returns {Object} - { success, message, patientId }
 */
export async function acceptInvite(inviteCode, userId, familyName) {
  try {
    if (!inviteCode || !userId) {
      throw new Error('Invite code and user ID required');
    }

    // Use SECURITY DEFINER RPC — atomically updates invite, creates patient
    // assignment, and logs acceptance, bypassing all RLS/GRANT restrictions.
    // p_family_name ensures profile is created with correct name if the
    // handle_new_user trigger hasn't fired yet due to timing.
    const { data, error } = await supabase.rpc('accept_family_invite', {
      p_invite_code: inviteCode,
      p_user_id: userId,
      p_family_name: familyName || null,
    });

    if (error) {
      console.error('❌ Accept invite RPC error:', error);
      throw new Error(error.message || 'Failed to accept invite');
    }

    if (!data || data.success === false) {
      throw new Error(data?.error || 'Failed to accept invite');
    }

    return {
      success: true,
      message: data.message || 'Invite accepted successfully',
      patientId: data.patient_id,
    };
  } catch (error) {
    console.error('❌ Accept invite error:', error);
    return {
      success: false,
      message: error.message || 'Failed to accept invite',
    };
  }
}

/**
 * Get all invites for a patient (for nurse/doctor to review)
 * @param {string} patientId - Patient UUID
 * @returns {Array} - List of invites
 */
export async function getPatientInvites(patientId) {
  try {
    if (!patientId) {
      throw new Error('Patient ID required');
    }

    const { data: invites, error } = await supabase
      .from('family_invites')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return {
      success: true,
      invites: invites || [],
    };
  } catch (error) {
    console.error('❌ Get patient invites error:', error);
    return {
      success: false,
      invites: [],
      message: error.message,
    };
  }
}

/**
 * Cancel/revoke an invite (nurse can revoke their own invites)
 * @param {string} inviteId - Invite UUID
 * @returns {Object} - { success, message }
 */
export async function revokeInvite(inviteId) {
  try {
    if (!inviteId) {
      throw new Error('Invite ID required');
    }

    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      throw new Error('Authentication required');
    }

    // Get invite
    const { data: invite, error: getError } = await supabase
      .from('family_invites')
      .select('id, nurse_id, status')
      .eq('id', inviteId)
      .single();

    if (getError || !invite) {
      throw new Error('Invite not found');
    }

    // Check permission (nurse who created it can revoke)
    if (invite.nurse_id !== authUser.id) {
      throw new Error('Only the nurse who created this invite can revoke it');
    }

    // Mark as declined
    const { error: updateError } = await supabase
      .from('family_invites')
      .update({ status: 'declined' })
      .eq('id', inviteId);

    if (updateError) {
      throw updateError;
    }

    // Log revocation
    await supabase.from('invite_audit_logs').insert([
      {
        invite_id: inviteId,
        action: 'declined',
        actor_id: authUser.id,
        details: { reason: 'revoked_by_nurse' },
      },
    ]);

    return {
      success: true,
      message: 'Invite revoked successfully',
    };
  } catch (error) {
    console.error('❌ Revoke invite error:', error);
    return {
      success: false,
      message: error.message || 'Failed to revoke invite',
    };
  }
}

/**
 * Configure email provider at runtime
 */
export function configureEmailProvider(provider) {
  EMAIL_CONFIG.provider = provider;
}

/**
 * Get current email configuration (for debugging)
 */
export function getEmailConfig() {
  return EMAIL_CONFIG;
}
