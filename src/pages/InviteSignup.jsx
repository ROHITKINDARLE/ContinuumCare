/**
 * INVITE SIGNUP PAGE
 * Page where family members accept invite and sign up
 * Route: /invite/:inviteCode
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Mail, AlertCircle, CheckCircle, Loader, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getInviteByCode, acceptInvite } from '../services/inviteService';
import '../styles/invite-signup.css';

export default function InviteSignup() {
  const { inviteCode } = useParams();
  const navigate = useNavigate();

  // States
  const [loading, setLoading] = useState(true);
  const [inviteData, setInviteData] = useState(null);
  const [step, setStep] = useState('validate'); // 'validate', 'signup', 'success', 'error', 'already-member', 'already-signup'
  const [error, setError] = useState('');

  // Form states
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validate invite on mount
  useEffect(() => {
    validateInvite();
  }, [inviteCode]);

  const validateInvite = async () => {
    try {
      setLoading(true);
      setError('');

      if (!inviteCode) {
        setError('Invalid invite link - no code provided');
        setStep('error');
        return;
      }

      // Get invite details
      const result = await getInviteByCode(inviteCode);

      if (!result.success) {
        setError(result.message);
        setStep('error');
        return;
      }

      // Check if user is already logged in
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (authUser) {
        // User is logged in, check if they have permission to accept
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', authUser.id)
          .single();

        if (profile?.role === 'family') {
          // Already a family member, check if they're already assigned to this patient
          const { data: assignment } = await supabase
            .from('patient_assignments')
            .select('id')
            .eq('patient_id', result.invite.patientId)
            .eq('staff_id', authUser.id)
            .single();

          if (assignment) {
            setStep('already-member');
            setInviteData(result.invite);
            return;
          }

          // Not yet assigned, can still accept
          setInviteData(result.invite);
          setFormData((prev) => ({
            ...prev,
            email: authUser.email || '',
          }));
          setStep('already-signup');
          return;
        }
      }

      // Invite is valid, show signup form
      setInviteData(result.invite);
      setFormData((prev) => ({
        ...prev,
        email: result.invite.familyEmail,
      }));
      setStep('signup');
    } catch (err) {
      console.error('Invite validation error:', err);
      setError(err.message || 'Failed to validate invite');
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setFormError('');
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    try {
      // Validate form
      if (!formData.email) {
        throw new Error('Email is required');
      }
      if (!formData.password) {
        throw new Error('Password is required');
      }
      if (formData.password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }
      if (formData.password !== formData.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      // Sign up with Supabase Auth
      const { data: authData, error: signupError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: inviteData.familyName,
            role: 'family',
          },
        },
      });

      if (signupError) {
        if (signupError.message.includes('already registered')) {
          throw new Error('This email is already registered. Please sign in instead.');
        }
        throw signupError;
      }

      if (!authData.user) {
        throw new Error('Signup failed - no user data returned');
      }

      // Supabase email enumeration protection: when an email is already registered,
      // Supabase returns a fake user object with an empty identities array instead of
      // throwing an error. That fake UUID doesn't exist in auth.users, causing FK failures.
      if (authData.user.identities && authData.user.identities.length === 0) {
        throw new Error('This email is already registered. Please sign in instead, or use a different email address.');
      }
      // Brief wait for Supabase auth to propagate new user to auth.users
      // before the accept function tries to set user_id (FK to auth.users)
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Accept the invite — pass family name so profile can be seeded correctly
      const acceptResult = await acceptInvite(inviteCode, authData.user.id, inviteData?.familyName);

      if (!acceptResult.success) {
        throw new Error(acceptResult.message);
      }

      // Sign the user in immediately (email confirmation should be disabled for invite flow)
      // This saves the family member from having to log in again after signup
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (signInError) {
        // If sign-in fails (e.g. email confirmation still required), go to success screen
        // so user knows to check email — but invite is already accepted
        setStep('success');
        return;
      }

      // Signed in successfully → go straight to dashboard
      navigate('/', { replace: true });

    } catch (err) {
      console.error('Signup error:', err);
      setFormError(err.message || 'Failed to sign up');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAcceptAsExistingUser = async () => {
    try {
      setIsSubmitting(true);
      setFormError('');

      // Get current user
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !authUser) {
        throw new Error('You must be logged in to accept this invite');
      }

      // Accept the invite
      const result = await acceptInvite(inviteCode, authUser.id);

      if (!result.success) {
        throw new Error(result.message);
      }

      // Success!
      setStep('success');
    } catch (err) {
      console.error('Accept error:', err);
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render loading state
  if (loading) {
    return (
      <div className="invite-container">
        <div className="invite-card loading">
          <Loader size={48} className="spinner" />
          <p>Validating invite...</p>
        </div>
      </div>
    );
  }

  // Render error state - invalid/expired invite
  if (step === 'error') {
    return (
      <div className="invite-container">
        <div className="invite-card error">
          <AlertCircle size={48} color="#ef4444" />
          <h1>Invalid Invite</h1>
          <p className="error-message">{error}</p>
          <button className="btn-primary" onClick={() => navigate('/')}>
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Render already member state
  if (step === 'already-member') {
    return (
      <div className="invite-container">
        <div className="invite-card success">
          <CheckCircle size={48} color="#10b981" />
          <h1>Already a Member</h1>
          <p>
            You're already a family member with access to {inviteData?.patientName}'s medical information.
          </p>
          <button className="btn-primary" onClick={() => navigate('/')}>
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Render already signed up state
  if (step === 'already-signup') {
    return (
      <div className="invite-container">
        <div className="invite-card">
          <CheckCircle size={48} color="#10b981" />
          <h1>Accept Invitation</h1>
          <p>You're logged in as <strong>{formData.email}</strong></p>
          <p className="secondary">
            Click below to accept the invitation and gain access to {inviteData?.patientName}'s medical record.
          </p>

          <button
            className="btn-primary full-width"
            onClick={handleAcceptAsExistingUser}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader size={18} className="spinner" />
                Accepting...
              </>
            ) : (
              'Accept Invitation'
            )}
          </button>

          {formError && (
            <div className="error-box">
              <AlertCircle size={18} />
              <span>{formError}</span>
            </div>
          )}

          <button
            className="btn-secondary full-width"
            onClick={() => {
              supabase.auth.signOut();
              navigate('/login');
            }}
            disabled={isSubmitting}
          >
            Sign in with different account
          </button>
        </div>
      </div>
    );
  }

  // Render success state
  if (step === 'success') {
    return (
      <div className="invite-container">
        <div className="invite-card success">
          <CheckCircle size={48} color="#10b981" />
          <h1>Welcome to ContinuumCare!</h1>
          <p>Your account has been created successfully.</p>
          <p className="secondary">
            You now have access to {inviteData?.patientName}'s medical information, including visits, prescriptions, lab reports, and more.
          </p>

          <div className="what-next">
            <h3>What's Next:</h3>
            <ul>
              <li>View {inviteData?.patientName}'s medical records</li>
              <li>Download comprehensive medical history reports</li>
              <li>Track health alerts and updates</li>
              <li>Access prescriptions and lab results</li>
            </ul>
          </div>

          <button className="btn-primary" onClick={() => navigate('/')}>
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Render signup form
  return (
    <div className="invite-container">
      <div className="invite-card">
        <div className="invite-header">
          <Mail size={32} color="#667eea" />
          <h1>Join ContinuumCare</h1>
          <p>Sign up to access {inviteData?.patientName}'s medical information</p>
        </div>

        <form onSubmit={handleSignup} className="invite-form">
          {/* Invite Info */}
          <div className="invite-info">
            <p>
              <strong>{inviteData?.familyName}</strong> has been invited as a family member
              {inviteData?.relationship && ` (${inviteData.relationship})`}
            </p>
          </div>

          {/* Form Fields */}
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              disabled
              className="input-disabled"
            />
            <small>This email was used for the invitation</small>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-input">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="At least 6 characters"
                disabled={isSubmitting}
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isSubmitting}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="password-input">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Re-enter password"
                disabled={isSubmitting}
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isSubmitting}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Error */}
          {formError && (
            <div className="error-box">
              <AlertCircle size={18} />
              <span>{formError}</span>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            className="btn-primary full-width"
            disabled={isSubmitting || !formData.password}
          >
            {isSubmitting ? (
              <>
                <Loader size={18} className="spinner" />
                Creating Account...
              </>
            ) : (
              'Create Account & Accept Invitation'
            )}
          </button>
        </form>

        {/* Already have account */}
        <p className="already-account">
          Already have an account?{' '}
          <button
            type="button"
            onClick={() => navigate('/login')}
            style={{ color: '#667eea', fontWeight: 600, border: 'none', background: 'none', cursor: 'pointer' }}
          >
            Sign in here
          </button>
        </p>

        {/* Privacy notice */}
        <p className="privacy-notice">
          By signing up, you agree to ContinuumCare's Terms of Service and Privacy Policy. Your health information is HIPAA-protected and encrypted.
        </p>
      </div>
    </div>
  );
}

