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
      <div className="panel__section" style={{ background: '#ecfeff', paddingBottom: 10 }}>
        <div className="panel__row panel__row--between">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Droplets size={18} color="#0891b2" />
            <div>
              <div style={{ fontFamily: 'Silkscreen', fontSize: 13, fontWeight: 700, color: '#0e7490' }}>
                HYDROLOGICAL GAUGES
              </div>
              <div style={{ fontFamily: 'Space Mono', fontSize: 9, color: '#155e75' }}>
                CWC ALAKNANDA & MANDAKINI TELEMETRY
              </div>
            </div>
          </div>
          <span
            style={{
              fontFamily: 'Silkscreen',
              fontSize: 9,
              background: cwcProvenance === 'LIVE' ? '#22c55e' : '#f59e0b',
              color: '#000',
              padding: '2px 7px',
              border: '1.5px solid #000',
              borderRadius: 4,
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

          const cardBg = isDanger ? '#fef2f2' : isWarning ? '#fffbeb' : '#ffffff';
          const badgeBg = isDanger ? '#ef4444' : isWarning ? '#f59e0b' : '#10b981';
          const badgeText = isDanger ? 'DANGER' : isWarning ? 'WARNING' : 'NORMAL';

          return (
            <div
              key={station.id}
              onClick={() => {
                selectRiver(station.id);
                flyToSite(station.longitude, station.latitude);
              }}
              style={{
                background: isSelected ? '#e0f2fe' : cardBg,
                border: isSelected ? '3px solid #0284c7' : '2px solid #000000',
                boxShadow: isSelected ? '4px 4px 0px #0284c7' : '3px 3px 0px #000000',
                borderRadius: 8,
                padding: '10px 12px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              <div className="panel__row panel__row--between">
                <div>
                  <div style={{ fontFamily: 'Silkscreen', fontSize: 11, fontWeight: 700, color: '#000' }}>
                    {station.name}
                  </div>
                  <div style={{ fontFamily: 'Space Mono', fontSize: 9, color: '#64748b' }}>
                    {station.river} · {station.district}
                  </div>
                </div>

                <span
                  style={{
                    fontFamily: 'Silkscreen',
                    fontSize: 8,
                    background: badgeBg,
                    color: isDanger ? '#fff' : '#000',
                    padding: '2px 6px',
                    border: '1px solid #000',
                    borderRadius: 3,
                  }}
                >
                  {badgeText}
                </span>
              </div>

              {/* Water Level Readings */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginTop: 4 }}>
                <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 4, padding: '4px 6px', textAlign: 'center' }}>
                  <div style={{ fontFamily: 'Space Mono', fontSize: 8, color: '#64748b' }}>CURRENT</div>
                  <div style={{ fontFamily: 'Space Mono', fontSize: 11, fontWeight: 800, color: '#0369a1' }}>
                    {station.waterLevel ? `${station.waterLevel.toFixed(1)}m` : 'N/A'}
                  </div>
                </div>

                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 4, padding: '4px 6px', textAlign: 'center' }}>
                  <div style={{ fontFamily: 'Space Mono', fontSize: 8, color: '#92400e' }}>WARNING</div>
                  <div style={{ fontFamily: 'Space Mono', fontSize: 11, fontWeight: 700, color: '#b45309' }}>
                    {station.warningLevel ? `${station.warningLevel.toFixed(1)}m` : 'N/A'}
                  </div>
                </div>

                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 4, padding: '4px 6px', textAlign: 'center' }}>
                  <div style={{ fontFamily: 'Space Mono', fontSize: 8, color: '#991b1b' }}>DANGER</div>
                  <div style={{ fontFamily: 'Space Mono', fontSize: 11, fontWeight: 700, color: '#dc2626' }}>
                    {station.dangerLevel ? `${station.dangerLevel.toFixed(1)}m` : 'N/A'}
                  </div>
                </div>
              </div>

              {/* Discharge & Level Bar */}
              {station.flowDischargeCumecs && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'Space Mono', fontSize: 9, color: '#475569' }}>
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
            marginTop: 10,
            background: '#ffffff',
            border: '2px solid #000000',
            boxShadow: '3px 3px 0px #000000',
            borderRadius: 8,
            padding: '10px 12px',
          }}
        >
          <div className="panel__row panel__row--between" style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CloudRain size={16} color="#0284c7" />
              <span style={{ fontFamily: 'Silkscreen', fontSize: 11, fontWeight: 700, color: '#000' }}>
                IMD MET TELEMETRY
              </span>
            </div>
            <span
              style={{
                fontFamily: 'Silkscreen',
                fontSize: 8,
                background: imdProvenance === 'LIVE' ? '#22c55e' : '#f59e0b',
                color: '#000',
                padding: '2px 6px',
                border: '1px solid #000',
                borderRadius: 3,
              }}
            >
              ● {weatherReport?.provenance || imdProvenance}
            </span>
          </div>

          {weatherReport && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6, marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f8fafc', padding: 6, borderRadius: 4, border: '1px solid #e2e8f0' }}>
                <Thermometer size={14} color="#ea580c" />
                <span style={{ fontFamily: 'Space Mono', fontSize: 10, fontWeight: 700 }}>
                  {weatherReport.current.temperature}°C ({weatherReport.current.condition})
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f8fafc', padding: 6, borderRadius: 4, border: '1px solid #e2e8f0' }}>
                <Droplets size={14} color="#0284c7" />
                <span style={{ fontFamily: 'Space Mono', fontSize: 10, fontWeight: 700 }}>
                  Rain: {weatherReport.current.rainfall24h} mm/24h
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f8fafc', padding: 6, borderRadius: 4, border: '1px solid #e2e8f0' }}>
                <Wind size={14} color="#64748b" />
                <span style={{ fontFamily: 'Space Mono', fontSize: 10 }}>
                  Wind: {weatherReport.current.windSpeed} km/h
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f8fafc', padding: 6, borderRadius: 4, border: '1px solid #e2e8f0' }}>
                <Gauge size={14} color="#64748b" />
                <span style={{ fontFamily: 'Space Mono', fontSize: 10 }}>
                  Humidity: {weatherReport.current.humidity}%
                </span>
              </div>
            </div>
          )}

          {/* 5-Day Forecast Strips */}
          <div style={{ fontFamily: 'Silkscreen', fontSize: 9, color: '#475569', marginBottom: 4 }}>
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
                  border: '1px solid #cbd5e1',
                  borderRadius: 4,
                  padding: '4px 8px',
                  fontFamily: 'Space Mono',
                  fontSize: 10,
                }}
              >
                <span style={{ fontWeight: 700 }}>{f.dayLabel || f.date}</span>
                <span style={{ color: '#0284c7' }}>{f.condition}</span>
                <span>{f.maxTemp}° / {f.minTemp}°</span>
                <span style={{ color: f.rainfall > 10 ? '#dc2626' : '#64748b' }}>
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
