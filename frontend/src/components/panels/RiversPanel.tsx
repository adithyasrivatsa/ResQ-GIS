import { Droplets, Gauge, CloudRain, Wind, Thermometer } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { flyToSite } from '../../cesium/camera';

export default function RiversPanel() {
  const {
    riverStations,
    selectedRiverId,
    selectRiver,
    weatherReport,
    weather,
    systemStatus,
  } = useAppStore();

  const cwcProvenance = systemStatus?.sources?.cwc?.status || 'LIVE';
  const imdProvenance = systemStatus?.sources?.imd?.status || 'LIVE';

  return (
    <div className="panel">
      {/* Title Section */}
      <div className="panel__section" style={{ background: 'var(--bg-subtle)' }}>
        <div className="panel__row panel__row--between">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                background: 'var(--accent-cyan-subtle)',
                border: '1px solid var(--accent-cyan)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-cyan)',
              }}
            >
              <Droplets size={18} strokeWidth={2} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                Hydrological Gauges
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                CWC Alaknanda & Mandakini Telemetry
              </div>
            </div>
          </div>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              background: cwcProvenance === 'LIVE' ? 'var(--accent-emerald-subtle)' : 'var(--accent-amber-subtle)',
              color: cwcProvenance === 'LIVE' ? 'var(--accent-emerald)' : 'var(--accent-amber)',
              padding: '2px 8px',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-pill)',
              textTransform: 'uppercase',
            }}
          >
            ● {cwcProvenance}
          </span>
        </div>
      </div>

      <div className="panel__list" style={{ padding: '12px', gap: 8 }}>
        {/* River Gauge Cards */}
        {riverStations.map((station) => {
          const isSelected = selectedRiverId === station.id;
          const isDanger = station.status === 'danger' || (station.waterLevel && station.dangerLevel && station.waterLevel >= station.dangerLevel);
          const isWarning = station.status === 'warning' || (station.waterLevel && station.warningLevel && station.waterLevel >= station.warningLevel);

          const badgeBg = isDanger ? 'var(--accent-rose-subtle)' : isWarning ? 'var(--accent-amber-subtle)' : 'var(--accent-emerald-subtle)';
          const badgeColor = isDanger ? 'var(--accent-rose)' : isWarning ? 'var(--accent-amber)' : 'var(--accent-emerald)';
          const badgeText = isDanger ? 'DANGER' : isWarning ? 'WARNING' : 'NORMAL';

          return (
            <div
              key={station.id}
              onClick={() => {
                selectRiver(station.id);
                flyToSite(station.longitude, station.latitude);
              }}
              style={{
                background: isSelected ? 'var(--accent-blue-subtle)' : 'var(--bg-surface)',
                border: isSelected ? '1px solid var(--accent-blue)' : '1px solid var(--border-color)',
                boxShadow: 'var(--shadow-xs)',
                borderRadius: 'var(--radius-md)',
                padding: '12px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                transition: 'all 0.15s ease',
              }}
            >
              <div className="panel__row panel__row--between">
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {station.name}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {station.river} &bull; {station.district}
                  </div>
                </div>

                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    background: badgeBg,
                    color: badgeColor,
                    border: '1px solid var(--border-color)',
                    padding: '2px 7px',
                    borderRadius: 'var(--radius-pill)',
                    textTransform: 'uppercase',
                  }}
                >
                  {badgeText}
                </span>
              </div>

              {/* Water Level Readings */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '6px', textAlign: 'center' }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)' }}>CURRENT</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                    {station.waterLevel ? `${station.waterLevel.toFixed(1)}m` : 'N/A'}
                  </div>
                </div>

                <div style={{ background: 'var(--accent-amber-subtle)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '6px', textAlign: 'center' }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--accent-amber)' }}>WARNING</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-amber)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                    {station.warningLevel ? `${station.warningLevel.toFixed(1)}m` : 'N/A'}
                  </div>
                </div>

                <div style={{ background: 'var(--accent-rose-subtle)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '6px', textAlign: 'center' }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--accent-rose)' }}>DANGER</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-rose)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                    {station.dangerLevel ? `${station.dangerLevel.toFixed(1)}m` : 'N/A'}
                  </div>
                </div>
              </div>

              {/* Discharge & Level Bar */}
              {station.flowDischargeCumecs && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-secondary)' }}>
                  <span>Discharge: <strong>{station.flowDischargeCumecs} cumecs</strong></span>
                  <span>Elevation: <strong>{station.elevation}m</strong></span>
                </div>
              )}
            </div>
          );
        })}

        {/* IMD Meteorological Observation Deck */}
        <div
          style={{
            marginTop: 4,
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-xs)',
            borderRadius: 'var(--radius-md)',
            padding: '12px',
          }}
        >
          <div className="panel__row panel__row--between" style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CloudRain size={16} color="var(--accent-blue)" strokeWidth={2} />
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase' }}>
                IMD Met Telemetry
              </span>
            </div>
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                background: imdProvenance === 'LIVE' ? 'var(--accent-emerald-subtle)' : 'var(--accent-amber-subtle)',
                color: imdProvenance === 'LIVE' ? 'var(--accent-emerald)' : 'var(--accent-amber)',
                padding: '2px 7px',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-pill)',
                textTransform: 'uppercase',
              }}
            >
              ● {weatherReport?.provenance || imdProvenance}
            </span>
          </div>

          {weatherReport && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6, marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-subtle)', padding: '6px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                <Thermometer size={14} color="var(--accent-amber)" strokeWidth={2} />
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>
                  {weatherReport.current.temperature}°C ({weatherReport.current.condition})
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-subtle)', padding: '6px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                <Droplets size={14} color="var(--accent-cyan)" strokeWidth={2} />
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>
                  Rain: {weatherReport.current.rainfall24h} mm/24h
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-subtle)', padding: '6px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                <Wind size={14} color="var(--text-muted)" strokeWidth={2} />
                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                  Wind: {weatherReport.current.windSpeed} km/h
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-subtle)', padding: '6px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                <Gauge size={14} color="var(--text-muted)" strokeWidth={2} />
                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                  Humidity: {weatherReport.current.humidity}%
                </span>
              </div>
            </div>
          )}

          {/* 5-Day Forecast Strips */}
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, letterSpacing: '0.3px', textTransform: 'uppercase' }}>
            5-Day Meteorological Forecast
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {weather.slice(0, 4).map((f, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '6px 10px',
                  fontSize: 11,
                }}
              >
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{f.dayLabel || f.date}</span>
                <span style={{ color: 'var(--accent-blue)', fontWeight: 500 }}>{f.condition}</span>
                <span style={{ color: 'var(--text-muted)' }}>{f.maxTemp}° / {f.minTemp}°</span>
                <span style={{ fontWeight: 700, color: f.rainfall > 10 ? 'var(--accent-rose)' : 'var(--text-primary)' }}>
                  {f.rainfall}mm
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
