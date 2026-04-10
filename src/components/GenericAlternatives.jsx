/**
 * GenericAlternatives — Composition-based alternative medicine cards
 *
 * Features:
 *  • Confidence tags: Same / Similar / Doctor Approval Needed
 *  • Monthly savings calculation
 *  • Color-coded badges (green / yellow / red)
 *  • Medical disclaimer
 */

import { AlertTriangle, TrendingDown, Shield, Info } from 'lucide-react';
import { calculateMonthlyCost, parseFrequency } from '../services/pharmacyService';

const CONFIDENCE_STYLES = {
  same: {
    label: 'Same Composition ✅',
    bg: 'rgba(5,150,105,0.1)',
    border: 'rgba(5,150,105,0.3)',
    color: '#059669',
    icon: Shield,
    description: 'Exact same active ingredient and dosage. Safe to switch.',
  },
  similar: {
    label: 'Similar Composition ⚠️',
    bg: 'rgba(217,119,6,0.1)',
    border: 'rgba(217,119,6,0.3)',
    color: '#d97706',
    icon: Info,
    description: 'Same drug, different dosage or formulation. Consult doctor.',
  },
  different: {
    label: 'Doctor Approval Needed ❗',
    bg: 'rgba(220,38,38,0.08)',
    border: 'rgba(220,38,38,0.3)',
    color: '#dc2626',
    icon: AlertTriangle,
    description: 'Different composition. Do NOT switch without medical advice.',
  },
};

