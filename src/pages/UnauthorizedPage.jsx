import { useNavigate } from 'react-router-dom';
import { Lock, ArrowLeft } from 'lucide-react';

export default function UnauthorizedPage() {
  const navigate = useNavigate();

  return (
    <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div className="empty-state" style={{ maxWidth: 500 }}>
        <div style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: 'var(--color-danger-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 'var(--spacing-xl)',
          margin: '0 auto var(--spacing-xl)',
        }}>
          <Lock size={40} style={{ color: 'var(--color-danger)' }} />
        </div>
        
        <h3 className="empty-state-title" style={{ fontSize: 'var(--font-size-2xl)' }}>
          Access Denied
        </h3>
        
        <p className="empty-state-message" style={{ marginBottom: 'var(--spacing-xl)' }}>
          You don't have permission to access this page. Your current role does not allow this action.
        </p>

        <div style={{ display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/')}
            style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}
          >
            <ArrowLeft size={18} />
            Go to Dashboard
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => navigate(-1)}
          >
            Go Back
          </button>
        </div>

        <p style={{
          fontSize: 'var(--font-size-sm)',
          color: 'var(--color-text-tertiary)',
          marginTop: 'var(--spacing-2xl)',
        }}>
          If you believe this is an error, please contact your administrator.
        </p>
      </div>
    </div>
  );
}
