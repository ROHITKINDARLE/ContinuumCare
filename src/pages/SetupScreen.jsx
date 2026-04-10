import { Heart, ExternalLink, Copy, Check } from 'lucide-react';
import { useState } from 'react';

export default function SetupScreen() {
  const [copied, setCopied] = useState(false);

  const envExample = `VITE_SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`;

  const copy = () => {
    navigator.clipboard.writeText(envExample);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="login-page">
      <div className="login-card" style={{ maxWidth: 560 }}>
        <div className="login-brand">
          <div className="login-brand-icon">
            <Heart size={28} />
          </div>
          <h1>ContinuumCare</h1>
          <p>Setup Required</p>
        </div>

        <div style={{
          background: 'var(--color-warning-light)',
          border: '1px solid rgba(245,158,11,0.3)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--spacing-lg)',
          marginBottom: 'var(--spacing-xl)',
        }}>
          <p style={{ color: 'var(--color-warning)', fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>
            ⚠️ Supabase credentials not configured
          </p>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', marginTop: 'var(--spacing-sm)' }}>
            Create a <code style={{ background: 'var(--color-bg-tertiary)', padding: '2px 6px', borderRadius: 4 }}>.env</code> file
            in the project root with your Supabase credentials to get started.
          </p>
        </div>

        <ol style={{ paddingLeft: 'var(--spacing-xl)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
          <li style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
            <strong style={{ color: 'var(--color-text-primary)' }}>Create a Supabase project</strong> at{' '}
            <a href="https://supabase.com" target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              supabase.com <ExternalLink size={12} />
            </a>
          </li>
          <li style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
            <strong style={{ color: 'var(--color-text-primary)' }}>Run the SQL schema</strong> from{' '}
            <code style={{ background: 'var(--color-bg-tertiary)', padding: '2px 6px', borderRadius: 4 }}>supabase/supabase_schema.sql</code>
            {' '}in your Supabase SQL Editor
          </li>
          <li style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
            <strong style={{ color: 'var(--color-text-primary)' }}>Create a <code style={{ background: 'var(--color-bg-tertiary)', padding: '2px 6px', borderRadius: 4 }}>.env</code> file</strong> in the root:
            <div style={{ position: 'relative', marginTop: 'var(--spacing-md)' }}>
              <pre style={{
                background: 'var(--color-bg-primary)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--spacing-base)',
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-brand-secondary)',
                overflowX: 'auto',
                lineHeight: 1.7,
              }}>{envExample}</pre>
              <button onClick={copy} className="btn btn-ghost btn-sm" style={{ position: 'absolute', top: 8, right: 8 }}>
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
          </li>
          <li style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
            <strong style={{ color: 'var(--color-text-primary)' }}>Restart the dev server</strong>:{' '}
            <code style={{ background: 'var(--color-bg-tertiary)', padding: '2px 6px', borderRadius: 4 }}>npm run dev</code>
          </li>
        </ol>

        <div style={{ marginTop: 'var(--spacing-2xl)', padding: 'var(--spacing-base)', background: 'var(--color-bg-primary)', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>
          Your Supabase URL and anon key are found in: <strong style={{ color: 'var(--color-text-secondary)' }}>Project Settings → API</strong>
        </div>
      </div>
    </div>
  );
}
