import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSearchParams } from 'react-router-dom';
import { getPatients } from '../services/patients';
import {
  getDiagnosticBookings, createDiagnosticBooking,
  updateDiagnosticBooking, AVAILABLE_TESTS,
} from '../services/diagnostics';
import { getLabReports, createLabReport } from '../services/reports';
import FileUpload from '../components/FileUpload';
import NearbyServicesPanel from '../components/NearbyServicesPanel';
import {
  TestTube, Plus, X, Upload, ExternalLink, CheckCircle,
  Clock, Check, AlertCircle, ChevronRight,
} from 'lucide-react';
import { format } from 'date-fns';

// ── Status Stepper ────────────────────────────────────────────────────────────

const STATUS_STEPS = ['booked', 'completed'];

function StatusStepper({ status }) {
  const stepColor = (s) => {
    if (status === 'cancelled') return '#dc2626';
    const cur = STATUS_STEPS.indexOf(status);
    const idx = STATUS_STEPS.indexOf(s);
    if (idx <= cur) return '#059669';
    return 'var(--color-border)';
  };
  const stepLabel = { booked: 'Booked', completed: 'Completed' };

  if (status === 'cancelled') {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700,
        background: 'rgba(220,38,38,0.1)', color: '#dc2626',
      }}>
        <X size={11} /> Cancelled
      </span>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      {STATUS_STEPS.map((step, i) => {
        const active = STATUS_STEPS.indexOf(status) >= i;
        return (
          <div key={step} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700,
              background: active ? 'rgba(5,150,105,0.1)' : 'var(--color-bg-secondary)',
              color: active ? '#059669' : 'var(--color-text-tertiary)',
              border: `1px solid ${stepColor(step)}`,
              transition: 'all 0.2s',
            }}>
              {active ? <Check size={11} /> : <Clock size={11} />}
              {stepLabel[step]}
            </div>
            {i < STATUS_STEPS.length - 1 && (
              <ChevronRight size={12} style={{ color: 'var(--color-border)' }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Booking Card ──────────────────────────────────────────────────────────────

function BookingCard({ booking, canWrite, onMarkComplete, onAttachReport }) {
  return (
    <div className="card" style={{
      borderLeft: `3px solid ${
        booking.status === 'completed' ? '#059669' :
        booking.status === 'cancelled' ? '#dc2626' : '#f59e0b'
      }`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
            <span className="font-semibold" style={{ fontSize: 'var(--font-size-base)' }}>
              🧪 {booking.test_name}
            </span>
            <StatusStepper status={booking.status} />
          </div>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 6, fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)',
          }}>
            <span>👤 {booking.patient?.full_name || '—'}</span>
            {booking.lab_name && <span>🏨 {booking.lab_name}</span>}
            {booking.scheduled_at && (
              <span>🗓️ {format(new Date(booking.scheduled_at), 'MMM d · h:mm a')}</span>
            )}
            <span style={{ color: 'var(--color-text-tertiary)', fontSize: 12 }}>
              Booked by {booking.booked_by_profile?.full_name || '—'}
            </span>
          </div>
          {booking.notes && (
            <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginTop: 6 }}>
              📝 {booking.notes}
            </p>
          )}
        </div>

        {canWrite && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
            {booking.status === 'booked' && (
              <button
                className="btn btn-success btn-sm"
                onClick={() => onMarkComplete(booking.id)}
              >
                <CheckCircle size={13} /> Mark Complete
              </button>
            )}
            {booking.status === 'completed' && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => onAttachReport(booking)}
              >
                <Upload size={13} /> Attach Report
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function Diagnostics() {
  const { user, canWrite } = useAuth();
  const [searchParams] = useSearchParams();
  const preselectedPatient = searchParams.get('patient') || '';

  const [bookings, setBookings]     = useState([]);
  const [patients, setPatients]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeView, setActiveView] = useState('bookings');

  // Report upload state
  const [attachTarget, setAttachTarget]   = useState(null); // booking being attached
  const [uploadPatient, setUploadPatient] = useState('');

  const [form, setForm] = useState({
    patient_id: preselectedPatient,
    test_name: '', lab_name: '', lab_address: '', scheduled_at: '', notes: '',
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [bk, pats] = await Promise.all([
        getDiagnosticBookings().catch(() => []),
        getPatients().catch(() => []),
      ]);
      setBookings(bk || []);
      setPatients(pats || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBook = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createDiagnosticBooking({
        patient_id: form.patient_id,
        booked_by: user.id,
        test_name: form.test_name,
        lab_name: form.lab_name || null,
        lab_address: form.lab_address || null,
        scheduled_at: form.scheduled_at || null,
        notes: form.notes || null,
      });
      setShowModal(false);
      setForm({ patient_id: '', test_name: '', lab_name: '', lab_address: '', scheduled_at: '', notes: '' });
      await fetchData();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const markComplete = async (bookingId) => {
    try {
      await updateDiagnosticBooking(bookingId, { status: 'completed' });
      await fetchData();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  // Called from the BookingCard "Attach Report" button
  const openAttachReport = (booking) => {
    setAttachTarget(booking);
    setUploadPatient(booking.patient_id || '');
    setActiveView('upload');
  };

  const handleReportUpload = async ({ url, fileName }) => {
    const pid = attachTarget?.patient_id || uploadPatient;
    if (!pid) { alert('Please select a patient first.'); return; }
    try {
      await createLabReport({
        patient_id: pid,
        uploaded_by: user.id,
        file_url: url,
        file_name: fileName,
        report_type: 'diagnostic',
      });
      alert(`✅ Report uploaded and linked to ${attachTarget?.patient?.full_name || 'patient'} successfully!`);
      setAttachTarget(null);
      setUploadPatient('');
      setActiveView('bookings');
    } catch (err) {
      alert('Error saving report: ' + err.message);
    }
  };

  // Pre-fill lab from NearbyServicesPanel
  const selectLab = (lab) => {
    setForm(prev => ({ ...prev, lab_name: lab.name, lab_address: lab.address || '' }));
    setShowModal(true);
  };

  // ── Counts ──
  const bookedCount    = bookings.filter(b => b.status === 'booked').length;
  const completedCount = bookings.filter(b => b.status === 'completed').length;

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container"><div className="spinner" /><p className="loading-text">Loading...</p></div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-header-actions">
          <div>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
              <TestTube size={28} /> Diagnostics
            </h1>
            <p style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 4 }}>
              <span style={{ color: '#f59e0b', fontWeight: 600 }}>📋 {bookedCount} pending</span>
              <span style={{ color: '#059669', fontWeight: 600 }}>✅ {completedCount} completed</span>
            </p>
          </div>
          {canWrite && (
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              <Plus size={18} /> Book Test
            </button>
          )}
        </div>
      </div>

      {/* View Toggle */}
      <div className="tabs">
        {[
          { key: 'bookings', label: 'Bookings',       icon: TestTube },
          { key: 'upload',   label: 'Upload Report',  icon: Upload },
          { key: 'labs',     label: 'Nearby Labs & Pharmacies', icon: AlertCircle },
        ].map(({ key, label, icon: Icon }) => (
          <button key={key} className={`tab ${activeView === key ? 'active' : ''}`} onClick={() => setActiveView(key)}>
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {/* ── BOOKINGS ─────────────────────────────────────────────────────── */}
      {activeView === 'bookings' && (
        <>
          {bookings.length === 0 ? (
            <div className="empty-state">
              <TestTube size={48} className="empty-state-icon" />
              <h3 className="empty-state-title">No bookings yet</h3>
              <p className="empty-state-message">Book a diagnostic test to get started.</p>
              {canWrite && (
                <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowModal(true)}>
                  <Plus size={16} /> Book Now
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
              {/* Pending first */}
              {bookings.filter(b => b.status === 'booked').length > 0 && (
                <div>
                  <div style={{ fontWeight: 700, fontSize: 12, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10, paddingLeft: 4 }}>
                    📋 Pending ({bookings.filter(b => b.status === 'booked').length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {bookings.filter(b => b.status === 'booked').map(b => (
                      <BookingCard key={b.id} booking={b} canWrite={canWrite} onMarkComplete={markComplete} onAttachReport={openAttachReport} />
                    ))}
                  </div>
                </div>
              )}

              {/* Completed */}
              {bookings.filter(b => b.status === 'completed').length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontWeight: 700, fontSize: 12, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10, paddingLeft: 4 }}>
                    ✅ Completed ({bookings.filter(b => b.status === 'completed').length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {bookings.filter(b => b.status === 'completed').map(b => (
                      <BookingCard key={b.id} booking={b} canWrite={canWrite} onMarkComplete={markComplete} onAttachReport={openAttachReport} />
                    ))}
                  </div>
                </div>
              )}

              {/* Cancelled */}
              {bookings.filter(b => b.status === 'cancelled').length > 0 && (
                <div style={{ marginTop: 8, opacity: 0.7 }}>
                  <div style={{ fontWeight: 700, fontSize: 12, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10, paddingLeft: 4 }}>
                    ❌ Cancelled
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {bookings.filter(b => b.status === 'cancelled').map(b => (
                      <BookingCard key={b.id} booking={b} canWrite={false} onMarkComplete={() => {}} onAttachReport={() => {}} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ── UPLOAD ───────────────────────────────────────────────────────── */}
      {activeView === 'upload' && (
        <div className="card" style={{ maxWidth: 620 }}>
          <h3 className="card-title mb-base">
            {attachTarget ? `Attach Report — ${attachTarget.test_name}` : 'Upload Diagnostic Report'}
          </h3>
          {attachTarget && (
            <div style={{
              padding: '10px 14px', borderRadius: 'var(--radius-md)', marginBottom: 'var(--spacing-lg)',
              background: 'rgba(8,145,178,0.08)', border: '1px solid rgba(8,145,178,0.25)',
              fontSize: 'var(--font-size-sm)',
            }}>
              📋 Linking report to: <strong>{attachTarget.patient?.full_name}</strong> — {attachTarget.test_name}
              <button
                className="btn btn-ghost btn-sm"
                style={{ marginLeft: 12 }}
                onClick={() => { setAttachTarget(null); setUploadPatient(''); }}
              >
                <X size={12} /> Clear
              </button>
            </div>
          )}
          {!attachTarget && (
            <div className="form-group">
              <label className="form-label">Select Patient *</label>
              <select className="form-select" value={uploadPatient} onChange={e => setUploadPatient(e.target.value)}>
                <option value="">Choose patient...</option>
                {patients.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
              </select>
            </div>
          )}
          {(attachTarget || uploadPatient) && (
            <FileUpload bucket="lab-reports" onUploadComplete={handleReportUpload} />
          )}
          {!attachTarget && !uploadPatient && (
            <p className="text-sm text-muted">Select a patient above to upload their report.</p>
          )}
        </div>
      )}

      {/* ── NEARBY LABS & PHARMACIES ──────────────────────────────────────── */}
      {activeView === 'labs' && (
        <div>
          <p className="text-sm text-muted mb-xl">
            Find nearby labs and pharmacies — sorted by distance or price.
          </p>
          <NearbyServicesPanel
            compact={false}
            canWrite={canWrite}
            onBookLab={selectLab}
          />
        </div>
      )}

      {/* ── BOOK TEST MODAL ───────────────────────────────────────────────── */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Book Diagnostic Test</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleBook}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Patient *</label>
                  <select className="form-select" required value={form.patient_id}
                    onChange={e => setForm({ ...form, patient_id: e.target.value })}>
                    <option value="">Select patient...</option>
                    {patients.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Test *</label>
                  <select className="form-select" required value={form.test_name}
                    onChange={e => setForm({ ...form, test_name: e.target.value })}>
                    <option value="">Select test...</option>
                    {AVAILABLE_TESTS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Lab Name</label>
                    <input className="form-input" value={form.lab_name}
                      onChange={e => setForm({ ...form, lab_name: e.target.value })}
                      placeholder="Lab name" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Schedule Date/Time</label>
                    <input className="form-input" type="datetime-local" value={form.scheduled_at}
                      onChange={e => setForm({ ...form, scheduled_at: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <textarea className="form-textarea" rows={3} value={form.notes}
                    onChange={e => setForm({ ...form, notes: e.target.value })}
                    placeholder="Any special instructions..." />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Booking...' : 'Book Test'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
