/**
 * NearbyServicesPanel
 * Props:
 *   compact  — show top 2 of each (for PatientProfile sidebar)
 *   onBookLab(lab) — callback when "Book Here" is clicked
 */

import { useState } from 'react';
import { MapPin, Clock, Star, Phone, TestTube, ShoppingBag, ArrowUpDown } from 'lucide-react';

const PHARMACIES = [
  { id: 1, name: 'Apollo Pharmacy',      distance: 0.5, distanceLabel: '0.5 km', price: 90,  phone: '+91 98765 43210', open: '24/7',         rating: 4.8 },
  { id: 2, name: 'MedPlus',             distance: 0.9, distanceLabel: '0.9 km', price: 95,  phone: '+91 97654 32109', open: '8am – 10pm',   rating: 4.6 },
  { id: 3, name: 'Local Medical Store', distance: 0.5, distanceLabel: '0.5 km', price: 75,  phone: '+91 87654 32198', open: '7am – 11pm',   rating: 4.2 },
  { id: 4, name: 'Netmeds Pharmacy',    distance: 1.4, distanceLabel: '1.4 km', price: 85,  phone: '+91 76543 21987', open: '9am – 9pm',    rating: 4.5 },
  { id: 5, name: 'Wellness Forever',    distance: 1.8, distanceLabel: '1.8 km', price: 100, phone: '+91 65432 10987', open: '8am – 11pm',   rating: 4.3 },
];

const LABS = [
  { id: 1, name: 'Dr. Lal PathLabs',   distance: 0.7, distanceLabel: '0.7 km', price: 299, phone: '+91 98765 00001', open: '7am – 8pm',  rating: 4.9, homeCollection: true,  tests: ['CBC', 'Blood Sugar', 'Thyroid', 'Lipid Profile', 'HbA1c'] },
  { id: 2, name: 'SRL Diagnostics',    distance: 1.1, distanceLabel: '1.1 km', price: 249, phone: '+91 97654 00002', open: '6am – 9pm',  rating: 4.7, homeCollection: true,  tests: ['CBC', 'Urine Routine', 'Liver Function', 'Kidney Function'] },
  { id: 3, name: 'Metropolis Health',  distance: 1.5, distanceLabel: '1.5 km', price: 349, phone: '+91 87654 00003', open: '8am – 8pm',  rating: 4.8, homeCollection: false, tests: ['MRI', 'CT Scan', 'X-Ray', 'ECG', 'Echocardiogram'] },
  { id: 4, name: 'Thyrocare',          distance: 2.0, distanceLabel: '2.0 km', price: 199, phone: '+91 76543 00004', open: '7am – 7pm',  rating: 4.5, homeCollection: true,  tests: ['Thyroid', 'Vitamin D', 'Vitamin B12', 'CBC'] },
  { id: 5, name: 'Suburban Diagnostics',distance:2.4, distanceLabel: '2.4 km', price: 399, phone: '+91 65432 00005', open: '8am – 6pm',  rating: 4.4, homeCollection: false, tests: ['MRI', 'PET Scan', 'Biopsy', 'Histopathology'] },
];

function PharmacyCard({ p, compact }) {
  return (
    <div style={{
      padding: compact ? '10px 12px' : '14px 16px',
      background: 'var(--color-bg-secondary)',
      borderRadius: 'var(--radius-md)',
      border: '1px solid var(--color-border)',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 34, height: 34, borderRadius: '50%',
          background: 'rgba(79,70,229,0.12)', color: '#4f46e5',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <ShoppingBag size={16} />
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>{p.name}</div>
          <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', display: 'flex', gap: 8, marginTop: 2 }}>
            <span><MapPin size={10} style={{ verticalAlign: -1 }} /> {p.distanceLabel}</span>
            <span><Clock size={10} style={{ verticalAlign: -1 }} /> {p.open}</span>
            <span><Star size={10} style={{ verticalAlign: -1, color: '#f59e0b' }} /> {p.rating}</span>
          </div>
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 'var(--font-size-sm)', color: '#059669' }}>₹{p.price}</div>
        {!compact && (
          <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>avg. order</div>
        )}
      </div>
    </div>
  );
}

