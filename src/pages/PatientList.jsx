import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getPatients, createPatient, assignPatient, getAllProfiles } from '../services/patients';
import { Search, Plus, X, User } from 'lucide-react';
import { format } from 'date-fns';

export default function PatientList() {
  const { profile, user, canWrite, isDoctor } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [profiles, setProfiles] = useState([]);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    full_name: '', date_of_birth: '', gender: '', phone: '', address: '',
    emergency_contact_name: '', emergency_contact_phone: '',
    medical_history: '', allergies: '', consent_data_sharing: false,
  });
  const [assignTo, setAssignTo] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const data = await getPatients();
      setPatients(data || []);
    } catch (err) {
      console.error('Error fetching patients:', err);
    } finally {
      setLoading(false);
    }
  };

  const openModal = async () => {
    setShowModal(true);
    // Both doctors and nurses should be able to assign patients
    if (canWrite) {
      try {
        const p = await getAllProfiles();
        setProfiles(p || []);
      } catch (err) { console.error(err); }
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const patient = await createPatient({ ...form, created_by: user.id });
      // Auto-assign creator
      await assignPatient(patient.id, user.id, profile.role === 'doctor' ? 'primary_doctor' : 'primary_nurse');
      // Assign selected users
      for (const pid of assignTo) {
        if (pid !== user.id) {
          await assignPatient(patient.id, pid);
        }
      }
      setShowModal(false);
      setForm({ full_name: '', date_of_birth: '', gender: '', phone: '', address: '', emergency_contact_name: '', emergency_contact_phone: '', medical_history: '', allergies: '', consent_data_sharing: false });
      setAssignTo([]);
      await fetchPatients();
      navigate(`/patients/${patient.id}`);
    } catch (err) {
      alert('Error creating patient: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = patients.filter(p =>
    p.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.phone?.includes(search)
  );

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container"><div className="spinner" /><p className="loading-text">Loading patients...</p></div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-header-actions">
          <div>
            <h1>Patients</h1>
            <p>{patients.length} patient{patients.length !== 1 ? 's' : ''} registered</p>
          </div>
          {canWrite && (
            <button className="btn btn-primary" onClick={openModal}>
              <Plus size={18} /> Add Patient
            </button>
          )}
        </div>
      </div>

      <div className="filter-bar mb-xl">
        <div className="search-bar" style={{ flex: 1, maxWidth: 400 }}>
          <Search size={18} className="search-bar-icon" />
          <input
            className="form-input"
            placeholder="Search by name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: 40 }}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <User size={48} className="empty-state-icon" />
          <h3 className="empty-state-title">No patients found</h3>
          <p className="empty-state-message">
            {search ? 'Try a different search term.' : 'Add your first patient to get started.'}
          </p>
          {canWrite && !search && (
            <button className="btn btn-primary" onClick={openModal}>
              <Plus size={18} /> Add Patient
            </button>
          )}
        </div>
      ) : (
        <div className="table-container">
          <table className="table table-clickable">
            <thead>
              <tr>
                <th>Name</th>
                <th>Gender</th>
                <th>Phone</th>
                <th>DOB</th>
                <th>Assigned To</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(patient => (
                <tr key={patient.id} onClick={() => navigate(`/patients/${patient.id}`)}>
                  <td>
                    <div className="font-semibold">{patient.full_name}</div>
                  </td>
                  <td>
                    <span className="badge badge-neutral" style={{ textTransform: 'capitalize' }}>
                      {patient.gender || '—'}
                    </span>
                  </td>
                  <td className="text-muted">{patient.phone || '—'}</td>
                  <td className="text-muted text-sm">
                    {patient.date_of_birth ? format(new Date(patient.date_of_birth), 'MMM d, yyyy') : '—'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {patient.assignments?.slice(0, 3).map((a, i) => (
                        <span key={i} className={`badge badge-${a.profile?.role || 'neutral'}`}>
                          {a.profile?.full_name?.split(' ')[0] || '?'}
                        </span>
                      ))}
                      {(patient.assignments?.length || 0) > 3 && (
                        <span className="badge badge-neutral">+{patient.assignments.length - 3}</span>
                      )}
                    </div>
                  </td>
                  <td className="text-muted text-sm">
                    {format(new Date(patient.created_at), 'MMM d, yyyy')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Patient Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640 }}>
            <div className="modal-header">
              <h3 className="modal-title">Add New Patient</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Full Name *</label>
                    <input className="form-input" required value={form.full_name}
                      onChange={e => setForm({ ...form, full_name: e.target.value })} placeholder="Patient full name" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Date of Birth</label>
                    <input className="form-input" type="date" value={form.date_of_birth}
                      onChange={e => setForm({ ...form, date_of_birth: e.target.value })} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Gender</label>
                    <select className="form-select" value={form.gender}
                      onChange={e => setForm({ ...form, gender: e.target.value })}>
                      <option value="">Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input className="form-input" type="tel" value={form.phone}
                      onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+91 98765 43210" />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Address</label>
                  <input className="form-input" value={form.address}
                    onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Full address" />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Emergency Contact</label>
                    <input className="form-input" value={form.emergency_contact_name}
                      onChange={e => setForm({ ...form, emergency_contact_name: e.target.value })} placeholder="Contact name" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Emergency Phone</label>
                    <input className="form-input" type="tel" value={form.emergency_contact_phone}
                      onChange={e => setForm({ ...form, emergency_contact_phone: e.target.value })} placeholder="Phone number" />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Medical History</label>
                  <textarea className="form-textarea" value={form.medical_history}
                    onChange={e => setForm({ ...form, medical_history: e.target.value })}
                    placeholder="Known conditions, past surgeries, etc." rows={3} />
                </div>
                <div className="form-group">
                  <label className="form-label">Allergies</label>
                  <input className="form-input" value={form.allergies}
                    onChange={e => setForm({ ...form, allergies: e.target.value })} placeholder="Known allergies" />
                </div>
                {canWrite && profiles.length > 0 && (
                  <div className="form-group">
                    <label className="form-label">Assign To (Care Team)</label>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {profiles.filter(p => p.id !== user.id).map(p => (
                        <button key={p.id} type="button"
                          className={`badge ${assignTo.includes(p.id) ? `badge-${p.role}` : 'badge-neutral'}`}
                          style={{ cursor: 'pointer', padding: '6px 12px' }}
                          onClick={() => {
                            setAssignTo(prev =>
                              prev.includes(p.id) ? prev.filter(x => x !== p.id) : [...prev, p.id]
                            );
                          }}>
                          {p.full_name} ({p.role})
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <label className="form-checkbox">
                  <input type="checkbox" checked={form.consent_data_sharing}
                    onChange={e => setForm({ ...form, consent_data_sharing: e.target.checked })} />
                  <span className="text-sm">Patient consents to data sharing with care team</span>
                </label>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create Patient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
