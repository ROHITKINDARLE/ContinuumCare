import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getPatients } from '../services/patients';
import { createVisit, getVisits } from '../services/visits';
import { getVitalStatus } from '../utils/vitalsAnalysis';
import DisclaimerBanner from '../components/DisclaimerBanner';
import { ClipboardPlus, ArrowLeft, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { format } from 'date-fns';

export default function AddVisit() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedPatient = searchParams.get('patient');

  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(preselectedPatient || '');
  const [previousVisits, setPreviousVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    systolic_bp: '', diastolic_bp: '', temperature_f: '',
    spo2: '', heart_rate: '', weight_kg: '', notes: '',
  });

  useEffect(() => {
    getPatients().then(data => {
      setPatients(data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedPatient) {
      getVisits(selectedPatient).then(data => {
        setPreviousVisits((data || []).slice(0, 5));
      }).catch(() => setPreviousVisits([]));
    } else {
      setPreviousVisits([]);
    }
  }, [selectedPatient]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPatient) {
      alert('Please select a patient.');
      return;
    }

    const hasAnyVital = form.systolic_bp || form.diastolic_bp || form.temperature_f ||
      form.spo2 || form.heart_rate || form.weight_kg || form.notes;
    if (!hasAnyVital) {
      alert('Please enter at least one vital sign or a note.');
      return;
    }

    setSubmitting(true);
    try {
      const visitData = {
        patient_id: selectedPatient,
        logged_by: user.id,
        systolic_bp: form.systolic_bp ? Number(form.systolic_bp) : null,
        diastolic_bp: form.diastolic_bp ? Number(form.diastolic_bp) : null,
        temperature_f: form.temperature_f ? Number(form.temperature_f) : null,
        spo2: form.spo2 ? Number(form.spo2) : null,
        heart_rate: form.heart_rate ? Number(form.heart_rate) : null,
        weight_kg: form.weight_kg ? Number(form.weight_kg) : null,
        notes: form.notes || null,
      };

      await createVisit(visitData);
      navigate(`/patients/${selectedPatient}`);
    } catch (err) {
      alert('Error creating visit: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const updateField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const lastVisit = previousVisits[0];

  const renderComparison = (key, currentVal) => {
    if (!lastVisit || !currentVal || lastVisit[key] == null) return null;
    const diff = Number(currentVal) - Number(lastVisit[key]);
    if (Math.abs(diff) < 0.1) return <span className="comparison-strip"><Minus size={12} className="comparison-arrow stable" /> Stable</span>;
    const isUp = diff > 0;
    return (
      <span className="comparison-strip">
        {isUp ? <TrendingUp size={12} className="comparison-arrow up" /> : <TrendingDown size={12} className="comparison-arrow down" />}
        {isUp ? '+' : ''}{diff.toFixed(1)} from last ({lastVisit[key]})
      </span>
    );
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container"><div className="spinner" /><p className="loading-text">Loading...</p></div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <button className="btn btn-ghost btn-sm mb-lg" onClick={() => navigate(-1)}>
        <ArrowLeft size={16} /> Back
      </button>

      <div className="page-header">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
          <ClipboardPlus size={28} /> Log Patient Visit
        </h1>
        <p>Record vitals and observations. All fields are optional — enter what's available.</p>
      </div>

      <DisclaimerBanner message="Vitals are logged for monitoring purposes. Alerts are auto-generated for abnormal values and do not replace clinical judgment." />

      <div className="content-grid-wide">
        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Select Patient *</label>
              <select
                className="form-select"
                value={selectedPatient}
                onChange={e => setSelectedPatient(e.target.value)}
                required
              >
                <option value="">Choose a patient...</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>{p.full_name}</option>
                ))}
              </select>
            </div>

            <div style={{ borderTop: '1px solid var(--color-border)', margin: 'var(--spacing-xl) 0', paddingTop: 'var(--spacing-xl)' }}>
              <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--spacing-lg)' }}>
                Vital Signs
              </h3>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">SpO₂ (%)</label>
                  <input className="form-input" type="number" min="0" max="100" step="0.1"
                    placeholder="e.g. 98" value={form.spo2} onChange={e => updateField('spo2', e.target.value)} />
                  {form.spo2 && (
                    <div className="form-hint">
                      Status: <span style={{ color: `var(--color-alert-${getVitalStatus('spo2', Number(form.spo2)) === 'normal' ? 'low' : getVitalStatus('spo2', Number(form.spo2))})`, fontWeight: 600 }}>
                        {getVitalStatus('spo2', Number(form.spo2)).toUpperCase()}
                      </span>
                      {renderComparison('spo2', form.spo2)}
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">Heart Rate (bpm)</label>
                  <input className="form-input" type="number" min="0" max="300" step="1"
                    placeholder="e.g. 72" value={form.heart_rate} onChange={e => updateField('heart_rate', e.target.value)} />
                  {form.heart_rate && renderComparison('heart_rate', form.heart_rate)}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Systolic BP (mmHg)</label>
                  <input className="form-input" type="number" min="0" max="300" step="1"
                    placeholder="e.g. 120" value={form.systolic_bp} onChange={e => updateField('systolic_bp', e.target.value)} />
                  {form.systolic_bp && renderComparison('systolic_bp', form.systolic_bp)}
                </div>
                <div className="form-group">
                  <label className="form-label">Diastolic BP (mmHg)</label>
                  <input className="form-input" type="number" min="0" max="200" step="1"
                    placeholder="e.g. 80" value={form.diastolic_bp} onChange={e => updateField('diastolic_bp', e.target.value)} />
                  {form.diastolic_bp && renderComparison('diastolic_bp', form.diastolic_bp)}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Temperature (°F)</label>
                  <input className="form-input" type="number" min="85" max="115" step="0.1"
                    placeholder="e.g. 98.6" value={form.temperature_f} onChange={e => updateField('temperature_f', e.target.value)} />
                  {form.temperature_f && (
                    <div className="form-hint">
                      Status: <span style={{ color: `var(--color-alert-${getVitalStatus('temperature_f', Number(form.temperature_f)) === 'normal' ? 'low' : getVitalStatus('temperature_f', Number(form.temperature_f))})`, fontWeight: 600 }}>
                        {getVitalStatus('temperature_f', Number(form.temperature_f)).toUpperCase()}
                      </span>
                      {renderComparison('temperature_f', form.temperature_f)}
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">Weight (kg)</label>
                  <input className="form-input" type="number" min="0" max="500" step="0.1"
                    placeholder="e.g. 65" value={form.weight_kg} onChange={e => updateField('weight_kg', e.target.value)} />
                  {form.weight_kg && renderComparison('weight_kg', form.weight_kg)}
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Notes / Observations</label>
              <textarea className="form-textarea" rows={4}
                placeholder="Additional observations, symptoms, or comments..."
                value={form.notes} onChange={e => updateField('notes', e.target.value)} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-xl)' }}>
              <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>Cancel</button>
              <button type="submit" className="btn btn-primary btn-lg" disabled={submitting}>
                {submitting ? 'Saving...' : 'Save Visit'}
              </button>
            </div>
          </form>
        </div>

        {/* Previous Visits Panel */}
        <div>
          <div className="card">
            <h3 className="card-title mb-base">Previous Readings</h3>
            {!selectedPatient ? (
              <p className="text-sm text-muted">Select a patient to see history.</p>
            ) : previousVisits.length === 0 ? (
              <p className="text-sm text-muted">No previous visits.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                {previousVisits.map(v => (
                  <div key={v.id} style={{ padding: 'var(--spacing-md)', background: 'var(--color-bg-primary)', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-sm)' }}>
                    <div className="text-xs text-muted mb-sm">{format(new Date(v.visited_at), 'MMM d, h:mm a')}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-sm)' }}>
                      {v.spo2 != null && <span>SpO₂: <strong>{v.spo2}%</strong></span>}
                      {v.systolic_bp != null && <span>BP: <strong>{v.systolic_bp}/{v.diastolic_bp}</strong></span>}
                      {v.temperature_f != null && <span>Temp: <strong>{v.temperature_f}°F</strong></span>}
                      {v.heart_rate != null && <span>HR: <strong>{v.heart_rate}</strong></span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
