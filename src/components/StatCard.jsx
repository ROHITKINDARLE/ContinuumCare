export default function StatCard({ icon: Icon, label, value, trend, variant = 'brand' }) {
  return (
    <div className={`stat-card ${variant}`}>
      <div className={`stat-card-icon ${variant}`}>
        <Icon size={22} />
      </div>
      <div className="stat-card-content">
        <div className="stat-card-label">{label}</div>
        <div className="stat-card-value">{value}</div>
        {trend && (
          <div className={`stat-card-trend ${trend.direction}`}>
            {trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '→'} {trend.text}
          </div>
        )}
      </div>
    </div>
  );
}
