/**
 * Vitals Analysis Utility
 * Provides assistive trend analysis — NOT medical advice.
 */

const THRESHOLDS = {
  spo2:         { critical: 92, warning: 95, unit: '%',    label: 'SpO₂',        direction: 'lower-is-worse' },
  temperature_f:{ critical: 103, warning: 101, unit: '°F', label: 'Temperature', direction: 'higher-is-worse' },
  systolic_bp:  { criticalHigh: 180, warningHigh: 140, criticalLow: 80,  warningLow: 90,  unit: ' mmHg', label: 'Systolic BP' },
  diastolic_bp: { criticalHigh: 120, warningHigh: 90,  criticalLow: 50,  warningLow: 60,  unit: ' mmHg', label: 'Diastolic BP' },
  heart_rate:   { criticalHigh: 130, warningHigh: 120, criticalLow: 45,  warningLow: 50,  unit: ' bpm',  label: 'Heart Rate' },
};

export function getVitalStatus(key, value) {
  if (value == null) return 'unknown';
  const t = THRESHOLDS[key];
  if (!t) return 'normal';

  if (t.direction === 'lower-is-worse') {
    if (value < t.critical) return 'critical';
    if (value < t.warning)  return 'warning';
    return 'normal';
  }
  if (t.direction === 'higher-is-worse') {
    if (value > t.critical) return 'critical';
    if (value > t.warning)  return 'warning';
    return 'normal';
  }
  if (value > t.criticalHigh || value < t.criticalLow) return 'critical';
  if (value > t.warningHigh  || value < t.warningLow)  return 'warning';
  return 'normal';
}

export function analyzeVitalsTrend(visits, key) {
  const values = visits
    .filter(v => v[key] != null)
    .map(v => ({ value: Number(v[key]), date: v.visited_at }));

  if (values.length < 2) return null;

  const recent = values.slice(-3);
  const isDecreasing = recent.every((v, i) => i === 0 || v.value <= recent[i - 1].value);
  const isIncreasing = recent.every((v, i) => i === 0 || v.value >= recent[i - 1].value);

  const label = THRESHOLDS[key]?.label || key;
  const unit  = THRESHOLDS[key]?.unit  || '';
  const first = recent[0].value;
  const last  = recent[recent.length - 1].value;
  const diff  = last - first;
  const pct   = Math.abs((diff / first) * 100).toFixed(1);

  if (Math.abs(diff) < 0.5)
    return { trend: 'stable',      message: `${label} stable at ${last}${unit}`,                                                    direction: 'stable' };
  if (isDecreasing)
    return { trend: 'decreasing',  message: `${label} decreasing over last ${recent.length} visits (${first}→${last}${unit}, -${pct}%)`, direction: 'down'   };
  if (isIncreasing)
    return { trend: 'increasing',  message: `${label} increasing over last ${recent.length} visits (${first}→${last}${unit}, +${pct}%)`, direction: 'up'     };

  return { trend: 'fluctuating', message: `${label} fluctuating (${first}→${last}${unit})`, direction: 'mixed' };
}

export function generateVisitSummary(visits) {
  if (!visits || visits.length === 0) return '';
  const keys = ['spo2', 'temperature_f', 'systolic_bp', 'heart_rate'];
  const insights = keys.map(key => analyzeVitalsTrend(visits, key)).filter(Boolean);
  if (insights.length === 0) return 'Insufficient data for trend analysis.';
  return insights.map(i => i.message).join('. ') + '.';
}

/**
 * generateStructuredInsights — Powers the AI Trend Summary card.
 * Returns array of { vital, trend, message, emoji, urgency }
 * sorted critical → warning → stable.
 */
