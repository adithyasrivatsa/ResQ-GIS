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
      <div className="panel__section" style={{ background: '#fff1f2', paddingBottom: 10 }}>
        <div className="panel__row panel__row--between">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Siren size={18} color="var(--retro-pink)" />
            <div>
              <div style={{ fontFamily: 'Silkscreen', fontSize: 13, fontWeight: 700, color: '#be123c' }}>
                EMERGENCY BULLETINS
              </div>
              <div style={{ fontFamily: 'Space Mono', fontSize: 9, color: '#881337' }}>
                MULTI-AGENCY CAP ALERTS FEED
              </div>
            </div>
          </div>
          <span
            style={{
              fontFamily: 'Silkscreen',
              fontSize: 10,
              background: 'var(--retro-pink)',
              color: '#fff',
              padding: '2px 8px',
              border: '1.5px solid #000',
              borderRadius: 4,
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
          const cardBg = isCritical ? '#fff1f2' : isOrange ? '#fff7ed' : '#ffffff';

          return (
            <div
              key={alert.id}
              style={{
                background: cardBg,
                border: '2px solid #000000',
                boxShadow: '3px 3px 0px #000000',
                borderRadius: 8,
                padding: '10px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: 5,
              }}
            >
              <div className="panel__row panel__row--between">
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span
                    style={{
                      fontFamily: 'Silkscreen',
                      fontSize: 8,
                      background: alert.source === 'IMD' ? 'var(--retro-orange)' : 'var(--retro-purple)',
                      color: alert.source === 'IMD' ? '#000' : '#fff',
                      padding: '2px 5px',
                      border: '1px solid #000',
                      borderRadius: 3,
                    }}
                  >
                    {alert.source}
                  </span>
                  <span style={{ fontFamily: 'Silkscreen', fontSize: 11, fontWeight: 700, color: '#000' }}>
                    {alert.eventType}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'Space Mono', fontSize: 9, color: '#64748b' }}>
                  <Clock size={11} />
                  <span>{timeAgo(alert.issuedAt)}</span>
                </div>
              </div>

              <div style={{ fontFamily: 'Space Mono', fontSize: 10, fontWeight: 700, color: '#334155' }}>
                📍 AREA: {alert.area}
              </div>

              <div style={{ fontFamily: 'Space Mono', fontSize: 10, color: '#475569', lineHeight: 1.35 }}>
                {alert.description}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
