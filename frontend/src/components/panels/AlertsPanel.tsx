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
      <div className="panel__section" style={{ background: 'var(--nb-canvas-subtle)', padding: '14px 16px', borderBottom: '2.5px solid #000000' }}>
        <div className="panel__row panel__row--between" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                background: 'var(--nb-pink)',
                border: '2px solid #000000',
                boxShadow: '2px 2px 0px #000000',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
              }}
            >
              <Siren size={18} strokeWidth={2.5} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 900, color: '#000000', textTransform: 'uppercase' }}>
                Emergency Bulletins
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#525252' }}>
                Multi-Agency CAP Alerts Feed
              </div>
            </div>
          </div>
          <span
            style={{
              fontSize: 10,
              fontWeight: 800,
              background: 'var(--nb-pink)',
              color: '#ffffff',
              padding: '3px 8px',
              border: '1.5px solid #000000',
              boxShadow: '1.5px 1.5px 0px #000000',
              borderRadius: 6,
              textTransform: 'uppercase',
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
          const accentColor = isCritical ? 'var(--nb-pink)' : isOrange ? 'var(--nb-orange)' : 'var(--nb-cyan)';

          return (
            <div
              key={alert.id}
              style={{
                background: '#ffffff',
                border: '2px solid #000000',
                boxShadow: '3px 3px 0px #000000',
                borderRadius: 8,
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                transition: 'all 0.1s ease',
              }}
            >
              <div className="panel__row panel__row--between" style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      background: accentColor,
                      color: isCritical ? '#ffffff' : '#000000',
                      padding: '2px 7px',
                      border: '1.5px solid #000000',
                      boxShadow: '1px 1px 0px #000000',
                      borderRadius: 4,
                      textTransform: 'uppercase',
                    }}
                  >
                    {alert.source}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 900, color: '#000000' }}>
                    {alert.eventType}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: '#525252' }}>
                  <Clock size={12} strokeWidth={2.5} />
                  <span>{timeAgo(alert.issuedAt)}</span>
                </div>
              </div>

              <div style={{ fontSize: 11, fontWeight: 800, color: '#000000' }}>
                📍 Area: {alert.area}
              </div>

              <div style={{ fontSize: 11, color: '#000000', fontWeight: 600, lineHeight: 1.45 }}>
                {alert.description}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