export function generateStructuredInsights(visits) {
  if (!visits || visits.length < 2) return [];

  const VITAL_META = {
    spo2: {
      getEmoji:    u => u === 'critical' ? '🚨' : u === 'warning' ? '⚠️' : '✅',
      buildMessage:(vals, trend) => {
        if (trend === 'decreasing') return `SpO₂ has been decreasing over last ${vals.length} visits (${vals.join('→')}%)`;
        if (trend === 'stable')     return `SpO₂ is stable at ${vals[vals.length - 1]}%`;
        return `SpO₂ fluctuating (${vals.join('→')}%)`;
      },
      getUrgency:(latest, trend) => latest < 92 ? 'critical' : (latest < 95 || trend === 'decreasing') ? 'warning' : 'stable',
    },
    temperature_f: {
      getEmoji:    u => u === 'critical' ? '🔥' : u === 'warning' ? '🌡️' : '✅',
      buildMessage:(vals, trend) => {
        if (trend === 'increasing') return `Temperature rising trend detected (${vals.join('→')}°F)`;
        if (trend === 'stable')     return `Temperature stable at ${vals[vals.length - 1]}°F`;
        return `Temperature fluctuating (${vals.join('→')}°F)`;
      },
      getUrgency:(latest, trend) => latest > 103 ? 'critical' : (latest > 101 || trend === 'increasing') ? 'warning' : 'stable',
    },
    systolic_bp: {
      getEmoji:    u => u === 'critical' ? '🚨' : u === 'warning' ? '📈' : '✅',
      buildMessage:(vals, trend) => {
        if (trend === 'increasing') return `Systolic BP rising (${vals.join('→')} mmHg) — monitor closely`;
        if (trend === 'decreasing') return `Systolic BP dropping (${vals.join('→')} mmHg)`;
        if (trend === 'stable')     return `Blood pressure stable at ${vals[vals.length - 1]} mmHg`;
        return `Blood pressure fluctuating (${vals.join('→')} mmHg)`;
      },
      getUrgency:(latest) => (latest > 180 || latest < 80) ? 'critical' : (latest > 140 || latest < 90) ? 'warning' : 'stable',
    },
    heart_rate: {
      getEmoji:    u => u === 'critical' ? '🚨' : u === 'warning' ? '💓' : '✅',
      buildMessage:(vals, trend) => {
        if (trend === 'increasing') return `Heart rate elevating (${vals.join('→')} bpm)`;
        if (trend === 'decreasing') return `Heart rate declining (${vals.join('→')} bpm)`;
        if (trend === 'stable')     return `Heart rate stable at ${vals[vals.length - 1]} bpm`;
        return `Heart rate fluctuating (${vals.join('→')} bpm)`;
      },
      getUrgency:(latest) => (latest > 130 || latest < 45) ? 'critical' : (latest > 120 || latest < 50) ? 'warning' : 'stable',
    },
  };

  const insights = [];

  Object.entries(VITAL_META).forEach(([key, meta]) => {
    const rawValues = visits.filter(v => v[key] != null).slice(-3).map(v => Number(v[key]));
    if (rawValues.length < 2) return;

    const trendResult = analyzeVitalsTrend(visits, key);
    if (!trendResult) return;

    const latest  = rawValues[rawValues.length - 1];
    const urgency  = meta.getUrgency(latest, trendResult.trend);
    const emoji    = meta.getEmoji(urgency);
    const message  = meta.buildMessage(rawValues, trendResult.trend);

    insights.push({ vital: key, trend: trendResult.trend, message, emoji, urgency });
  });

  const order = { critical: 0, warning: 1, stable: 2 };
  return insights.sort((a, b) => order[a.urgency] - order[b.urgency]);
}

export function compareWithPrevious(currentVisit, previousVisit) {
  if (!previousVisit) return {};
  const keys = ['spo2', 'systolic_bp', 'diastolic_bp', 'temperature_f', 'heart_rate', 'weight_kg'];
  const comparison = {};
  keys.forEach(key => {
    if (currentVisit[key] != null && previousVisit[key] != null) {
      const diff = Number(currentVisit[key]) - Number(previousVisit[key]);
      comparison[key] = {
        current: Number(currentVisit[key]),
        previous: Number(previousVisit[key]),
        diff,
        direction: diff > 0 ? 'up' : diff < 0 ? 'down' : 'stable',
      };
    }
  });
  return comparison;
}
