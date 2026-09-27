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

  const cwcProvenance = systemStatus?.sources?.cwc?.status || 'DEMO';
  const imdProvenance = systemStatus?.sources?.imd?.status || 'DEMO';

  return (
    <div className="panel">
      {/* Title Section */}
      <div className="panel__section" style={{ background: '#f8fafc', padding: '14px 16px', borderBottom: '1px solid #e2e8f0' }}>
        <div className="panel__row panel__row--between">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 32,
                height: 32,
                background: '#f0f9ff',
                border: '1px solid #bae6fd',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#0284c7',
              }}
            >
              <Droplets size={16} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                Hydrological Gauges
              </div>
              <div style={{ fontSize: 11, color: '#64748b' }}>
                CWC Alaknanda & Mandakini Telemetry
              </div>
            </div>
          </div>
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              background: cwcProvenance === 'LIVE' ? '#f0fdf4' : '#fffbeb',
              color: cwcProvenance === 'LIVE' ? '#15803d' : '#b45309',
              padding: '2px 8px',
              border: `1px solid ${cwcProvenance === 'LIVE' ? '#bbf7d0' : '#fde68a'}`,
              borderRadius: 12,
            }}
          >
            ● {cwcProvenance}
          </span>
        </div>
      </div>

      <div className="panel__list">
        {/* River Gauge Cards */}
        {riverStations.map((station) => {
          const isSelected = selectedRiverId === station.id;
          const isDanger = station.status === 'danger' || (station.waterLevel && station.dangerLevel && station.waterLevel >= station.dangerLevel);
          const isWarning = station.status === 'warning' || (station.waterLevel && station.warningLevel && station.waterLevel >= station.warningLevel);

          const badgeBg = isDanger ? '#fef2f2' : isWarning ? '#fffbeb' : '#f0fdf4';
          const badgeColor = isDanger ? '#b91c1c' : isWarning ? '#b45309' : '#15803d';
          const badgeBorder = isDanger ? '#fecaca' : isWarning ? '#fde68a' : '#bbf7d0';
          const badgeText = isDanger ? 'DANGER' : isWarning ? 'WARNING' : 'NORMAL';

          return (
            <div
              key={station.id}
              onClick={() => {
                selectRiver(station.id);
                flyToSite(station.longitude, station.latitude);
              }}
              style={{
                background: isSelected ? '#f0f9ff' : '#ffffff',
                border: `1px solid ${isSelected ? '#0284c7' : '#e2e8f0'}`,
                boxShadow: isSelected ? '0 0 0 1px #0284c7, 0 2px 4px rgba(0,0,0,0.04)' : '0 1px 3px rgba(0,0,0,0.04)',
                borderRadius: 10,
                padding: '12px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                transition: 'all 0.15s ease',
              }}
            >
              <div className="panel__row panel__row--between" style={{ marginBottom: 0 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
                    {station.name}
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>
                    {station.river} &bull; {station.district}
                  </div>
                </div>

                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 600,
                    background: badgeBg,
                    color: badgeColor,
                    border: `1px solid ${badgeBorder}`,
                    padding: '2px 7px',
                    borderRadius: 6,
                  }}
                >
                  {badgeText}
                </span>
              </div>

              {/* Water Level Readings */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginTop: 2 }}>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: '6px', textAlign: 'center' }}>
                  <div style={{ fontSize: 9, fontWeight: 500, color: '#64748b' }}>CURRENT</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0284c7', marginTop: 2 }}>
                    {station.waterLevel ? `${station.waterLevel.toFixed(1)}m` : 'N/A'}
                  </div>
                </div>

                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 6, padding: '6px', textAlign: 'center' }}>
                  <div style={{ fontSize: 9, fontWeight: 500, color: '#92400e' }}>WARNING</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#b45309', marginTop: 2 }}>
                    {station.warningLevel ? `${station.warningLevel.toFixed(1)}m` : 'N/A'}
                  </div>
                </div>

                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, padding: '6px', textAlign: 'center' }}>
                  <div style={{ fontSize: 9, fontWeight: 500, color: '#991b1b' }}>DANGER</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#dc2626', marginTop: 2 }}>
                    {station.dangerLevel ? `${station.dangerLevel.toFixed(1)}m` : 'N/A'}
                  </div>
                </div>
              </div>

              {/* Discharge & Level Bar */}
              {station.flowDischargeCumecs && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748b' }}>
                  <span>Discharge: {station.flowDischargeCumecs} cumecs</span>
                  <span>Elevation: {station.elevation}m</span>
                </div>
              )}
            </div>
          );
        })}

        {/* IMD Meteorological Observation Deck */}
        <div
          style={{
            marginTop: 8,
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            borderRadius: 10,
            padding: '12px',
          }}
        >
          <div className="panel__row panel__row--between" style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CloudRain size={16} color="#0284c7" />
              <span style={{ fontSize: 12, fontWeight: 600, color: '#0f172a' }}>
                IMD Met Telemetry
              </span>
            </div>
            <span
              style={{
                fontSize: 9,
                fontWeight: 600,
                background: imdProvenance === 'LIVE' ? '#f0fdf4' : '#fffbeb',
                color: imdProvenance === 'LIVE' ? '#15803d' : '#b45309',
                padding: '2px 7px',
                border: `1px solid ${imdProvenance === 'LIVE' ? '#bbf7d0' : '#fde68a'}`,
                borderRadius: 6,
              }}
            >
              ● {weatherReport?.provenance || imdProvenance}
            </span>
          </div>

          {weatherReport && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6, marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f8fafc', padding: '6px 8px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                <Thermometer size={14} color="#ea580c" />
                <span style={{ fontSize: 11, fontWeight: 600, color: '#0f172a' }}>
                  {weatherReport.current.temperature}°C ({weatherReport.current.condition})
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f8fafc', padding: '6px 8px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                <Droplets size={14} color="#0284c7" />
                <span style={{ fontSize: 11, fontWeight: 600, color: '#0f172a' }}>
                  Rain: {weatherReport.current.rainfall24h} mm/24h
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f8fafc', padding: '6px 8px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                <Wind size={14} color="#64748b" />
                <span style={{ fontSize: 11, color: '#475569' }}>
                  Wind: {weatherReport.current.windSpeed} km/h
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f8fafc', padding: '6px 8px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                <Gauge size={14} color="#64748b" />
                <span style={{ fontSize: 11, color: '#475569' }}>
                  Humidity: {weatherReport.current.humidity}%
                </span>
              </div>
            </div>
          )}

          {/* 5-Day Forecast Strips */}
          <div style={{ fontSize: 10, fontWeight: 600, color: '#64748b', marginBottom: 6, letterSpacing: '0.2px' }}>
            5-DAY METEOROLOGICAL FORECAST
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {weather.slice(0, 4).map((f, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 6,
                  padding: '5px 10px',
                  fontSize: 11,
                }}
              >
                <span style={{ fontWeight: 600, color: '#0f172a' }}>{f.dayLabel || f.date}</span>
                <span style={{ color: '#0284c7' }}>{f.condition}</span>
                <span style={{ color: '#64748b' }}>{f.maxTemp}° / {f.minTemp}°</span>
                <span style={{ fontWeight: 500, color: f.rainfall > 10 ? '#dc2626' : '#64748b' }}>
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
