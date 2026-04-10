import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getPatients } from '../services/patients';
import { getRecentVisits } from '../services/visits';
import { getAlerts } from '../services/alerts';
import StatCard from '../components/StatCard';
import AlertBadge from '../components/AlertBadge';
import DisclaimerBanner from '../components/DisclaimerBanner';
import { Users, AlertTriangle, ClipboardList, Activity, Bell, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

export default function Dashboard() {
  const { profile, isDoctor, isNurse, isFamily } = useAuth();
  const [patients, setPatients] = useState([]);
  const [visits, setVisits] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [pats, vis, alts] = await Promise.all([
          getPatients().catch(() => []),
          getRecentVisits(8).catch(() => []),
          getAlerts().catch(() => []),
        ]);
        setPatients(pats || []);
        setVisits(vis || []);
        setAlerts(alts || []);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <div className="spinner" />
          <p className="loading-text">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const activeAlerts = alerts.filter(a => a.status === 'active');
  const criticalAlerts = activeAlerts.filter(a => a.severity === 'critical');

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>{greeting()}, {profile?.full_name?.split(' ')[0] || 'User'}</h1>
        <p>
          {isDoctor && 'Here\'s an overview of your patients and active alerts.'}
          {isNurse && 'Here are your assigned patients and pending tasks.'}
          {isFamily && 'View your loved one\'s health status and alerts.'}
        </p>
      </div>

      {criticalAlerts.length > 0 && (
        <DisclaimerBanner message={`⚠️ ${criticalAlerts.length} critical alert${criticalAlerts.length > 1 ? 's' : ''} require immediate attention. These alerts are assistive and do not replace clinical judgment.`} />
      )}

      <div className="stat-cards-grid">
        <StatCard
          icon={Users}
          label="Total Patients"
          value={patients.length}
          variant="brand"
        />
        <StatCard
          icon={ClipboardList}
          label="Recent Visits"
          value={visits.length}
          variant="info"
        />
        <StatCard
          icon={AlertTriangle}
          label="Active Alerts"
          value={activeAlerts.length}
          variant={activeAlerts.length > 0 ? 'danger' : 'success'}
        />
        <StatCard
          icon={Activity}
          label="Critical Alerts"
          value={criticalAlerts.length}
          variant={criticalAlerts.length > 0 ? 'danger' : 'success'}
        />
      </div>

      <div className="content-grid">
        {/* Active Alerts */}
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Bell size={18} /> Active Alerts
                </span>
              </h2>
              <p className="card-subtitle">{activeAlerts.length} alerts need attention</p>
            </div>
            <Link to="/alerts" className="btn btn-ghost btn-sm">
              View All <ArrowRight size={14} />
            </Link>
          </div>
          {activeAlerts.length === 0 ? (
            <div className="empty-state" style={{ padding: 'var(--spacing-xl) 0' }}>
              <p className="text-muted text-sm">No active alerts. All clear! ✓</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
              {activeAlerts.slice(0, 5).map(alert => (
                <div
                  key={alert.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 'var(--spacing-md)',
                    background: 'var(--color-bg-primary)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <AlertBadge severity={alert.severity} />
                      <span className="text-sm font-semibold">
                        {alert.patient?.full_name || 'Patient'}
                      </span>
                    </div>
                    <p className="text-xs text-muted">{alert.message}</p>
                  </div>
                  <span className="text-xs text-muted">
                    {format(new Date(alert.created_at), 'h:mm a')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Visits */}
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Activity size={18} /> Recent Visits
                </span>
              </h2>
              <p className="card-subtitle">Latest patient visit entries</p>
            </div>
            {(isDoctor || isNurse) && (
              <Link to="/visits/new" className="btn btn-primary btn-sm">
                Add Visit
              </Link>
            )}
          </div>
          {visits.length === 0 ? (
            <div className="empty-state" style={{ padding: 'var(--spacing-xl) 0' }}>
              <p className="text-muted text-sm">No visits recorded yet.</p>
            </div>
          ) : (
            <div className="table-container" style={{ border: 'none' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>SpO₂</th>
                    <th>BP</th>
                    <th>Temp</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {visits.slice(0, 6).map(visit => (
                    <tr key={visit.id}>
                      <td>
                        <Link to={`/patients/${visit.patient_id}`} className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                          {visit.patient?.full_name || '—'}
                        </Link>
                      </td>
                      <td>
                        <span className={`vital-value ${visit.spo2 ? (visit.spo2 < 92 ? 'critical' : visit.spo2 < 95 ? 'warning' : 'normal') : ''}`}>
                          {visit.spo2 ?? '—'}
                        </span>
                      </td>
                      <td>{visit.systolic_bp && visit.diastolic_bp ? `${visit.systolic_bp}/${visit.diastolic_bp}` : '—'}</td>
                      <td>{visit.temperature_f ? `${visit.temperature_f}°F` : '—'}</td>
                      <td className="text-muted text-sm">
                        {format(new Date(visit.visited_at), 'MMM d, h:mm a')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
