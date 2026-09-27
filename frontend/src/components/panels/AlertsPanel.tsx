import { Clock, Siren } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

function timeAgo(isoStr: string): string {
  const diff = Date.now() - new Date(isoStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function AlertsPanel() {
  const { alerts } = useAppStore();

  return (
    <div className="panel">
      {/* Header */}
      <div className="panel__section" style={{ background: 'var(--bg-subtle)' }}>
        <div className="panel__row panel__row--between">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                background: 'var(--accent-rose-subtle)',
                border: '1px solid var(--accent-rose)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-rose)',
              }}
            >
              <Siren size={18} strokeWidth={2} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                Emergency Bulletins
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Multi-Agency CAP Alerts Feed
              </div>
            </div>
          </div>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              background: 'var(--accent-rose-subtle)',
              color: 'var(--accent-rose)',
              padding: '2px 8px',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-pill)',
              textTransform: 'uppercase',
            }}
          >
            {alerts.length} ALERTS
          </span>
        </div>
      </div>

      <div className="panel__list" style={{ padding: '12px', gap: 8 }}>
        {alerts.map((alert) => {
          const isCritical = alert.severity === 'red';
          const isOrange = alert.severity === 'orange';
          const badgeBg = isCritical ? 'var(--accent-rose-subtle)' : isOrange ? 'var(--accent-amber-subtle)' : 'var(--accent-cyan-subtle)';
          const badgeColor = isCritical ? 'var(--accent-rose)' : isOrange ? 'var(--accent-amber)' : 'var(--accent-cyan)';
          const borderHighlight = isCritical ? 'var(--accent-rose)' : 'var(--border-color)';

          return (
            <div
              key={alert.id}
              style={{
                background: 'var(--bg-surface)',
                border: `1px solid ${borderHighlight}`,
                borderLeft: isCritical ? `3px solid var(--accent-rose)` : `1px solid var(--border-color)`,
                boxShadow: 'var(--shadow-xs)',
                borderRadius: 'var(--radius-md)',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                transition: 'all 0.15s ease',
              }}
            >
              <div className="panel__row panel__row--between">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      background: badgeBg,
                      color: badgeColor,
                      padding: '2px 7px',
                      borderRadius: 'var(--radius-pill)',
                      border: '1px solid var(--border-color)',
                      textTransform: 'uppercase',
                    }}
                  >
                    {alert.source}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {alert.eventType}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-muted)' }}>
                  <Clock size={12} />
                  <span>{timeAgo(alert.issuedAt)}</span>
                </div>
              </div>

              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>
                📍 Area: {alert.area}
              </div>

              <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                {alert.description}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
