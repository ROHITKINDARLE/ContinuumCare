import { useState } from 'react';
import { format, isToday, isYesterday } from 'date-fns';
import { Activity, ChevronDown, ChevronUp } from 'lucide-react';

const EVENT_CONFIG = {
  visit:        { emoji: '🩺', color: '#4f46e5', bg: 'rgba(79,70,229,0.1)',  label: 'Visit Logged' },
  alert:        { emoji: '🚨', color: '#dc2626', bg: 'rgba(220,38,38,0.1)',  label: 'Health Alert' },
  prescription: { emoji: '💊', color: '#059669', bg: 'rgba(5,150,105,0.1)', label: 'Prescription'  },
  report:       { emoji: '🧪', color: '#0891b2', bg: 'rgba(8,145,178,0.1)', label: 'Lab Report'    },
};

const SEVERITY_BORDER = {
  critical: '#dc2626',
  medium:   '#f59e0b',
  low:      '#10b981',
};

function groupByDate(events) {
  const groups = {};
  events.forEach(event => {
    const key = format(new Date(event.date), 'yyyy-MM-dd');
    if (!groups[key]) groups[key] = [];
    groups[key].push(event);
  });
  return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
}

function formatDateLabel(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  if (isToday(date))     return '📅 Today';
  if (isYesterday(date)) return '📅 Yesterday';
  return `📅 ${format(date, 'MMM d, yyyy')}`;
}

function TimelineEventCard({ event }) {
  const config = EVENT_CONFIG[event.type] || EVENT_CONFIG.visit;
  const borderColor =
    event.type === 'alert' && event.severity
      ? SEVERITY_BORDER[event.severity] || config.color
      : config.color;

  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 8 }}>
      {/* Dot */}
      <div style={{
        width: 34, height: 34, borderRadius: '50%',
        background: config.bg,
        border: `2px solid ${borderColor}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 15, flexShrink: 0, marginTop: 2,
      }}>
        {config.emoji}
      </div>

      {/* Card */}
      <div style={{
        flex: 1,
        padding: '10px 14px',
        background: 'var(--color-bg-secondary)',
        borderRadius: 'var(--radius-md)',
        borderLeft: `3px solid ${borderColor}`,
        transition: 'box-shadow 0.2s',
      }}
        onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)'}
        onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)' }}>
            {event.title}
          </span>
          <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)', whiteSpace: 'nowrap' }}>
            {format(new Date(event.date), 'h:mm a')}
          </span>
        </div>
        {event.description && (
          <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: '4px 0 0', lineHeight: 1.55 }}>
            {event.description}
          </p>
        )}
        {/* Alert severity badge */}
        {event.type === 'alert' && event.severity && (
          <span style={{
            display: 'inline-block', marginTop: 6,
            fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
            padding: '2px 8px', borderRadius: 999,
            background: borderColor + '22', color: borderColor,
          }}>
            {event.severity}
          </span>
        )}
      </div>
    </div>
  );
}

export default function PatientTimeline({ events }) {
  const [showAll, setShowAll] = useState(false);

  if (!events || events.length === 0) {
    return (
      <div className="empty-state">
        <Activity size={32} className="empty-state-icon" />
        <p className="empty-state-message">No timeline events yet. Add a visit to get started.</p>
      </div>
    );
  }

  const INITIAL_LIMIT = 10;
  const displayEvents = showAll ? events : events.slice(0, INITIAL_LIMIT);
  const groups = groupByDate(displayEvents);

  return (
    <div>
      {groups.map(([dateKey, dayEvents]) => (
        <div key={dateKey} style={{ marginBottom: 'var(--spacing-xl)' }}>
          {/* Date header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <span style={{
              fontWeight: 700, fontSize: 12,
              color: 'var(--color-text-secondary)',
              textTransform: 'uppercase', letterSpacing: '0.05em',
            }}>
              {formatDateLabel(dateKey)}
            </span>
            <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
            <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>
              {dayEvents.length} event{dayEvents.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Events */}
          <div style={{ paddingLeft: 4 }}>
            {dayEvents.map((event, idx) => (
              <TimelineEventCard key={event.id || idx} event={event} />
            ))}
          </div>
        </div>
      ))}

      {/* Show more / less */}
      {events.length > INITIAL_LIMIT && (
        <button
          onClick={() => setShowAll(v => !v)}
          className="btn btn-ghost btn-sm"
          style={{ width: '100%', marginTop: 4 }}
        >
          {showAll
            ? <><ChevronUp size={14} /> Show less</>
            : <><ChevronDown size={14} /> Show {events.length - INITIAL_LIMIT} more events</>}
        </button>
      )}
    </div>
  );
}
