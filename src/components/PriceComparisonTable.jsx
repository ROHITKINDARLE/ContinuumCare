/**
 * PriceComparisonTable — Sortable pharmacy price table
 *
 * Features:
 *  • Sort by Price / Distance / Rating
 *  • Monthly cost column
 *  • Stock status indicators
 *  • Best price highlight
 *  • Select pharmacy action
 */

import { useState } from 'react';
import { ArrowUpDown, Truck, Check, MapPin, Star } from 'lucide-react';
import { calculateMonthlyCost, parseFrequency } from '../services/pharmacyService';

const STOCK_DOTS = {
  in:  { color: '#059669', label: 'In Stock' },
  low: { color: '#d97706', label: 'Low Stock' },
  out: { color: '#dc2626', label: 'Out of Stock' },
};

export default function PriceComparisonTable({ pharmacyPrices, frequency, onSelectPharmacy, selectedPharmacyId }) {
  const [sortBy, setSortBy] = useState('price'); // 'price' | 'distance' | 'rating'

  const freqPerDay = parseFrequency(frequency);

  const sorted = [...pharmacyPrices].sort((a, b) => {
    // Always push out-of-stock to bottom
    if (a.stock === 'out' && b.stock !== 'out') return 1;
    if (b.stock === 'out' && a.stock !== 'out') return -1;

    if (sortBy === 'price') return a.price - b.price;
    if (sortBy === 'distance') return a.distance - b.distance;
    if (sortBy === 'rating') return b.rating - a.rating;
    return 0;
  });

  if (pharmacyPrices.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 'var(--spacing-2xl)', color: 'var(--color-text-tertiary)' }}>
        <MapPin size={32} style={{ marginBottom: 8, opacity: 0.5 }} />
        <p style={{ fontSize: 'var(--font-size-sm)' }}>No pharmacies found nearby.</p>
      </div>
    );
  }

  const cheapestPrice = sorted.find((p) => p.stock !== 'out')?.price || 0;

  return (
    <div>
      {/* Sort controls */}
      <div style={{
        display: 'flex', gap: 6, marginBottom: 'var(--spacing-base)',
        flexWrap: 'wrap', alignItems: 'center',
      }}>
        <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)', fontWeight: 600, marginRight: 4 }}>
          Sort by:
        </span>
        {[
          { key: 'price', label: '💰 Price' },
          { key: 'distance', label: '📍 Distance' },
          { key: 'rating', label: '⭐ Rating' },
        ].map((opt) => (
          <button
            key={opt.key}
            onClick={() => setSortBy(opt.key)}
            style={{
              padding: '4px 12px', borderRadius: 'var(--radius-full)',
              fontSize: 11, fontWeight: 600, cursor: 'pointer',
              transition: 'all 0.15s', border: 'none',
              background: sortBy === opt.key ? 'var(--color-brand-primary)' : 'var(--color-bg-tertiary)',
              color: sortBy === opt.key ? 'white' : 'var(--color-text-secondary)',
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Pharmacy</th>
              <th>Distance</th>
              <th>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}
                  onClick={() => setSortBy('price')}>
                  Price <ArrowUpDown size={10} />
                </span>
              </th>
              <th>Monthly Cost</th>
              <th>Stock</th>
              <th>Rating</th>
              <th style={{ width: 90 }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((p, idx) => {
              const isSelected = selectedPharmacyId === p.pharmacyId;
              const isBest = p.price === cheapestPrice && p.stock !== 'out';
              const isOut = p.stock === 'out';
              const monthlyCost = calculateMonthlyCost(p.price, freqPerDay);
              const stockStyle = STOCK_DOTS[p.stock] || STOCK_DOTS.in;

              return (
                <tr key={p.pharmacyId} style={{
                  opacity: isOut ? 0.5 : 1,
                  background: isSelected ? 'rgba(99,102,241,0.06)' : isBest ? 'rgba(5,150,105,0.04)' : undefined,
                }}>
                  {/* Pharmacy */}
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>
                        {p.pharmacyName}
                      </div>
                      {p.delivery && (
                        <Truck size={11} style={{ color: '#3b82f6', flexShrink: 0 }} />
                      )}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>
                      {p.hours}
                    </div>
                  </td>

                  {/* Distance */}
                  <td>
                    <span style={{ fontSize: 'var(--font-size-sm)' }}>{p.distance} km</span>
                  </td>

                  {/* Price */}
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{
                        fontWeight: 700,
                        color: isBest ? '#059669' : 'var(--color-text-primary)',
                        fontSize: 'var(--font-size-base)',
                      }}>
                        ₹{p.price}
                      </span>
                      {isBest && (
                        <span style={{
                          fontSize: 9, fontWeight: 700, padding: '2px 6px',
                          borderRadius: 'var(--radius-full)',
                          background: 'linear-gradient(135deg, #059669, #10b981)',
                          color: 'white',
                        }}>
                          BEST
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Monthly Cost */}
                  <td>
                    {monthlyCost > 0 ? (
                      <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>
                        ₹{monthlyCost}
                      </span>
                    ) : '—'}
                  </td>

                  {/* Stock */}
                  <td>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      fontSize: 10, fontWeight: 600, color: stockStyle.color,
                    }}>
                      <span style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: stockStyle.color, display: 'inline-block',
                      }} />
                      {stockStyle.label}
                    </span>
                  </td>

                  {/* Rating */}
                  <td>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 'var(--font-size-sm)' }}>
                      <Star size={11} style={{ color: '#f59e0b' }} /> {p.rating}
                    </span>
                  </td>

                  {/* Action */}
                  <td>
                    {!isOut && onSelectPharmacy && (
                      <button
                        className={`btn btn-sm ${isSelected ? 'btn-success' : 'btn-secondary'}`}
                        onClick={() => onSelectPharmacy(p)}
                        style={{ fontSize: 11, padding: '4px 10px' }}
                      >
                        {isSelected ? <><Check size={11} /> ✓</> : 'Select'}
                      </button>
                    )}
                    {isOut && (
                      <span style={{ fontSize: 10, color: '#dc2626', fontWeight: 500 }}>Unavailable</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
