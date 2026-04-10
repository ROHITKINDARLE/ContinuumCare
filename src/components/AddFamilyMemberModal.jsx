/**
 * ADD FAMILY MEMBER MODAL
 * Component for nurses to invite family members via email
 */

import React, { useState } from 'react';
import { X, Mail, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { createAndSendInvite } from '../services/inviteService';
import '../styles/modal.css'; // Reuse existing modal styles

export default function AddFamilyMemberModal({ patientId, patientName, isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    familyName: '',
    familyEmail: '',
    relationship: '',
    notes: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [emailErrorDetail, setEmailErrorDetail] = useState('');
  const [copyFeedback, setCopyFeedback] = useState('');

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError(''); // Clear error when user types
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Validate inputs
      if (!formData.familyName.trim()) {
        throw new Error('Family member name is required');
      }
      if (!formData.familyEmail.trim()) {
        throw new Error('Email address is required');
      }
      if (!formData.familyEmail.includes('@')) {
        throw new Error('Please enter a valid email address');
      }

      // Create and send invite
      const result = await createAndSendInvite({
        patientId,
        familyName: formData.familyName.trim(),
        familyEmail: formData.familyEmail.trim(),
        relationship: formData.relationship || null,
        notes: formData.notes || null,
      });

      if (!result.success) {
        throw new Error(result.message);
      }

      setSuccess(true);
      setInviteCode(result.inviteCode);
      setInviteLink(result.inviteLink || '');
      setEmailSent(result.emailSent !== false);
      setEmailErrorDetail(result.emailError || '');

      // Call success callback
      if (onSuccess) {
        onSuccess(result);
      }
      // Modal stays open — user closes with ✕ after reading/copying the invite link
    } catch (err) {
      console.error('Error creating invite:', err);
      setError(err.message || 'Failed to send invite');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      familyName: '',
      familyEmail: '',
      relationship: '',
      notes: '',
    });
    setError('');
    setSuccess(false);
    setInviteCode('');
    setInviteLink('');
    setEmailSent(false);
    setEmailErrorDetail('');
    setCopyFeedback('');
    onClose();
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopyFeedback('Copied!');
      setTimeout(() => setCopyFeedback(''), 2000);
    });
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Invite Family Member</h2>
          <button className="modal-close" onClick={handleClose}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-body">
          {success ? (
            <div className="success-state">
              <CheckCircle size={48} color={emailSent ? '#10b981' : '#f59e0b'} />
              <h3>{emailSent ? 'Invite Sent!' : 'Invite Created!'}</h3>

              {emailSent ? (
                <p>
                  An invitation email has been sent to{' '}
                  <strong>{formData.familyEmail}</strong>
                </p>
              ) : (
                <div
                  style={{
                    background: '#fffbeb',
                    border: '1px solid #fcd34d',
                    borderRadius: '6px',
                    padding: '10px 14px',
                    color: '#92400e',
                    fontSize: '13px',
                    marginBottom: '12px',
                    textAlign: 'left',
                  }}
                >
                  <strong>⚠️ Email failed to send.</strong>
                  {' '}Share the link below with <strong>{formData.familyEmail}</strong> manually.
                  {emailErrorDetail && (
                    <div style={{ marginTop: '6px', fontSize: '11px', opacity: 0.8, fontFamily: 'monospace', wordBreak: 'break-all' }}>
                      Error: {emailErrorDetail}
                    </div>
                  )}
                </div>
              )}

              {/* Invite Link (always shown for easy copying) */}
              {inviteLink && (
                <div className="invite-details">
                  <p className="detail-label">Invite Link — Share This:</p>
                  <div className="invite-code-box">
                    <code style={{ fontSize: '11px', wordBreak: 'break-all' }}>{inviteLink}</code>
                    <button
                      className="copy-button"
                      onClick={() => handleCopy(inviteLink)}
                      title="Copy invite link"
                    >
                      {copyFeedback === 'Copied!' ? '✅' : '📋'}
                    </button>
                  </div>
                </div>
              )}

              {/* Invite Code */}
              <div className="invite-details" style={{ marginTop: '8px' }}>
                <p className="detail-label">Invite Code:</p>
                <div className="invite-code-box">
                  <code>{inviteCode}</code>
                  <button
                    className="copy-button"
                    onClick={() => handleCopy(inviteCode)}
                    title="Copy invite code"
                  >
                    {copyFeedback === 'Copied!' ? '✅' : '📋'}
                  </button>
                </div>
              </div>

              <p className="secondary" style={{ fontSize: '12px', marginTop: '10px' }}>
                This invite expires in 7 days.
              </p>

              <button
                className="btn-secondary"
                onClick={handleClose}
                style={{ marginTop: '16px', width: '100%', justifyContent: 'center' }}
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && (
                <div className="error-message">
                  <AlertCircle size={18} />
                  <span>{error}</span>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="familyName">Family Member Name *</label>
                <input
                  type="text"
                  id="familyName"
                  name="familyName"
                  value={formData.familyName}
                  onChange={handleChange}
                  placeholder="e.g., John Smith"
                  disabled={isLoading}
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label htmlFor="familyEmail">Email Address *</label>
                <input
                  type="email"
                  id="familyEmail"
                  name="familyEmail"
                  value={formData.familyEmail}
                  onChange={handleChange}
                  placeholder="john@example.com"
                  disabled={isLoading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="relationship">Relationship (Optional)</label>
                <select
                  id="relationship"
                  name="relationship"
                  value={formData.relationship}
                  onChange={handleChange}
                  disabled={isLoading}
                >
                  <option value="">Select relationship...</option>
                  <option value="spouse">Spouse</option>
                  <option value="parent">Parent</option>
                  <option value="child">Child</option>
                  <option value="sibling">Sibling</option>
                  <option value="grandparent">Grandparent</option>
                  <option value="friend">Friend</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="notes">Additional Notes (Optional)</label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Any additional information for the invitation..."
                  rows="3"
                  disabled={isLoading}
                />
              </div>

              <div className="info-box">
                <Mail size={16} />
                <p>
                  An invitation email will be sent to <strong>{formData.familyEmail || 'the provided address'}</strong> with a secure link to sign up.
                </p>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleClose}
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isLoading || !formData.familyName || !formData.familyEmail}
                >
                  {isLoading ? (
                    <>
                      <Loader size={18} className="spinner" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail size={18} />
                      Send Invite
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * STYLES (can be added to shared modal.css or component-specific)
 * 
 * .success-state {
 *   text-align: center;
 *   padding: 30px 0;
 * }
 *
 * .success-state h3 {
 *   margin: 15px 0 10px;
 *   font-size: 18px;
 *   color: #1f2937;
 * }
 *
 * .success-state p {
 *   margin: 10px 0;
 *   color: #666;
 * }
 *
 * .success-state .secondary {
 *   font-size: 14px;
 *   color: #999;
 * }
 *
 * .invite-details {
 *   background: #f0f9ff;
 *   border: 1px solid #bfdbfe;
 *   border-radius: 6px;
 *   padding: 15px;
 *   margin: 20px 0;
 * }
 *
 * .detail-label {
 *   margin: 0 0 10px;
 *   font-size: 12px;
 *   font-weight: 600;
 *   text-transform: uppercase;
 *   color: #64748b;
 * }
 *
 * .invite-code-box {
 *   display: flex;
 *   align-items: center;
 *   gap: 10px;
 *   background: white;
 *   border: 1px solid #e2e8f0;
 *   border-radius: 4px;
 *   padding: 10px 12px;
 *   font-family: 'Monaco', 'Courier New', monospace;
 *   font-size: 12px;
 * }
 *
 * .invite-code-box code {
 *   flex: 1;
 *   overflow: auto;
 * }
 *
 * .copy-button {
 *   background: none;
 *   border: none;
 *   cursor: pointer;
 *   font-size: 16px;
 *   padding: 0 4px;
 * }
 *
 * .copy-button:hover {
 *   opacity: 0.7;
 * }
 *
 * .error-message {
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
 * .form-group input,
 * .form-group select,
 * .form-group textarea {
 *   width: 100%;
 *   padding: 10px 12px;
 *   border: 1px solid #d1d5db;
 *   border-radius: 6px;
 *   font-size: 14px;
 *   font-family: inherit;
 * }
 *
 * .form-group input:focus,
 * .form-group select:focus,
 * .form-group textarea:focus {
 *   outline: none;
 *   border-color: #667eea;
 *   box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
 * }
 *
 * .form-group input:disabled,
 * .form-group select:disabled,
 * .form-group textarea:disabled {
 *   background: #f9fafb;
 *   color: #9ca3af;
 *   cursor: not-allowed;
 * }
 *
 * .info-box {
 *   display: flex;
 *   gap: 10px;
 *   background: #f3f4f6;
 *   border: 1px solid #e5e7eb;
 *   border-radius: 6px;
 *   padding: 12px 15px;
 *   font-size: 13px;
 *   color: #666;
 *   margin-bottom: 20px;
 * }
 *
 * .info-box svg {
 *   flex-shrink: 0;
 *   color: #667eea;
 * }
 *
 * .modal-actions {
 *   display: flex;
 *   gap: 10px;
 *   justify-content: flex-end;
 * }
 *
 * .btn-primary,
 * .btn-secondary {
 *   display: flex;
 *   align-items: center;
 *   gap: 8px;
 *   padding: 10px 16px;
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
 * }
 *
 * .btn-secondary:hover:not(:disabled) {
 *   background: #d1d5db;
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
 */
