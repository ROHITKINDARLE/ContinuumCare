import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format } from 'date-fns';

const VITAL_CONFIG = {
  spo2: { color: '#06b6d4', label: 'SpO₂ (%)' },
  systolic_bp: { color: '#8b5cf6', label: 'Systolic BP' },
  diastolic_bp: { color: '#a78bfa', label: 'Diastolic BP' },
  temperature_f: { color: '#f59e0b', label: 'Temp (°F)' },
  heart_rate: { color: '#ef4444', label: 'Heart Rate' },
  weight_kg: { color: '#22c55e', label: 'Weight (kg)' },
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--color-bg-secondary)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-md)',
      padding: '12px 16px',
      fontSize: 'var(--font-size-sm)',
    }}>
      <div style={{ color: 'var(--color-text-tertiary)', marginBottom: 8 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />
          <span style={{ color: 'var(--color-text-secondary)' }}>{p.name}:</span>
          <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function VitalsChart({ data, vitals = ['spo2', 'heart_rate', 'systolic_bp'] }) {
  if (!data || data.length === 0) {
    return (
      <div className="empty-state" style={{ minHeight: 200 }}>
        <p className="text-muted text-sm">No vitals data to display</p>
      </div>
    );
  }

  const chartData = data.map(visit => ({
    ...visit,
    date: format(new Date(visit.visited_at), 'MMM d'),
  }));

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
          <XAxis
            dataKey="date"
            stroke="var(--color-text-tertiary)"
            fontSize={12}
            tickLine={false}
          />
          <YAxis
            stroke="var(--color-text-tertiary)"
            fontSize={12}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 12, color: 'var(--color-text-secondary)' }}
          />
          {vitals.map(key => (
            VITAL_CONFIG[key] && (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                name={VITAL_CONFIG[key].label}
                stroke={VITAL_CONFIG[key].color}
                strokeWidth={2}
                dot={{ r: 4, fill: VITAL_CONFIG[key].color }}
                activeDot={{ r: 6 }}
                connectNulls
              />
            )
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