function AlternativeCard({ alt, basePrice, frequency }) {
  const style = CONFIDENCE_STYLES[alt.confidence] || CONFIDENCE_STYLES.different;
  const IconComp = style.icon;
  const freqPerDay = parseFrequency(frequency);
  const baseMonthlyCost = calculateMonthlyCost(basePrice, freqPerDay);
  const altMonthlyCost = calculateMonthlyCost(alt.pricePerUnit, freqPerDay);
  const monthlySavings = Math.round((baseMonthlyCost - altMonthlyCost) * 100) / 100;
  const savingsPct = basePrice > 0 ? Math.round(((basePrice - alt.pricePerUnit) / basePrice) * 100) : 0;

  return (
    <div style={{
      padding: '14px 16px',
      background: 'var(--color-bg-secondary)',
      borderRadius: 'var(--radius-lg)',
      border: `1px solid ${style.border}`,
      borderLeft: `4px solid ${style.color}`,
      transition: 'transform 0.15s ease, box-shadow 0.15s ease',
    }}
    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
    onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      {/* Header: name + confidence badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 'var(--font-size-base)', color: 'var(--color-text-primary)' }}>
            {alt.name}
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 2 }}>
            {alt.composition} · {alt.manufacturer}
          </div>
        </div>

        {/* Confidence badge */}
        <span style={{
          display: 'flex', alignItems: 'center', gap: 4,
          padding: '3px 10px', borderRadius: 'var(--radius-full)',
          background: style.bg, color: style.color,
          fontSize: 10, fontWeight: 700, flexShrink: 0,
          border: `1px solid ${style.border}`,
        }}>
          <IconComp size={10} />
          {alt.confidence === 'same' ? 'Same' : alt.confidence === 'similar' ? 'Similar' : 'Different'}
        </span>
      </div>

      {/* Price comparison row */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Unit Price</div>
          <div style={{ fontWeight: 700, fontSize: 'var(--font-size-base)', color: alt.savingsPerUnit > 0 ? '#059669' : 'var(--color-text-primary)' }}>
            ₹{alt.pricePerUnit}
          </div>
        </div>

        {altMonthlyCost > 0 && (
          <div>
            <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Monthly Cost</div>
            <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>
              ₹{altMonthlyCost}
            </div>
          </div>
        )}

        {/* Savings */}
        {monthlySavings > 0 && (
          <div style={{
            padding: '4px 10px', borderRadius: 'var(--radius-md)',
            background: 'rgba(5,150,105,0.1)', border: '1px solid rgba(5,150,105,0.2)',
          }}>
            <div style={{ fontSize: 10, color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
              <TrendingDown size={10} />
              Save ₹{monthlySavings}/month
            </div>
            {savingsPct > 0 && (
              <div style={{ fontSize: 10, color: '#059669', fontWeight: 700, marginTop: 1 }}>
                {savingsPct}% cheaper
              </div>
            )}
          </div>
        )}

        {monthlySavings < 0 && (
          <div style={{
            padding: '4px 10px', borderRadius: 'var(--radius-md)',
            background: 'rgba(220,38,38,0.06)',
          }}>
            <div style={{ fontSize: 10, color: '#dc2626', fontWeight: 600 }}>
              ₹{Math.abs(monthlySavings)}/month more
            </div>
          </div>
        )}
      </div>

      {/* Confidence description */}
      <div style={{ fontSize: 11, color: style.color, fontStyle: 'italic', opacity: 0.9 }}>
        {style.description}
      </div>
    </div>
  );
}

export default function GenericAlternatives({ medicineName, basePrice, frequency, alternatives }) {
  if (!alternatives || alternatives.length === 0) {
    return (
      <div style={{
        textAlign: 'center', padding: 'var(--spacing-2xl)',
        color: 'var(--color-text-tertiary)',
      }}>
        <Info size={32} style={{ marginBottom: 8, opacity: 0.5 }} />
        <p style={{ fontSize: 'var(--font-size-sm)' }}>No generic alternatives found for this medicine.</p>
      </div>
    );
  }

  const sameCount = alternatives.filter((a) => a.confidence === 'same').length;
  const similarCount = alternatives.filter((a) => a.confidence === 'similar').length;

  // AI recommendation: find best same-composition alternative
  const bestSame = alternatives.find((a) => a.confidence === 'same' && a.savingsPerUnit > 0);
  const freqPerDay = parseFrequency(frequency);

  return (
    <div>
      {/* Summary header */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 'var(--spacing-base)', flexWrap: 'wrap' }}>
        {sameCount > 0 && (
          <span className="badge badge-success" style={{ fontSize: 10 }}>
            {sameCount} Same Composition
          </span>
        )}
        {similarCount > 0 && (
          <span className="badge badge-medium" style={{ fontSize: 10 }}>
            {similarCount} Similar
          </span>
        )}
      </div>

      {/* AI Suggestion callout */}
      {bestSame && (
        <div style={{
          padding: '12px 16px', borderRadius: 'var(--radius-lg)',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(6,182,212,0.08))',
          border: '1px solid rgba(99,102,241,0.2)',
          marginBottom: 'var(--spacing-lg)',
          display: 'flex', alignItems: 'flex-start', gap: 10,
        }}>
          <span style={{ fontSize: 20, lineHeight: 1 }}>🤖</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 'var(--font-size-sm)', color: 'var(--color-brand-primary)', marginBottom: 2 }}>
              Smart Suggestion
            </div>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)', margin: 0, lineHeight: 1.5 }}>
              Switch to <strong>{bestSame.name}</strong> (same composition as {medicineName}) and save{' '}
              <strong style={{ color: '#059669' }}>
                ₹{calculateMonthlyCost(bestSame.savingsPerUnit, freqPerDay)}/month
              </strong>
            </p>
          </div>
        </div>
      )}

      {/* Alternative cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {alternatives.map((alt) => (
          <AlternativeCard
            key={alt.id}
            alt={alt}
            basePrice={basePrice}
            frequency={frequency}
          />
        ))}
      </div>

      {/* Disclaimer */}
      <div style={{
        marginTop: 'var(--spacing-lg)',
        padding: '10px 14px', borderRadius: 'var(--radius-md)',
        background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)',
        display: 'flex', alignItems: 'flex-start', gap: 8,
      }}>
        <AlertTriangle size={14} style={{ color: '#d97706', flexShrink: 0, marginTop: 1 }} />
        <span style={{ fontSize: 11, color: '#92400e', lineHeight: 1.5 }}>
          <strong>Always consult your doctor before switching medicines.</strong>{' '}
          Generic alternatives are composition-based suggestions and may vary in bioavailability and formulation.
        </span>
      </div>
    </div>
  );
}
