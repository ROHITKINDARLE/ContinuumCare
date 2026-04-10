export default function AlertBadge({ severity }) {
  const labels = {
    critical: 'Critical',
    medium: 'Medium',
    low: 'Low',
  };

  return (
    <span className={`badge badge-${severity}`}>
      <span className={`pulse-dot ${severity}`} />
      {labels[severity] || severity}
    </span>
  );
}
