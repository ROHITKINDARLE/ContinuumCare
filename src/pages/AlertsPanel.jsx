import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getAlerts, acknowledgeAlert, resolveAlert, subscribeToAlerts } from '../services/alerts';
import AlertBadge from '../components/AlertBadge';
import DisclaimerBanner from '../components/DisclaimerBanner';
import { Bell, Check, CheckCheck, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

const SEVERITY_SECTIONS = [
  { key: 'critical', label: '🔴 Critical',  color: '#dc2626', bg: 'rgba(220,38,38,0.06)' },
  { key: 'medium',   label: '🟡 Medium',    color: '#f59e0b', bg: 'rgba(245,158,11,0.06)' },
  { key: 'low',      label: '🟢 Low',       color: '#10b981', bg: 'rgba(16,185,129,0.06)' },
];

function AlertCard({ alert, canWrite, onAcknowledge, onResolve, isResolving }) {
  const severityColor = alert.severity === 'critical' ? '#dc2626' : alert.severity === 'medium' ? '#f59e0b' : '#10b981';

  return (
    <div
      style={{
        borderLeft: `3px solid ${severityColor}`,
        background: 'var(--color-bg-primary)',
        borderRadius: 'var(--radius-md)',
        padding: '14px 16px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        flexWrap: 'wrap', gap: 12,
        opacity: isResolving ? 0 : 1,
        transform: isResolving ? 'translateY(8px)' : 'none',
        transition: 'opacity 0.4s ease, transform 0.4s ease',
      }}
    >
      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
          <AlertBadge severity={alert.severity} />
          <span className={`badge ${alert.status === 'active' ? 'badge-critical' : alert.status === 'acknowledged' ? 'badge-medium' : 'badge-success'}`}>
            {alert.status}
          </span>
          <Link to={`/patients/${alert.patient?.id}`} className="font-semibold" style={{ color: 'var(--color-brand-primary-hover)', fontSize: 'var(--font-size-sm)' }}>
            {alert.patient?.full_name || 'Unknown Patient'}
          </Link>
        </div>
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginBottom: 6 }}>
          {alert.message}
        </p>
        <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>
          {format(new Date(alert.created_at), 'MMM d, yyyy · h:mm a')}
          {alert.acknowledged_by_profile && (
            <span> · {alert.status === 'resolved' ? 'Resolved' : 'Acknowledged'} by {alert.acknowledged_by_profile.full_name}</span>
          )}
        </div>
      </div>

      {canWrite && alert.status !== 'resolved' && (
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          {alert.status === 'active' && (
            <button className="btn btn-secondary btn-sm" onClick={() => onAcknowledge(alert.id)}>
              <Check size={13} /> Acknowledge
            </button>
          )}
          <button className="btn btn-success btn-sm" onClick={() => onResolve(alert.id)}>
            <CheckCheck size={13} /> Resolve
          </button>
        </div>
      )}
    </div>
  );
}

export default function AlertsPanel() {
  const { user, canWrite } = useAuth();
  const [alerts, setAlerts]               = useState([]);
  const [loading, setLoading]             = useState(true);
  const [resolvingIds, setResolvingIds]   = useState(new Set());
  const [showResolved, setShowResolved]   = useState(false);

  useEffect(() => {
    fetchAlerts();
    const unsubscribe = subscribeToAlerts(() => fetchAlerts());
    return unsubscribe;
  }, []);

  const fetchAlerts = async () => {
    try {
      const data = await getAlerts();
      setAlerts(data || []);
    } catch (err) {
      console.error('Error fetching alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (alertId) => {
    try {
      await acknowledgeAlert(alertId, user.id);
      await fetchAlerts();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleResolve = async (alertId) => {
    // Fade animation then resolve
    setResolvingIds(prev => new Set(prev).add(alertId));
    setTimeout(async () => {
      try {
        await resolveAlert(alertId, user.id);
        await fetchAlerts();
      } catch (err) {
        alert('Error: ' + err.message);
      } finally {
        setResolvingIds(prev => { const s = new Set(prev); s.delete(alertId); return s; });
      }
    }, 400);
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container"><div className="spinner" /><p className="loading-text">Loading alerts...</p></div>
      </div>
    );
  }

  const activeAlerts   = alerts.filter(a => a.status !== 'resolved');
  const resolvedAlerts = alerts.filter(a => a.status === 'resolved');
  const criticalCount  = activeAlerts.filter(a => a.severity === 'critical').length;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
          <Bell size={28} /> Alert Center
        </h1>
        <p>
          {activeAlerts.length} active alert{activeAlerts.length !== 1 ? 's' : ''}
          {criticalCount > 0 && (
            <span style={{ color: '#dc2626', fontWeight: 700 }}> · {criticalCount} critical</span>
          )}
        </p>
      </div>

      <DisclaimerBanner />

      {activeAlerts.length === 0 && (
        <div className="empty-state">
          <Bell size={48} className="empty-state-icon" />
          <h3 className="empty-state-title">All clear</h3>
          <p className="empty-state-message">No active alerts — all patients stable.</p>
        </div>
      )}

      {/* Severity sections */}
      {SEVERITY_SECTIONS.map(section => {
        const sectionAlerts = activeAlerts.filter(a => a.severity === section.key);
        if (sectionAlerts.length === 0) return null;
        return (
          <div key={section.key} style={{ marginBottom: 'var(--spacing-xl)' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 14px', borderRadius: 'var(--radius-md)',
              background: section.bg, marginBottom: 12,
              borderLeft: `4px solid ${section.color}`,
            }}>
              <span style={{ fontWeight: 700, fontSize: 'var(--font-size-sm)', color: section.color }}>
                {section.label}
              </span>
              <span style={{
                width: 20, height: 20, borderRadius: '50%',
                background: section.color, color: 'white',
                fontSize: 11, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {sectionAlerts.length}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {sectionAlerts.map(alert => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  canWrite={canWrite}
                  onAcknowledge={handleAcknowledge}
                  onResolve={handleResolve}
                  isResolving={resolvingIds.has(alert.id)}
                />
              ))}
            </div>
          </div>
        );
      })}

      {/* Resolved section — collapsible at bottom */}
      {resolvedAlerts.length > 0 && (
        <div style={{ marginTop: 'var(--spacing-xl)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--spacing-xl)' }}>
          <button
            onClick={() => setShowResolved(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'none', border: 'none', cursor: 'pointer', width: '100%',
              color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', fontWeight: 600,
              padding: '6px 0', marginBottom: 12,
            }}
          >
            {showResolved ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            ✅ Resolved ({resolvedAlerts.length})
          </button>

          {showResolved && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, opacity: 0.7 }}>
              {resolvedAlerts.map(alert => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  canWrite={false}
                  onAcknowledge={() => {}}
                  onResolve={() => {}}
                  isResolving={false}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
