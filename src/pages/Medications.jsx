import { useState, useEffect, lazy, Suspense } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getPatients } from '../services/patients';
import { getPrescriptions, createPrescription, addMedications } from '../services/prescriptions';
import { getNearbyPharmacies, getUserLocation } from '../services/pharmacyService';
import DisclaimerBanner from '../components/DisclaimerBanner';
import { Pill, Plus, X, MapPin, Phone, Clock, Star, AlertTriangle, Search } from 'lucide-react';
import { format } from 'date-fns';

const MedicineComparisonModal = lazy(() => import('../components/MedicineComparisonModal'));

export default function Medications() {
  const { user, isDoctor, canWrite } = useAuth();
  const [prescriptions, setPrescriptions] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeView, setActiveView] = useState('prescriptions');

  // Price comparison state
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [showCompareModal, setShowCompareModal] = useState(false);

  // Geolocation-aware pharmacies
  const [pharmacies, setPharmacies] = useState([]);
  const [locationInfo, setLocationInfo] = useState(null);

  const [form, setForm] = useState({
    patient_id: '', diagnosis: '', notes: '',
  });
  const [meds, setMeds] = useState([
    { name: '', dosage: '', frequency: '', duration: '', generic_alternative: '', generic_composition: '', generic_price: '', brand_price: '' },
  ]);

  useEffect(() => {
    fetchData();
    fetchPharmacies();
  }, []);

  const fetchData = async () => {
    try {
      const [presc, pats] = await Promise.all([
        getPrescriptions().catch(() => []),
        getPatients().catch(() => []),
      ]);
      setPrescriptions(presc || []);
      setPatients(pats || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPharmacies = async () => {
    try {
      const loc = await getUserLocation();
      setLocationInfo(loc);
      setPharmacies(getNearbyPharmacies(loc.lat, loc.lng));
    } catch (err) {
      console.error('Location error:', err);
    }
  };

  const addMedRow = () => {
    setMeds([...meds, { name: '', dosage: '', frequency: '', duration: '', generic_alternative: '', generic_composition: '', generic_price: '', brand_price: '' }]);
  };

  const updateMed = (index, field, value) => {
    const updated = [...meds];
    updated[index][field] = value;
    setMeds(updated);
  };

  const removeMed = (index) => {
    if (meds.length === 1) return;
    setMeds(meds.filter((_, i) => i !== index));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.patient_id) { alert('Select a patient.'); return; }
    const validMeds = meds.filter(m => m.name.trim());
    if (validMeds.length === 0) { alert('Add at least one medication.'); return; }

    setSubmitting(true);
    try {
      const rx = await createPrescription({
        patient_id: form.patient_id,
        prescribed_by: user.id,
        diagnosis: form.diagnosis || null,
        notes: form.notes || null,
      });

      await addMedications(validMeds.map(m => ({
        prescription_id: rx.id,
        name: m.name,
        dosage: m.dosage || null,
        frequency: m.frequency || null,
        duration: m.duration || null,
        generic_alternative: m.generic_alternative || null,
        generic_composition: m.generic_composition || null,
        generic_price: m.generic_price ? Number(m.generic_price) : null,
        brand_price: m.brand_price ? Number(m.brand_price) : null,
      })));

      setShowModal(false);
      setForm({ patient_id: '', diagnosis: '', notes: '' });
      setMeds([{ name: '', dosage: '', frequency: '', duration: '', generic_alternative: '', generic_composition: '', generic_price: '', brand_price: '' }]);
      await fetchData();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const openCompareModal = (med) => {
    setSelectedMedicine(med);
    setShowCompareModal(true);
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
      <div className="page-header">
        <div className="page-header-actions">
          <div>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
              <Pill size={28} /> Medications
            </h1>
            <p>Manage prescriptions, compare prices & find pharmacies</p>
          </div>
          {isDoctor && (
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              <Plus size={18} /> New Prescription
            </button>
          )}
        </div>
      </div>

      {/* View Toggle */}
      <div className="tabs">
        <button className={`tab ${activeView === 'prescriptions' ? 'active' : ''}`} onClick={() => setActiveView('prescriptions')}>
          <Pill size={16} /> Prescriptions
        </button>
        <button className={`tab ${activeView === 'pharmacies' ? 'active' : ''}`} onClick={() => setActiveView('pharmacies')}>
          <MapPin size={16} /> Nearby Pharmacies
        </button>
      </div>

      {activeView === 'prescriptions' && (
        <>
          {prescriptions.length === 0 ? (
            <div className="empty-state">
              <Pill size={48} className="empty-state-icon" />
              <h3 className="empty-state-title">No prescriptions yet</h3>
              <p className="empty-state-message">Prescriptions will appear here once created by a doctor.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
              {prescriptions.map(rx => (
                <div key={rx.id} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-base)' }}>
                    <div>
                      <span className="font-semibold">{rx.patient?.full_name}</span>
                      <span className="text-muted text-sm" style={{ marginLeft: 12 }}>by {rx.prescribed_by_profile?.full_name}</span>
                    </div>
                    <span className="text-sm text-muted">{format(new Date(rx.prescribed_at), 'MMM d, yyyy')}</span>
                  </div>
                  {rx.diagnosis && <p className="text-sm mb-md">Diagnosis: <strong>{rx.diagnosis}</strong></p>}

                  {rx.medications?.length > 0 && (
                    <div className="table-container">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Medicine</th>
                            <th>Dosage</th>
                            <th>Frequency</th>
                            <th>Duration</th>
                            <th>Generic Alt.</th>
                            <th>Price Comparison</th>
                            <th style={{ width: 110 }}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rx.medications.map(med => (
                            <tr key={med.id}>
                              <td className="font-semibold">{med.name}</td>
                              <td>{med.dosage || '—'}</td>
                              <td>{med.frequency || '—'}</td>
                              <td>{med.duration || '—'}</td>
                              <td>
                                {med.generic_alternative ? (
                                  <div>
                                    <span style={{ color: 'var(--color-success)' }}>{med.generic_alternative}</span>
                                    {med.generic_composition && (
                                      <div className="text-xs text-muted">{med.generic_composition}</div>
                                    )}
                                  </div>
                                ) : '—'}
                              </td>
                              <td>
                                {med.brand_price || med.generic_price ? (
                                  <div className="text-sm">
                                    {med.brand_price && <span>Brand: ₹{med.brand_price}</span>}
                                    {med.brand_price && med.generic_price && <span> · </span>}
                                    {med.generic_price && <span style={{ color: 'var(--color-success)' }}>Generic: ₹{med.generic_price}</span>}
                                  </div>
                                ) : '—'}
                              </td>
                              <td>
                                <button
                                  className="compare-btn"
                                  onClick={() => openCompareModal(med)}
                                  title="Compare prices across pharmacies"
                                >
                                  <Search size={11} /> Compare
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {rx.medications?.some(m => m.generic_alternative) && (
                    <div className="disclaimer mt-base" style={{ marginBottom: 0 }}>
                      <AlertTriangle size={16} className="disclaimer-icon" />
                      <span className="text-xs">Generic alternatives shown for reference. <strong>Consult your doctor before switching medications.</strong></span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {activeView === 'pharmacies' && (
        <div>
          {/* Location indicator */}
          {locationInfo && (
            <div style={{
              padding: '8px 14px', borderRadius: 'var(--radius-md)',
              background: locationInfo.isFallback ? 'rgba(245,158,11,0.06)' : 'rgba(5,150,105,0.06)',
              border: `1px solid ${locationInfo.isFallback ? 'rgba(245,158,11,0.2)' : 'rgba(5,150,105,0.2)'}`,
              marginBottom: 'var(--spacing-lg)',
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 'var(--font-size-sm)',
              color: locationInfo.isFallback ? '#d97706' : '#059669',
              fontWeight: 500,
            }}>
              <MapPin size={14} />
              {locationInfo.isFallback
                ? '📍 Using default location (Mumbai). Enable location for accurate results.'
                : '📍 Showing pharmacies near you'
              }
            </div>
          )}

          <p className="text-sm text-muted mb-xl">
            Showing {pharmacies.length} nearby pharmacies. Contact for availability and pricing.
          </p>
          <div className="content-grid">
            {pharmacies.map(pharmacy => (
              <div key={pharmacy.id} className="facility-card">
                <div className="facility-icon" style={{ background: 'var(--color-success-light)', color: 'var(--color-success)' }}>
                  <Pill size={20} />
                </div>
                <div className="facility-info">
                  <div className="facility-name">{pharmacy.name}</div>
                  <div className="facility-address">{pharmacy.address}</div>
                  <div className="facility-meta">
                    <span><MapPin size={12} /> {pharmacy.distance} km</span>
                    <span><Clock size={12} /> {pharmacy.hours}</span>
                    <span><Star size={12} /> {pharmacy.rating}</span>
                    <span><Phone size={12} /> {pharmacy.phone}</span>
                  </div>
                  {pharmacy.delivery && (
                    <span className="badge badge-success mt-sm" style={{ fontSize: 10 }}>
                      🚚 Home Delivery · {pharmacy.deliveryTime}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Prescription Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 720 }}>
            <div className="modal-header">
              <h3 className="modal-title">New Prescription</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Patient *</label>
                    <select className="form-select" required value={form.patient_id}
                      onChange={e => setForm({ ...form, patient_id: e.target.value })}>
                      <option value="">Select patient...</option>
                      {patients.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Diagnosis</label>
                    <input className="form-input" value={form.diagnosis}
                      onChange={e => setForm({ ...form, diagnosis: e.target.value })} placeholder="Primary diagnosis" />
                  </div>
                </div>

                <h4 style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-semibold)', margin: 'var(--spacing-lg) 0 var(--spacing-md)' }}>Medications</h4>
                {meds.map((med, index) => (
                  <div key={index} style={{ padding: 'var(--spacing-base)', background: 'var(--color-bg-primary)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--spacing-md)', position: 'relative' }}>
                    {meds.length > 1 && (
                      <button type="button" className="btn btn-ghost btn-icon btn-sm" style={{ position: 'absolute', top: 8, right: 8 }}
                        onClick={() => removeMed(index)}><X size={14} /></button>
                    )}
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Medicine Name *</label>
                        <input className="form-input" required value={med.name}
                          onChange={e => updateMed(index, 'name', e.target.value)} placeholder="e.g. Paracetamol 500mg" />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Dosage</label>
                        <input className="form-input" value={med.dosage}
                          onChange={e => updateMed(index, 'dosage', e.target.value)} placeholder="e.g. 1 tablet" />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Frequency</label>
                        <input className="form-input" value={med.frequency}
                          onChange={e => updateMed(index, 'frequency', e.target.value)} placeholder="e.g. Twice daily" />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Duration</label>
                        <input className="form-input" value={med.duration}
                          onChange={e => updateMed(index, 'duration', e.target.value)} placeholder="e.g. 7 days" />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Generic Alternative</label>
                        <input className="form-input" value={med.generic_alternative}
                          onChange={e => updateMed(index, 'generic_alternative', e.target.value)} placeholder="Generic name" />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Brand Price (₹)</label>
                        <input className="form-input" type="number" value={med.brand_price}
                          onChange={e => updateMed(index, 'brand_price', e.target.value)} placeholder="0" />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Generic Price (₹)</label>
                        <input className="form-input" type="number" value={med.generic_price}
                          onChange={e => updateMed(index, 'generic_price', e.target.value)} placeholder="0" />
                      </div>
                    </div>
                  </div>
                ))}
                <button type="button" className="btn btn-secondary btn-sm" onClick={addMedRow}>
                  <Plus size={14} /> Add Medication
                </button>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Create Prescription'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Medicine Comparison Modal (lazy loaded) */}
      {showCompareModal && (
        <Suspense fallback={null}>
          <MedicineComparisonModal
            isOpen={showCompareModal}
            onClose={() => { setShowCompareModal(false); setSelectedMedicine(null); }}
            medicine={selectedMedicine}
          />
        </Suspense>
      )}
    </div>
  );
}