/**
 * STYLES for invite-signup.css:
 * 
 * .invite-container {
 *   display: flex;
 *   align-items: center;
 *   justify-content: center;
 *   min-height: 100vh;
 *   background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
 *   padding: 20px;
 * }
 *
 * .invite-card {
 *   background: white;
 *   border-radius: 12px;
 *   box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
 *   padding: 40px;
 *   max-width: 450px;
 *   width: 100%;
 * }
 *
 * .invite-card.loading,
 * .invite-card.error,
 * .invite-card.success {
 *   display: flex;
 *   flex-direction: column;
 *   align-items: center;
 *   text-align: center;
 * }
 *
 * .invite-card.loading svg,
 * .invite-card.success svg {
 *   margin-bottom: 20px;
 * }
 *
 * .spinner {
 *   animation: spin 1s linear infinite;
 * }
 *
 * @keyframes spin {
 *   from { transform: rotate(0deg); }
 *   to { transform: rotate(360deg); }
 * }
 *
 * .invite-header {
 *   display: flex;
 *   flex-direction: column;
 *   align-items: center;
 *   text-align: center;
 *   margin-bottom: 30px;
 * }
 *
 * .invite-header svg {
 *   margin-bottom: 15px;
 * }
 *
 * .invite-header h1 {
 *   font-size: 24px;
 *   margin: 0 0 10px;
 *   color: #1f2937;
 * }
 *
 * .invite-header p {
 *   margin: 0;
 *   color: #666;
 *   font-size: 14px;
 * }
 *
 * .invite-info {
 *   background: #f0f9ff;
 *   border: 1px solid #bfdbfe;
 *   border-radius: 6px;
 *   padding: 12px 15px;
 *   margin-bottom: 20px;
 *   font-size: 14px;
 *   color: #1e40af;
 * }
 *
 * .form-group {
 *   margin-bottom: 20px;
 * }
 *
 * .form-group label {
 *   display: block;
 *   margin-bottom: 6px;
 *   font-weight: 600;
 *   font-size: 14px;
 *   color: #374151;
 * }
 *
 * .form-group input[type="email"],
 * .form-group input[type="password"],
 * .form-group input[type="text"] {
 *   width: 100%;
 *   padding: 10px 12px;
 *   border: 1px solid #d1d5db;
 *   border-radius: 6px;
 *   font-size: 14px;
 *   font-family: inherit;
 *   box-sizing: border-box;
 * }
 *
 * .form-group input:focus {
 *   outline: none;
 *   border-color: #667eea;
 *   box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
 * }
 *
 * .input-disabled {
 *   background: #f9fafb;
 *   color: #6b7280;
 *   cursor: not-allowed;
 * }
 *
 * .password-input {
 *   position: relative;
 *   display: flex;
 * }
 *
 * .password-input input {
 *   flex: 1;
 * }
 *
 * .toggle-password {
 *   position: absolute;
 *   right: 12px;
 *   top: 50%;
 *   transform: translateY(-50%);
 *   background: none;
 *   border: none;
 *   cursor: pointer;
 *   color: #9ca3af;
 *   padding: 0;
 *   display: flex;
 *   align-items: center;
 * }
 *
 * .toggle-password:hover {
 *   color: #667eea;
 * }
 *
 * .form-group small {
 *   display: block;
 *   margin-top: 4px;
 *   font-size: 12px;
 *   color: #999;
 * }
 *
 * .error-box {
 *   display: flex;
 *   align-items: center;
 *   gap: 10px;
 *   background: #fee2e2;
 *   border: 1px solid #fecaca;
 *   color: #dc2626;
 *   padding: 12px 15px;
 *   border-radius: 6px;
 *   margin-bottom: 20px;
 *   font-size: 14px;
 * }
 *
 * .btn-primary,
 * .btn-secondary {
 *   display: flex;
 *   align-items: center;
 *   justify-content: center;
 *   gap: 8px;
 *   padding: 12px 16px;
 *   border: none;
 *   border-radius: 6px;
 *   font-size: 14px;
 *   font-weight: 600;
 *   cursor: pointer;
 *   transition: all 0.2s ease;
 * }
 *
 * .btn-primary {
 *   background: #667eea;
 *   color: white;
 *   width: 100%;
 * }
 *
 * .btn-primary:hover:not(:disabled) {
 *   background: #764ba2;
 * }
 *
 * .btn-primary:disabled {
 *   background: #cbd5e1;
 *   cursor: not-allowed;
 * }
 *
 * .btn-secondary {
 *   background: #e5e7eb;
 *   color: #374151;
 *   width: 100%;
 * }
 *
 * .btn-secondary:hover:not(:disabled) {
 *   background: #d1d5db;
 * }
 *
 * .full-width {
 *   width: 100%;
 * }
 *
 * .already-account {
 *   text-align: center;
 *   margin: 20px 0;
 *   font-size: 14px;
 *   color: #666;
 * }
 *
 * .privacy-notice {
 *   font-size: 12px;
 *   color: #999;
 *   text-align: center;
 *   margin: 15px 0 0;
 *   line-height: 1.4;
 * }
 *
 * .what-next {
 *   background: #ecfdf5;
 *   border: 1px solid #a7f3d0;
 *   border-radius: 6px;
 *   padding: 15px;
 *   margin: 20px 0;
 *   text-align: left;
 * }
 *
 * .what-next h3 {
 *   margin: 0 0 10px;
 *   font-size: 14px;
 *   color: #065f46;
 * }
 *
 * .what-next ul {
 *   margin: 0;
 *   padding-left: 20px;
 *   font-size: 13px;
 *   color: #047857;
 * }
 *
 * .what-next li {
 *   margin: 5px 0;
 * }
 */
