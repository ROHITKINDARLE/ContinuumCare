/**
 * PharmacyCard — Reusable pharmacy card for price comparison
 *
 * Shows: name, distance, rating, hours, stock, price,
 * delivery badge, best-price highlight, and select action.
 */

import { MapPin, Clock, Star, Phone, Truck, Check } from 'lucide-react';

const STOCK_CONFIG = {
  in:  { label: 'In Stock',      color: '#059669', bg: 'rgba(5,150,105,0.12)',  icon: '●' },
  low: { label: 'Low Stock',     color: '#d97706', bg: 'rgba(217,119,6,0.12)',  icon: '●' },
  out: { label: 'Out of Stock',  color: '#dc2626', bg: 'rgba(220,38,38,0.12)',  icon: '●' },
};

export default function PharmacyCard({ pharmacy, isBestPrice, selected, onSelect, compact = false }) {
  const stockInfo = STOCK_CONFIG[pharmacy.stock] || STOCK_CONFIG.in;
  const isOutOfStock = pharmacy.stock === 'out';

  return (
    <div
      className={`pharmacy-card ${isBestPrice ? 'pharmacy-card--best' : ''} ${selected ? 'pharmacy-card--selected' : ''}`}
      style={{
        padding: compact ? '12px 14px' : '16px 18px',
        background: isBestPrice
          ? 'linear-gradient(135deg, rgba(5,150,105,0.06), rgba(5,150,105,0.02))'
          : 'var(--color-bg-secondary)',
        borderRadius: 'var(--radius-lg)',
        border: `1px solid ${isBestPrice ? 'rgba(5,150,105,0.3)' : selected ? 'var(--color-brand-primary)' : 'var(--color-border)'}`,
        position: 'relative',
        transition: 'all 0.2s ease',
        opacity: isOutOfStock ? 0.6 : 1,
      }}
    >
      {/* Best Price Badge */}
      {isBestPrice && (
        <div style={{
          position: 'absolute', top: -8, right: 12,
          padding: '3px 10px', borderRadius: 'var(--radius-full)',
          background: 'linear-gradient(135deg, #059669, #10b981)',
          color: 'white', fontSize: 10, fontWeight: 700,
          boxShadow: '0 2px 8px rgba(5,150,105,0.3)',
          animation: 'badgePulse 2s infinite',
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          💰 Best Price
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        {/* Left: pharmacy info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
              background: isBestPrice ? 'rgba(5,150,105,0.15)' : 'rgba(99,102,241,0.12)',
              color: isBestPrice ? '#059669' : '#6366f1',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              💊
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {pharmacy.pharmacyName || pharmacy.name}
              </div>
              {!compact && (
                <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {pharmacy.address}
                </div>
              )}
            </div>
          </div>

          {/* Meta row */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 6 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: 'var(--color-text-tertiary)' }}>
              <MapPin size={10} /> {pharmacy.distance} km
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: 'var(--color-text-tertiary)' }}>
              <Clock size={10} /> {pharmacy.hours}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: '#f59e0b' }}>
              <Star size={10} /> {pharmacy.rating}
            </span>
            {!compact && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: 'var(--color-text-tertiary)' }}>
                <Phone size={10} /> {pharmacy.phone}
              </span>
            )}
          </div>

          {/* Badges row */}
          <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
            {/* Stock status */}
            <span style={{
              fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 'var(--radius-full)',
              background: stockInfo.bg, color: stockInfo.color,
              display: 'flex', alignItems: 'center', gap: 3,
            }}>
              <span style={{ fontSize: 6 }}>{stockInfo.icon}</span> {stockInfo.label}
            </span>

            {pharmacy.delivery && (
              <span style={{
                fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 'var(--radius-full)',
                background: 'rgba(59,130,246,0.1)', color: '#3b82f6',
                display: 'flex', alignItems: 'center', gap: 3,
              }}>
                <Truck size={9} /> {pharmacy.deliveryTime || 'Delivery'}
              </span>
            )}
          </div>
        </div>

        {/* Right: price & action */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{
            fontWeight: 700,
            fontSize: isBestPrice ? 'var(--font-size-lg)' : 'var(--font-size-base)',
            color: isBestPrice ? '#059669' : 'var(--color-text-primary)',
          }}>
            ₹{pharmacy.price}
          </div>
          <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>per unit</div>

          {onSelect && !isOutOfStock && (
            <button
              className={`btn btn-sm ${selected ? 'btn-success' : 'btn-secondary'}`}
              onClick={() => onSelect(pharmacy)}
              style={{ marginTop: 8, fontSize: 11 }}
            >
              {selected ? <><Check size={12} /> Selected</> : 'Select'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
