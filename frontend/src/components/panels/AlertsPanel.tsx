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
      <div className="panel__section" style={{ background: '#f8fafc', padding: '14px 16px', borderBottom: '1px solid #e2e8f0' }}>
        <div className="panel__row panel__row--between" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 32,
                height: 32,
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ef4444',
              }}
            >
              <Siren size={16} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                Emergency Bulletins
              </div>
              <div style={{ fontSize: 11, color: '#64748b' }}>
                Multi-Agency CAP Alerts Feed
              </div>
            </div>
          </div>
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              background: '#fef2f2',
              color: '#b91c1c',
              padding: '2px 8px',
              border: '1px solid #fecaca',
              borderRadius: 12,
            }}
          >
            {alerts.length} ALERTS
          </span>
        </div>
      </div>

      <div className="panel__list">
        {alerts.map((alert) => {
          const isCritical = alert.severity === 'red';
          const isOrange = alert.severity === 'orange';
          const accentColor = isCritical ? '#ef4444' : isOrange ? '#f59e0b' : '#0284c7';
          const badgeBg = isCritical ? '#fef2f2' : isOrange ? '#fffbeb' : '#f0f9ff';
          const badgeText = isCritical ? '#b91c1c' : isOrange ? '#b45309' : '#0369a1';
          const badgeBorder = isCritical ? '#fecaca' : isOrange ? '#fde68a' : '#bae6fd';

          return (
            <div
              key={alert.id}
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderLeft: `4px solid ${accentColor}`,
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                borderRadius: 8,
                padding: '10px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                transition: 'all 0.15s ease',
              }}
            >
              <div className="panel__row panel__row--between" style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 600,
                      background: badgeBg,
                      color: badgeText,
                      padding: '2px 6px',
                      border: `1px solid ${badgeBorder}`,
                      borderRadius: 4,
                    }}
                  >
                    {alert.source}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#0f172a' }}>
                    {alert.eventType}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#64748b' }}>
                  <Clock size={11} />
                  <span>{timeAgo(alert.issuedAt)}</span>
                </div>
              </div>

              <div style={{ fontSize: 11, fontWeight: 500, color: '#334155' }}>
                📍 Area: {alert.area}
              </div>

              <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.4 }}>
                {alert.description}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
