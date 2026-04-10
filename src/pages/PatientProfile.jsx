import { useState, useEffect, lazy, Suspense } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getPatient } from '../services/patients';
import { getVisits, getVitalsTrend } from '../services/visits';
import { getAlerts, acknowledgeAlert, resolveAlert } from '../services/alerts';
import { getPrescriptions } from '../services/prescriptions';
import { getLabReports, createLabReport } from '../services/reports';
import VitalsChart from '../components/VitalsChart';
import PatientTimeline from '../components/PatientTimeline';
import AlertBadge from '../components/AlertBadge';
import FileUpload from '../components/FileUpload';
import DisclaimerBanner from '../components/DisclaimerBanner';
import AddFamilyMemberModal from '../components/AddFamilyMemberModal';
import NearbyServicesPanel from '../components/NearbyServicesPanel';
import { generateStructuredInsights, getVitalStatus } from '../utils/vitalsAnalysis';
import { format } from 'date-fns';
import {
  User, Activity, Bell, Pill, FileText, Calendar,
  Phone, MapPin, Heart, AlertTriangle, ArrowLeft, ExternalLink, UserPlus,
  Check, CheckCheck, ChevronDown, ChevronUp, TrendingUp, Search,
} from 'lucide-react';

const MedicineComparisonModal = lazy(() => import('../components/MedicineComparisonModal'));

// ── Tiny helpers ─────────────────────────────────────────────────────────────

const SEVERITY_ORDER = { critical: 0, medium: 1, low: 2 };

function sortedAlerts(arr) {
  return [...arr].sort((a, b) => (SEVERITY_ORDER[a.severity] ?? 3) - (SEVERITY_ORDER[b.severity] ?? 3));
}

function savingsPct(brand, generic) {
  if (!brand || !generic || brand <= 0) return null;
  const pct = Math.round(((brand - generic) / brand) * 100);
  return pct > 0 ? pct : null;
}

// ── AI Insight Card ───────────────────────────────────────────────────────────

