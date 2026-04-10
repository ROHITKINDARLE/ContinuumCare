/**
 * EDGE FUNCTION TESTER
 * Utility to test the Supabase send-invite edge function
 * Usage in React: const { sendInviteEmail, loading, error } = useInviteEmailTesting();
 * Usage in browser console: testSendInviteEmail('email@gmail.com', 'http://localhost:5173/invite/test')
 */

import { useState } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Helper to get the current user's access token (Supabase v2 compatible)
 */
async function getAccessToken() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || '';
}

/**
 * React hook to test sending invite emails via Supabase Edge Function
 * @returns {Object} - { sendInviteEmail, loading, error, success }
 */
export function useInviteEmailTesting() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const sendInviteEmail = async (emailData) => {
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const result = await sendInviteEmailDirect(emailData);
      setSuccess(true);
      return result;
    } catch (err) {
      const errorMessage = err.message || 'Failed to send email';
      setError(errorMessage);
      console.error('❌ Send invite email error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { sendInviteEmail, loading, error, success };
}

/**
 * Direct function to send invite email (no React hook needed)
 * Can be called from anywhere in the app
 * @param {Object} emailData - { email, inviteLink, patientName, nurseName, familyName }
 * @returns {Promise} - Response from edge function
 */
export async function sendInviteEmailDirect(emailData) {
  try {
    const supabaseUrl = supabase.supabaseUrl;
    if (!supabaseUrl) {
      throw new Error('Supabase URL not configured');
    }

    const token = await getAccessToken();

    const response = await fetch(
      `${supabaseUrl}/functions/v1/send-invite`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: emailData.email,
          inviteLink: emailData.inviteLink,
          patientName: emailData.patientName || 'Test Patient',
          nurseName: emailData.nurseName || 'Test Nurse',
          familyName: emailData.familyName || 'Test Family Member',
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}`);
    }

    console.log('✅ Email sent successfully:', data);
    return data;
  } catch (err) {
    console.error('❌ Send invite error:', err);
    throw err;
  }
}

/**
 * TEST: Simple function to test the edge function from browser console
 * Usage: Copy & paste into browser console and run:
 * testSendInviteEmail('your_email@gmail.com', 'http://localhost:5173/invite?token=test123')
 */
export async function testSendInviteEmail(email, inviteLink) {
  console.log('🧪 Testing edge function...');
  console.log('Email:', email);
  console.log('Invite Link:', inviteLink);

  try {
    const result = await sendInviteEmailDirect({
      email: email,
      inviteLink: inviteLink,
      patientName: 'Test Patient',
      nurseName: 'Test Nurse',
      familyName: 'Test Family Member',
    });

    console.log('✅ Success!', result);
    alert(`✅ Email sent to ${email}!\n\nCheck your inbox in a few moments.`);
    return result;
  } catch (err) {
    console.error('❌ Error:', err);
    alert(`❌ Error: ${err.message}`);
    throw err;
  }
}

// Expose to browser console for easy testing
if (typeof window !== 'undefined') {
  window.testSendInviteEmail = testSendInviteEmail;
  window.sendInviteEmailDirect = sendInviteEmailDirect;
}
