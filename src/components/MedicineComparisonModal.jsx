/**
 * MedicineComparisonModal — Main modal for medicine price comparison
 *
 * Features:
 *  • Three tabs: Price Comparison | Generic Alternatives | Nearby Pharmacies
 *  • Geolocation with fallback indicator
 *  • Monthly cost display
 *  • Lazy composition-based alternative matching
 *  • Pharmacy selection with mock order
 */

import { useState, useEffect, useCallback } from 'react';
import { X, MapPin, Pill, TrendingDown, Search, ShoppingCart, AlertTriangle } from 'lucide-react';
import {
  getUserLocation,
  getMedicinePrices,
  getGenericAlternatives,
  calculateMonthlyCost,
  parseFrequency,
  createPharmacyOrder,
  getNearbyPharmacies,
} from '../services/pharmacyService';
import PriceComparisonTable from './PriceComparisonTable';
import GenericAlternatives from './GenericAlternatives';
import PharmacyCard from './PharmacyCard';

export default function MedicineComparisonModal({ isOpen, onClose, medicine, patientId }) {
  const [activeTab, setActiveTab] = useState('prices');
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState(null);
  const [priceData, setPriceData] = useState({ medicine: null, pharmacyPrices: [] });
  const [alternativesData, setAlternativesData] = useState({ base: null, alternatives: [] });
  const [nearbyPharmacies, setNearbyPharmacies] = useState([]);
  const [selectedPharmacy, setSelectedPharmacy] = useState(null);
  const [orderPlaced, setOrderPlaced] = useState(false);

  const medicineName = medicine?.name || '';
  const frequency = medicine?.frequency || '';
  const freqPerDay = parseFrequency(frequency);
  const brandPrice = medicine?.brand_price || medicine?.pricePerUnit || 0;

  // Fetch all data on open
  const fetchData = useCallback(async () => {
    if (!medicineName) return;
    setLoading(true);

    try {
      const loc = await getUserLocation();
      setLocation(loc);

      const [prices, alternatives] = await Promise.all([
        Promise.resolve(getMedicinePrices(medicineName, loc.lat, loc.lng)),
        Promise.resolve(getGenericAlternatives(medicineName)),
      ]);

      setPriceData(prices);
      setAlternativesData(alternatives);
      setNearbyPharmacies(getNearbyPharmacies(loc.lat, loc.lng));
    } catch (err) {
      console.error('Error fetching comparison data:', err);
    } finally {
      setLoading(false);
    }
  }, [medicineName]);

  useEffect(() => {
    if (isOpen) {
      fetchData();
      setSelectedPharmacy(null);
      setOrderPlaced(false);
      setActiveTab('prices');
    }
  }, [isOpen, fetchData]);

  const handleSelectPharmacy = (pharmacy) => {
    setSelectedPharmacy(pharmacy);
  };

  const handlePlaceOrder = () => {
    if (!selectedPharmacy) return;
    createPharmacyOrder({
      patientId,
      pharmacyId: selectedPharmacy.pharmacyId,
      pharmacyName: selectedPharmacy.pharmacyName,
      medicines: [{ name: medicineName, price: selectedPharmacy.price, quantity: 1 }],
      totalPrice: selectedPharmacy.price,
    });
    setOrderPlaced(true);
  };

  if (!isOpen) return null;

  const monthlyCost = calculateMonthlyCost(brandPrice, freqPerDay);
  const resolvedMedicine = priceData.medicine || alternativesData.base;

  const tabs = [
    { key: 'prices',       label: '💰 Price Comparison',     count: priceData.pharmacyPrices.length },
    { key: 'alternatives', label: '💊 Generic Alternatives', count: alternativesData.alternatives.length },
    { key: 'pharmacies',   label: '📍 Nearby Pharmacies',    count: nearbyPharmacies.length },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 900, width: '100%' }}
      >
        {/* ── Header ──────────────────────────────────────────────── */}
        <div className="modal-header">
          <div style={{ flex: 1 }}>
            <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Search size={18} /> Compare Prices
            </h3>
            {resolvedMedicine && (
              <div style={{ marginTop: 4, fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                <strong>{medicineName}</strong>
                {resolvedMedicine.composition && (
                  <span style={{ marginLeft: 8, color: 'var(--color-text-tertiary)' }}>
                    ({resolvedMedicine.composition})
                  </span>
                )}
              </div>
            )}
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* ── Location indicator ──────────────────────────────────── */}
        {location && (
          <div style={{
            padding: '8px 20px',
            background: location.isFallback ? 'rgba(245,158,11,0.06)' : 'rgba(5,150,105,0.06)',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 11, color: location.isFallback ? '#d97706' : '#059669',
            fontWeight: 500,
          }}>
            <MapPin size={12} />
            {location.isFallback
              ? '📍 Using default location (Mumbai). Enable location for accurate results.'
              : '📍 Showing pharmacies near you'
            }
          </div>
        )}

        {/* ── Medicine summary strip ─────────────────────────────── */}
        {!loading && resolvedMedicine && (
          <div style={{
            padding: '12px 20px',
            background: 'var(--color-bg-primary)',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center',
          }}>
            <div>
              <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Unit Price
              </div>
              <div style={{ fontWeight: 700, fontSize: 'var(--font-size-base)' }}>
                ₹{brandPrice || resolvedMedicine.pricePerUnit || '—'}
              </div>
            </div>

            {frequency && (
              <div>
                <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Frequency
                </div>
                <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>
                  {frequency} ({freqPerDay}×/day)
                </div>
              </div>
            )}

            {monthlyCost > 0 && (
              <div>
                <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Monthly Cost
                </div>
                <div style={{ fontWeight: 700, fontSize: 'var(--font-size-base)', color: '#6366f1' }}>
                  ₹{monthlyCost}
                </div>
              </div>
            )}

            {resolvedMedicine.category && (
              <div>
                <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Category
                </div>
                <span className="badge badge-neutral" style={{ fontSize: 10 }}>
                  {resolvedMedicine.category}
                </span>
              </div>
            )}
          </div>
        )}

        {/* ── Tabs ─────────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', borderBottom: '1px solid var(--color-border)',
          overflowX: 'auto',
        }}>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '10px 18px', fontSize: 12, fontWeight: 600,
                border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
                transition: 'all 0.15s',
                borderBottom: activeTab === tab.key ? '2px solid var(--color-brand-primary)' : '2px solid transparent',
                background: 'transparent',
                color: activeTab === tab.key ? 'var(--color-brand-primary-hover)' : 'var(--color-text-secondary)',
              }}
            >
              {tab.label}
              {tab.count > 0 && (
                <span style={{
                  marginLeft: 6, padding: '1px 6px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: 10, fontWeight: 700,
                  background: activeTab === tab.key ? 'var(--color-brand-primary-light)' : 'var(--color-bg-tertiary)',
                  color: activeTab === tab.key ? 'var(--color-brand-primary)' : 'var(--color-text-tertiary)',
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Body ─────────────────────────────────────────────────── */}
        <div className="modal-body" style={{ maxHeight: '55vh', overflowY: 'auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 'var(--spacing-3xl)' }}>
              <div className="spinner" style={{ margin: '0 auto' }} />
              <p className="loading-text" style={{ marginTop: 'var(--spacing-md)' }}>Comparing prices…</p>
            </div>
          ) : (
            <>
              {/* ── PRICE COMPARISON TAB ─────────────────── */}
              {activeTab === 'prices' && (
                <PriceComparisonTable
                  pharmacyPrices={priceData.pharmacyPrices}
                  frequency={frequency}
                  onSelectPharmacy={handleSelectPharmacy}
                  selectedPharmacyId={selectedPharmacy?.pharmacyId}
                />
              )}

              {/* ── GENERIC ALTERNATIVES TAB ─────────────── */}
              {activeTab === 'alternatives' && (
                <GenericAlternatives
                  medicineName={medicineName}
                  basePrice={brandPrice || resolvedMedicine?.pricePerUnit || 0}
                  frequency={frequency}
                  alternatives={alternativesData.alternatives}
                />
              )}

              {/* ── NEARBY PHARMACIES TAB ────────────────── */}
              {activeTab === 'pharmacies' && (
                <div>
                  <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-tertiary)', marginBottom: 'var(--spacing-base)' }}>
                    Showing {nearbyPharmacies.length} pharmacies within 10 km
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {nearbyPharmacies.map((pharmacy) => {
                      // Check if this pharmacy has the medicine in stock
                      const priceEntry = priceData.pharmacyPrices.find(
                        (p) => p.pharmacyId === pharmacy.id
                      );
                      const enriched = priceEntry
                        ? { ...pharmacy, ...priceEntry, pharmacyName: pharmacy.name }
                        : { ...pharmacy, pharmacyName: pharmacy.name, price: '—', stock: 'in' };

                      return (
                        <PharmacyCard
                          key={pharmacy.id}
                          pharmacy={enriched}
                          isBestPrice={priceEntry?.isBestPrice || false}
                          selected={selectedPharmacy?.pharmacyId === pharmacy.id}
                          onSelect={priceEntry ? handleSelectPharmacy : undefined}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Footer ──────────────────────────────────────────────── */}
        <div className="modal-footer" style={{ flexWrap: 'wrap', gap: 10 }}>
          {/* Order success */}
          {orderPlaced && (
            <div style={{
              flex: 1, padding: '8px 14px', borderRadius: 'var(--radius-md)',
              background: 'rgba(5,150,105,0.1)', border: '1px solid rgba(5,150,105,0.3)',
              color: '#059669', fontWeight: 600, fontSize: 'var(--font-size-sm)',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              ✅ Order preference saved for {selectedPharmacy?.pharmacyName}
            </div>
          )}

          {/* Selected pharmacy summary */}
          {selectedPharmacy && !orderPlaced && (
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', gap: 8,
              fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)',
            }}>
              <Pill size={14} />
              Selected: <strong>{selectedPharmacy.pharmacyName}</strong> — ₹{selectedPharmacy.price}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
            {selectedPharmacy && !orderPlaced && (
              <button className="btn btn-primary" onClick={handlePlaceOrder}>
                <ShoppingCart size={14} /> Order Now (Mock)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