function InsightCard({ insight }) {
  const BG = { critical: 'rgba(220,38,38,0.08)', warning: 'rgba(245,158,11,0.08)', stable: 'rgba(16,185,129,0.08)' };
  const CL = { critical: '#dc2626', warning: '#f59e0b', stable: '#059669' };
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 10,
      padding: '10px 14px', borderRadius: 'var(--radius-md)',
      background: BG[insight.urgency] || BG.stable,
      borderLeft: `3px solid ${CL[insight.urgency] || CL.stable}`,
      marginBottom: 8,
    }}>
      <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }}>{insight.emoji}</span>
      <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)', lineHeight: 1.55 }}>
        {insight.message}
      </p>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function PatientProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile, canWrite } = useAuth();

  const [patient, setPatient]           = useState(null);
  const [visits, setVisits]             = useState([]);
  const [vitalsTrend, setVitalsTrend]   = useState([]);
  const [alerts, setAlerts]             = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [reports, setReports]           = useState([]);
  const [activeTab, setActiveTab]       = useState('overview');
  const [loading, setLoading]           = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [resolvingIds, setResolvingIds] = useState(new Set());
  const [showResolvedAlerts, setShowResolvedAlerts] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [showCompareModal, setShowCompareModal] = useState(false);

  useEffect(() => { fetchAll(); }, [id]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [pat, vis, trend, alts, presc, reps] = await Promise.all([
        getPatient(id),
        getVisits(id),
        getVitalsTrend(id, 20),
        getAlerts(id),
        getPrescriptions(id),
        getLabReports(id),
      ]);
      setPatient(pat);
      setVisits(vis || []);
      setVitalsTrend(trend || []);
      setAlerts(alts || []);
      setPrescriptions(presc || []);
      setReports(reps || []);
    } catch (err) {
      console.error('Error loading patient:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReportUpload = async ({ url, fileName }) => {
    try {
      await createLabReport({ patient_id: id, uploaded_by: user.id, file_url: url, file_name: fileName, report_type: 'general' });
      const reps = await getLabReports(id);
      setReports(reps || []);
    } catch (err) { alert('Error saving report: ' + err.message); }
  };

  const handleAcknowledge = async (alertId) => {
    try { await acknowledgeAlert(alertId, user.id); await fetchAll(); }
    catch (err) { alert('Error: ' + err.message); }
  };

  const handleResolve = async (alertId) => {
    setResolvingIds(prev => new Set(prev).add(alertId));
    setTimeout(async () => {
      try { await resolveAlert(alertId, user.id); await fetchAll(); }
      catch (err) { alert('Error: ' + err.message); }
      finally { setResolvingIds(prev => { const s = new Set(prev); s.delete(alertId); return s; }); }
    }, 400);
  };

  // ── Loading / Not found ──────────────────────────────────────────────────
  if (loading) return (
    <div className="page-container">
      <div className="loading-container"><div className="spinner" /><p className="loading-text">Loading patient...</p></div>
    </div>
  );
  if (!patient) return (
    <div className="page-container">
      <div className="empty-state">
        <h3 className="empty-state-title">Patient not found</h3>
        <Link to="/patients" className="btn btn-primary">Back to Patients</Link>
      </div>
    </div>
  );

  // ── Derived data ─────────────────────────────────────────────────────────
  const activeAlerts   = alerts.filter(a => a.status !== 'resolved');
  const resolvedAlerts = alerts.filter(a => a.status === 'resolved');
  const criticalActive = activeAlerts.filter(a => a.severity === 'critical');
  const latestVisit    = visits[0];
  const aiInsights     = generateStructuredInsights(vitalsTrend);

  const timelineEvents = [
    ...visits.map(v => ({
      id: v.id, type: 'visit', date: v.visited_at,
      title: `Visit by ${v.logged_by_profile?.full_name || 'Unknown'}`,
      description: [
        v.spo2         && `SpO₂: ${v.spo2}%`,
        v.systolic_bp  && `BP: ${v.systolic_bp}/${v.diastolic_bp} mmHg`,
        v.temperature_f && `Temp: ${v.temperature_f}°F`,
        v.heart_rate   && `HR: ${v.heart_rate} bpm`,
        v.notes,
      ].filter(Boolean).join(' · '),
    })),
    ...alerts.map(a => ({
      id: a.id, type: 'alert', date: a.created_at, severity: a.severity,
      title: `${a.severity.toUpperCase()} Alert: ${a.alert_type.replace(/_/g, ' ')}`,
      description: a.message,
    })),
    ...prescriptions.map(p => ({
      id: p.id, type: 'prescription', date: p.prescribed_at,
      title: `Prescription by ${p.prescribed_by_profile?.full_name || 'Unknown'}`,
      description: p.diagnosis || 'No diagnosis noted',
    })),
    ...reports.map(r => ({
      id: r.id, type: 'report', date: r.report_date,
      title: `Lab Report: ${r.file_name}`,
      description: r.notes || r.report_type,
    })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  const tabs = [
    { key: 'overview',       label: 'Overview',      icon: User },
    { key: 'timeline',       label: 'Timeline',      icon: Activity },
    { key: 'alerts',         label: 'Alerts',        icon: Bell,      badge: activeAlerts.length },
    { key: 'prescriptions',  label: 'Prescriptions', icon: Pill },
    { key: 'reports',        label: 'Reports',       icon: FileText },
  ];

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="page-container">
      <div style={{ marginBottom: 'var(--spacing-lg)' }}>
        <Link to="/patients" className="btn btn-ghost btn-sm" style={{ marginBottom: 'var(--spacing-md)' }}>
          <ArrowLeft size={16} /> Back to Patients
        </Link>
      </div>

      {/* Patient Header */}
      <div className="card mb-xl">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xl)', flexWrap: 'wrap' }}>
          <div style={{
            width: 64, height: 64, borderRadius: 'var(--radius-xl)',
            background: 'linear-gradient(135deg, var(--color-brand-primary), var(--color-brand-secondary))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', flexShrink: 0,
          }}>
            {patient.full_name?.charAt(0)?.toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', marginBottom: 4 }}>
              {patient.full_name}
            </h1>
            <div style={{ display: 'flex', gap: 'var(--spacing-lg)', flexWrap: 'wrap', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
              {patient.gender         && <span style={{ textTransform: 'capitalize' }}>👤 {patient.gender}</span>}
              {patient.date_of_birth  && <span><Calendar size={14} style={{ verticalAlign: -2 }} /> {format(new Date(patient.date_of_birth), 'MMM d, yyyy')}</span>}
              {patient.phone          && <span><Phone size={14} style={{ verticalAlign: -2 }} /> {patient.phone}</span>}
              {patient.address        && <span><MapPin size={14} style={{ verticalAlign: -2 }} /> {patient.address}</span>}
            </div>
          </div>
          {criticalActive.length > 0 && (
            <div style={{
              padding: '8px 14px', borderRadius: 'var(--radius-md)',
              background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)',
              color: '#dc2626', fontWeight: 700, fontSize: 'var(--font-size-sm)',
            }}>
              🚨 {criticalActive.length} Critical Alert{criticalActive.length > 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {tabs.map(tab => (
          <button key={tab.key} className={`tab ${activeTab === tab.key ? 'active' : ''}`} onClick={() => setActiveTab(tab.key)}>
            <tab.icon size={16} /> {tab.label}
            {tab.badge > 0 && <span className="tab-badge">{tab.badge}</span>}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ──────────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="content-grid-wide">
          <div>
            {/* AI Trend Summary */}
            {aiInsights.length > 0 && (
              <div className="card mb-xl">
                <div className="card-header">
                  <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <TrendingUp size={18} /> AI Trend Summary
                  </h3>
                </div>
                <DisclaimerBanner message="AI-generated trend analysis — NOT medical advice. Always consult a licensed physician." />
                <div style={{ marginTop: 'var(--spacing-md)' }}>
                  {aiInsights.map((insight, i) => <InsightCard key={i} insight={insight} />)}
                </div>
              </div>
            )}

            {/* Latest Vitals */}
            {latestVisit && (
              <div className="card mb-xl">
                <div className="card-header">
                  <h3 className="card-title">Latest Vitals</h3>
                  <span className="text-xs text-muted">{format(new Date(latestVisit.visited_at), 'MMM d, h:mm a')}</span>
                </div>
                <div className="vitals-grid">
                  {[
                    { key: 'spo2',         label: 'SpO₂',      unit: '%',   value: latestVisit.spo2 },
                    { key: 'systolic_bp',  label: 'Systolic',  unit: 'mmHg',value: latestVisit.systolic_bp },
                    { key: 'diastolic_bp', label: 'Diastolic', unit: 'mmHg',value: latestVisit.diastolic_bp },
                    { key: 'temperature_f',label: 'Temp',      unit: '°F',  value: latestVisit.temperature_f },
                    { key: 'heart_rate',   label: 'Heart Rate',unit: 'bpm', value: latestVisit.heart_rate },
                    { key: 'weight_kg',    label: 'Weight',    unit: 'kg',  value: latestVisit.weight_kg },
                  ].map(v => (
                    <div className="vital-item" key={v.key}>
                      <div className="vital-label">{v.label}</div>
                      <div className={`vital-value ${v.value != null ? getVitalStatus(v.key, v.value) : ''}`}>
                        {v.value ?? '—'}
                        {v.value != null && <span className="vital-unit">{v.unit}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Vitals Chart */}
            {vitalsTrend.length >= 2 && (
              <div className="card mb-xl">
                <div className="card-header"><h3 className="card-title">Vitals Trends</h3></div>
                <VitalsChart data={vitalsTrend} />
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div>
            {profile?.role === 'nurse' && (
              <div className="card mb-xl">
                <button className="btn btn-primary btn-sm" style={{ width: '100%' }} onClick={() => setShowInviteModal(true)}>
                  <UserPlus size={16} /> Invite Family Member
                </button>
              </div>
            )}

            {/* Critical alert → action buttons */}
            {criticalActive.length > 0 && canWrite && (
              <div className="card mb-xl" style={{ borderLeft: '4px solid #dc2626', background: 'rgba(220,38,38,0.04)' }}>
                <h3 className="card-title mb-base" style={{ color: '#dc2626', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertTriangle size={16} /> 🚨 Critical Alert Detected
                </h3>
                <p className="text-sm text-muted mb-base">{criticalActive[0].message}</p>
                <p className="text-xs text-muted mb-md" style={{ fontWeight: 600 }}>Suggested next steps:</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <button className="btn btn-primary btn-sm" style={{ width: '100%' }} onClick={() => setActiveTab('prescriptions')}>
                    💊 Add Prescription
                  </button>
                  <Link to={`/diagnostics?patient=${id}`} className="btn btn-secondary btn-sm" style={{ width: '100%', textAlign: 'center' }}>
                    🧪 Book Diagnostic
                  </Link>
                </div>
              </div>
            )}

            {/* Active Alerts widget */}
            {activeAlerts.length > 0 && (
              <div className="card mb-xl">
                <h3 className="card-title mb-base" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertTriangle size={16} /> Active Alerts
                </h3>
                {sortedAlerts(activeAlerts).slice(0, 4).map(alert => (
                  <div key={alert.id} style={{ marginBottom: 'var(--spacing-md)', padding: 'var(--spacing-md)', background: 'var(--color-bg-primary)', borderRadius: 'var(--radius-md)', borderLeft: `3px solid ${alert.severity === 'critical' ? '#dc2626' : alert.severity === 'medium' ? '#f59e0b' : '#10b981'}` }}>
                    <AlertBadge severity={alert.severity} />
                    <p className="text-xs text-muted mt-sm">{alert.message}</p>
                  </div>
                ))}
                {activeAlerts.length > 4 && (
                  <button className="btn btn-ghost btn-sm" style={{ width: '100%' }} onClick={() => setActiveTab('alerts')}>
                    View all {activeAlerts.length} alerts →
                  </button>
                )}
              </div>
            )}

            {/* Patient Info */}
            <div className="card mb-xl">
              <h3 className="card-title mb-base">Patient Info</h3>
              {patient.medical_history && (
                <div className="mb-base">
                  <div className="text-xs text-muted mb-sm" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Medical History</div>
                  <p className="text-sm">{patient.medical_history}</p>
                </div>
              )}
              {patient.allergies && (
                <div className="mb-base">
                  <div className="text-xs text-muted mb-sm" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Allergies</div>
                  <p className="text-sm" style={{ color: '#dc2626' }}>⚠️ {patient.allergies}</p>
                </div>
              )}
              {patient.emergency_contact_name && (
                <div className="mb-base">
                  <div className="text-xs text-muted mb-sm" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Emergency Contact</div>
                  <p className="text-sm">{patient.emergency_contact_name}</p>
                  <p className="text-xs text-muted">{patient.emergency_contact_phone}</p>
                </div>
              )}
              <div>
                <div className="text-xs text-muted mb-sm" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Data Consent</div>
                <span className={`badge ${patient.consent_data_sharing ? 'badge-success' : 'badge-neutral'}`}>
                  {patient.consent_data_sharing ? 'Consented' : 'Not Consented'}
                </span>
              </div>
            </div>

            {/* Nearby Services (compact) */}
            <div className="card">
              <h3 className="card-title mb-base" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <MapPin size={16} /> Nearby Services
              </h3>
              <NearbyServicesPanel compact canWrite={canWrite} />
            </div>
          </div>
        </div>
      )}

      {/* ── TIMELINE TAB ──────────────────────────────────────────────────── */}
      {activeTab === 'timeline' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Patient Timeline</h3>
            <span className="text-xs text-muted">{timelineEvents.length} total events</span>
          </div>
          <PatientTimeline events={timelineEvents} />
        </div>
      )}

      {/* ── VISITS TAB ────────────────────────────────────────────────────── */}
      {activeTab === 'visits' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-xl)' }}>
            <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)' }}>Visit History ({visits.length})</h2>
            {canWrite && <Link to={`/visits/new?patient=${id}`} className="btn btn-primary btn-sm">Add Visit</Link>}
          </div>
          {visits.length === 0 ? (
            <div className="empty-state"><p className="empty-state-message">No visits recorded yet.</p></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
              {visits.map(visit => (
                <div key={visit.id} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-md)' }}>
                    <span className="font-semibold">Visit by {visit.logged_by_profile?.full_name || 'Unknown'}</span>
                    <span className="text-sm text-muted">{format(new Date(visit.visited_at), 'MMM d, yyyy · h:mm a')}</span>
                  </div>
                  <div className="vitals-grid">
                    {visit.spo2         != null && <div className="vital-item"><div className="vital-label">SpO₂</div><div className={`vital-value ${getVitalStatus('spo2', visit.spo2)}`}>{visit.spo2}<span className="vital-unit">%</span></div></div>}
                    {visit.systolic_bp  != null && <div className="vital-item"><div className="vital-label">Blood Pressure</div><div className="vital-value">{visit.systolic_bp}/{visit.diastolic_bp}<span className="vital-unit">mmHg</span></div></div>}
                    {visit.temperature_f!= null && <div className="vital-item"><div className="vital-label">Temperature</div><div className={`vital-value ${getVitalStatus('temperature_f', visit.temperature_f)}`}>{visit.temperature_f}<span className="vital-unit">°F</span></div></div>}
                    {visit.heart_rate   != null && <div className="vital-item"><div className="vital-label">Heart Rate</div><div className={`vital-value ${getVitalStatus('heart_rate', visit.heart_rate)}`}>{visit.heart_rate}<span className="vital-unit">bpm</span></div></div>}
                    {visit.weight_kg    != null && <div className="vital-item"><div className="vital-label">Weight</div><div className="vital-value">{visit.weight_kg}<span className="vital-unit">kg</span></div></div>}
                  </div>
                  {visit.notes && <p className="text-sm text-muted mt-base">📝 {visit.notes}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── ALERTS TAB ──────────────────────────────────────────────────────── */}
      {activeTab === 'alerts' && (
        <div>
          <DisclaimerBanner />
          <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--spacing-xl)' }}>
            Alerts ({alerts.length})
          </h2>

          {activeAlerts.length === 0 && (
            <div className="empty-state"><p className="empty-state-message">✅ No active alerts for this patient.</p></div>
          )}

          {/* Critical → connected flow */}
          {criticalActive.length > 0 && canWrite && (
            <div style={{
              marginBottom: 'var(--spacing-xl)', padding: '14px 18px',
              background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.25)',
              borderRadius: 'var(--radius-md)',
            }}>
              <p style={{ fontWeight: 700, color: '#dc2626', marginBottom: 8 }}>🚨 Critical alert detected — suggested next steps:</p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button className="btn btn-primary btn-sm" onClick={() => setActiveTab('prescriptions')}>💊 Add Prescription</button>
                <Link to={`/diagnostics?patient=${id}`} className="btn btn-secondary btn-sm">🧪 Book Diagnostic</Link>
              </div>
            </div>
          )}

          {/* Severity sections */}
          {[
            { key: 'critical', label: '🔴 Critical',  color: '#dc2626' },
            { key: 'medium',   label: '🟡 Medium',    color: '#f59e0b' },
            { key: 'low',      label: '🟢 Low',       color: '#10b981' },
          ].map(section => {
            const sectionAlerts = activeAlerts.filter(a => a.severity === section.key);
            if (sectionAlerts.length === 0) return null;
            return (
              <div key={section.key} style={{ marginBottom: 'var(--spacing-xl)' }}>
                <div style={{
                  padding: '6px 12px', marginBottom: 10,
                  borderLeft: `4px solid ${section.color}`,
                  background: section.color + '11',
                  borderRadius: 'var(--radius-sm)',
                  fontWeight: 700, fontSize: 'var(--font-size-sm)', color: section.color,
                }}>
                  {section.label} ({sectionAlerts.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {sectionAlerts.map(alert => (
                    <div key={alert.id} className="card" style={{
                      borderLeft: `3px solid ${section.color}`,
                      opacity: resolvingIds.has(alert.id) ? 0 : 1,
                      transform: resolvingIds.has(alert.id) ? 'translateY(6px)' : 'none',
                      transition: 'opacity 0.4s, transform 0.4s',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                            <AlertBadge severity={alert.severity} />
                            <span className={`badge ${alert.status === 'active' ? 'badge-critical' : 'badge-medium'}`}>{alert.status}</span>
                          </div>
                          <p className="text-sm" style={{ color: 'var(--color-text-secondary)', marginBottom: 4 }}>{alert.message}</p>
                          <div className="text-xs text-muted">{format(new Date(alert.created_at), 'MMM d, h:mm a')}</div>
                        </div>
                        {canWrite && (
                          <div style={{ display: 'flex', gap: 8 }}>
                            {alert.status === 'active' && (
                              <button className="btn btn-secondary btn-sm" onClick={() => handleAcknowledge(alert.id)}>
                                <Check size={13} /> Acknowledge
                              </button>
                            )}
                            <button className="btn btn-success btn-sm" onClick={() => handleResolve(alert.id)}>
                              <CheckCheck size={13} /> Resolve
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Resolved collapsed */}
          {resolvedAlerts.length > 0 && (
            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--spacing-xl)' }}>
              <button
                onClick={() => setShowResolvedAlerts(v => !v)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', fontWeight: 600, padding: '4px 0', marginBottom: 12 }}
              >
                {showResolvedAlerts ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                ✅ Resolved ({resolvedAlerts.length})
              </button>
              {showResolvedAlerts && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, opacity: 0.7 }}>
                  {resolvedAlerts.map(alert => (
                    <div key={alert.id} className="card" style={{ borderLeft: '3px solid #10b981' }}>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                        <AlertBadge severity={alert.severity} />
                        <div>
                          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{alert.message}</p>
                          <p className="text-xs text-muted">{format(new Date(alert.created_at), 'MMM d, h:mm a')}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── PRESCRIPTIONS TAB ────────────────────────────────────────────── */}
      {activeTab === 'prescriptions' && (
        <div>
          <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--spacing-xl)' }}>
            Prescriptions ({prescriptions.length})
          </h2>
          {prescriptions.length === 0 ? (
            <div className="empty-state"><p className="empty-state-message">No prescriptions for this patient.</p></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
              {prescriptions.map(rx => (
                <div key={rx.id} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
                    <span className="font-semibold">By {rx.prescribed_by_profile?.full_name || 'Doctor'}</span>
                    <span className="text-sm text-muted">{format(new Date(rx.prescribed_at), 'MMM d, yyyy')}</span>
                  </div>
                  {rx.diagnosis && <p className="text-sm mb-md"><strong>Diagnosis:</strong> {rx.diagnosis}</p>}
                  {rx.notes && <p className="text-sm text-muted mb-md">📝 {rx.notes}</p>}

                  {rx.medications?.length > 0 && (
                    <>
                      {/* Medication generic comparison table */}
                      <div className="table-container" style={{ marginTop: 'var(--spacing-md)' }}>
                        <table className="table">
                          <thead>
                            <tr>
                              <th>Medicine</th>
                              <th>Dosage</th>
                              <th>Frequency</th>
                              <th>Duration</th>
                              <th>Brand ₹</th>
                              <th>Generic ₹</th>
                              <th>Savings</th>
                              <th style={{ width: 100 }}>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rx.medications.map(med => {
                              const pct = savingsPct(med.brand_price, med.generic_price);
                              return (
                                <tr key={med.id}>
                                  <td>
                                    <div className="font-semibold">{med.name}</div>
                                    {med.generic_composition && (
                                      <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>
                                        {med.generic_composition}
                                      </div>
                                    )}
                                  </td>
                                  <td>{med.dosage || '—'}</td>
                                  <td>{med.frequency || '—'}</td>
                                  <td>{med.duration || '—'}</td>
                                  <td style={{ fontWeight: 600 }}>
                                    {med.brand_price != null ? `₹${med.brand_price}` : '—'}
                                  </td>
                                  <td style={{ color: '#059669', fontWeight: 600 }}>
                                    {med.generic_price != null ? `₹${med.generic_price}` : '—'}
                                    {med.generic_alternative && (
                                      <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', fontWeight: 400 }}>
                                        {med.generic_alternative}
                                      </div>
                                    )}
                                  </td>
                                  <td>
                                    {pct != null ? (
                                      <span style={{
                                        padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 700,
                                        background: 'rgba(5,150,105,0.12)', color: '#059669',
                                      }}>
                                        {pct}% cheaper
                                      </span>
                                    ) : '—'}
                                  </td>
                                  <td>
                                    <button
                                      className="compare-btn"
                                      onClick={() => { setSelectedMedicine(med); setShowCompareModal(true); }}
                                      title="Compare prices across pharmacies"
                                    >
                                      <Search size={11} /> Compare
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      <div style={{
                        marginTop: 10, padding: '8px 12px', borderRadius: 'var(--radius-sm)',
                        background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)',
                        fontSize: 12, color: '#92400e',
                      }}>
                        ⚠️ <strong>Disclaimer:</strong> These alternatives are composition-based suggestions. Please consult your doctor before switching any medication.
                      </div>
                    </>
                  )}
                  {rx.file_url && (
                    <a href={rx.file_url} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm mt-md">
                      <ExternalLink size={14} /> View Document
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── REPORTS TAB ──────────────────────────────────────────────────── */}
      {activeTab === 'reports' && (
        <div>
          <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--spacing-xl)' }}>
            Lab Reports ({reports.length})
          </h2>
          {canWrite && (
            <div className="card mb-xl">
              <h3 className="card-title mb-base">Upload Report</h3>
              <FileUpload bucket="lab-reports" onUploadComplete={handleReportUpload} />
            </div>
          )}
          {reports.length === 0 ? (
            <div className="empty-state"><p className="empty-state-message">No lab reports uploaded yet.</p></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
              {reports.map(report => (
                <div key={report.id} className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                    <FileText size={20} style={{ color: 'var(--color-info)' }} />
                    <div>
                      <div className="font-semibold">{report.file_name}</div>
                      <div className="text-xs text-muted">
                        Uploaded by {report.uploaded_by_profile?.full_name} · {format(new Date(report.report_date), 'MMM d, yyyy')}
                      </div>
                    </div>
                  </div>
                  <a href={report.file_url} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">
                    <ExternalLink size={14} /> View
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Family Invite Modal */}
      <AddFamilyMemberModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        patientId={id}
        patientName={patient?.full_name}
        onSuccess={() => console.log('Family member invited successfully')}
      />

      {/* Medicine Comparison Modal (lazy loaded) */}
      {showCompareModal && (
        <Suspense fallback={null}>
          <MedicineComparisonModal
            isOpen={showCompareModal}
            onClose={() => { setShowCompareModal(false); setSelectedMedicine(null); }}
            medicine={selectedMedicine}
            patientId={id}
          />
        </Suspense>
      )}
    </div>
  );
}