function LabCard({ lab, compact, onBook, canWrite }) {
  return (
    <div style={{
      padding: compact ? '10px 12px' : '14px 16px',
      background: 'var(--color-bg-secondary)',
      borderRadius: 'var(--radius-md)',
      border: '1px solid var(--color-border)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%',
            background: 'rgba(8,145,178,0.12)', color: '#0891b2',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <TestTube size={16} />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>{lab.name}</div>
            <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', display: 'flex', gap: 8, marginTop: 2 }}>
              <span><MapPin size={10} style={{ verticalAlign: -1 }} /> {lab.distanceLabel}</span>
              <span><Clock size={10} style={{ verticalAlign: -1 }} /> {lab.open}</span>
              <span><Star size={10} style={{ verticalAlign: -1, color: '#f59e0b' }} /> {lab.rating}</span>
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 'var(--font-size-sm)', color: '#0891b2' }}>₹{lab.price}</div>
          <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>starting</div>
        </div>
      </div>

      {!compact && (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 10 }}>
            {lab.tests.slice(0, 4).map((t, i) => (
              <span key={i} style={{
                fontSize: 10, padding: '2px 7px', borderRadius: 999,
                background: 'rgba(8,145,178,0.1)', color: '#0891b2', fontWeight: 500,
              }}>{t}</span>
            ))}
            {lab.tests.length > 4 && (
              <span style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>+{lab.tests.length - 4}</span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
            {lab.homeCollection && (
              <span style={{
                fontSize: 10, padding: '2px 8px', borderRadius: 999,
                background: 'rgba(5,150,105,0.1)', color: '#059669', fontWeight: 600,
              }}>🏠 Home Collection</span>
            )}
            {canWrite && onBook && (
              <button
                className="btn btn-primary btn-sm"
                style={{ marginLeft: 'auto', fontSize: 12 }}
                onClick={() => onBook(lab)}
              >
                Book Here
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function NearbyServicesPanel({ compact = false, onBookLab, canWrite = true }) {
  const [activeTab, setActiveTab] = useState('pharmacies');
  const [sortBy, setSortBy] = useState('nearest'); // 'nearest' | 'cheapest'

  const sorted = (list) => [...list].sort((a, b) =>
    sortBy === 'cheapest' ? a.price - b.price : a.distance - b.distance
  );

  const pharmacies = compact ? sorted(PHARMACIES).slice(0, 2) : sorted(PHARMACIES);
  const labs       = compact ? sorted(LABS).slice(0, 2)       : sorted(LABS);

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {['pharmacies', 'labs'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600,
                border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                background: activeTab === tab ? 'var(--color-brand-primary)' : 'var(--color-bg-secondary)',
                color: activeTab === tab ? 'white' : 'var(--color-text-secondary)',
              }}
            >
              {tab === 'pharmacies' ? '🏪 Pharmacies' : '🧪 Labs'}
            </button>
          ))}
        </div>
        {!compact && (
          <button
            onClick={() => setSortBy(s => s === 'nearest' ? 'cheapest' : 'nearest')}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600,
              border: '1px solid var(--color-border)', background: 'var(--color-bg-secondary)',
              color: 'var(--color-text-secondary)', cursor: 'pointer',
            }}
          >
            <ArrowUpDown size={11} />
            {sortBy === 'nearest' ? 'Nearest' : 'Cheapest'}
          </button>
        )}
      </div>

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {activeTab === 'pharmacies'
          ? pharmacies.map(p => <PharmacyCard key={p.id} p={p} compact={compact} />)
          : labs.map(lab => (
              <LabCard
                key={lab.id}
                lab={lab}
                compact={compact}
                onBook={onBookLab}
                canWrite={canWrite}
              />
            ))
        }
      </div>

      {compact && (
        <p style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 8, textAlign: 'center' }}>
          Showing nearest 2 · Go to Diagnostics for full list
        </p>
      )}
    </div>
  );
}
