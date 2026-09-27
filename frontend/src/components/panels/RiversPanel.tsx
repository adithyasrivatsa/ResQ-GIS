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
      <div className="panel__section" style={{ background: 'var(--nb-canvas-subtle)', padding: '14px 16px', borderBottom: '2.5px solid #000000' }}>
        <div className="panel__row panel__row--between">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                background: 'var(--nb-cyan)',
                border: '2px solid #000000',
                boxShadow: '2px 2px 0px #000000',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#000000',
              }}
            >
              <Droplets size={18} strokeWidth={2.5} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 900, color: '#000000', textTransform: 'uppercase' }}>
                Hydrological Gauges
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#525252' }}>
                CWC Alaknanda & Mandakini Telemetry
              </div>
            </div>
          </div>
          <span
            style={{
              fontSize: 10,
              fontWeight: 800,
              background: cwcProvenance === 'LIVE' ? 'var(--nb-mint)' : 'var(--nb-yellow)',
              color: '#000000',
              padding: '3px 8px',
              border: '1.5px solid #000000',
              boxShadow: '1.5px 1.5px 0px #000000',
              borderRadius: 6,
              textTransform: 'uppercase',
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

          const badgeBg = isDanger ? 'var(--nb-pink)' : isWarning ? 'var(--nb-orange)' : 'var(--nb-mint)';
          const badgeColor = isDanger ? '#ffffff' : '#000000';
          const badgeText = isDanger ? 'DANGER' : isWarning ? 'WARNING' : 'NORMAL';

          return (
            <div
              key={station.id}
              onClick={() => {
                selectRiver(station.id);
                flyToSite(station.longitude, station.latitude);
              }}
              style={{
                background: isSelected ? 'var(--nb-mint-light)' : '#ffffff',
                border: '2px solid #000000',
                boxShadow: isSelected ? '4px 4px 0px #000000' : '3px 3px 0px #000000',
                borderRadius: 8,
                padding: '12px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                transition: 'all 0.1s ease',
              }}
            >
              <div className="panel__row panel__row--between" style={{ marginBottom: 0 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 900, color: '#000000' }}>
                    {station.name}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#525252' }}>
                    {station.river} &bull; {station.district}
                  </div>
                </div>

                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 800,
                    background: badgeBg,
                    color: badgeColor,
                    border: '1.5px solid #000000',
                    boxShadow: '1px 1px 0px #000000',
                    padding: '2px 7px',
                    borderRadius: 4,
                    textTransform: 'uppercase',
                  }}
                >
                  {badgeText}
                </span>
              </div>

              {/* Water Level Readings */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginTop: 2 }}>
                <div style={{ background: '#ffffff', border: '1.5px solid #000000', boxShadow: '1.5px 1.5px 0px #000000', borderRadius: 6, padding: '6px', textAlign: 'center' }}>
                  <div style={{ fontSize: 9, fontWeight: 800, color: '#525252' }}>CURRENT</div>
                  <div style={{ fontSize: 14, fontWeight: 900, color: '#0284c7', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                    {station.waterLevel ? `${station.waterLevel.toFixed(1)}m` : 'N/A'}
                  </div>
                </div>

                <div style={{ background: 'var(--nb-yellow-light)', border: '1.5px solid #000000', boxShadow: '1.5px 1.5px 0px #000000', borderRadius: 6, padding: '6px', textAlign: 'center' }}>
                  <div style={{ fontSize: 9, fontWeight: 800, color: '#000000' }}>WARNING</div>
                  <div style={{ fontSize: 14, fontWeight: 900, color: '#000000', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                    {station.warningLevel ? `${station.warningLevel.toFixed(1)}m` : 'N/A'}
                  </div>
                </div>

                <div style={{ background: 'var(--nb-pink-light)', border: '1.5px solid #000000', boxShadow: '1.5px 1.5px 0px #000000', borderRadius: 6, padding: '6px', textAlign: 'center' }}>
                  <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--nb-pink)' }}>DANGER</div>
                  <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--nb-pink)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                    {station.dangerLevel ? `${station.dangerLevel.toFixed(1)}m` : 'N/A'}
                  </div>
                </div>
              </div>

              {/* Discharge & Level Bar */}
              {station.flowDischargeCumecs && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, color: '#525252', marginTop: 2 }}>
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
            marginTop: 8,
            background: '#ffffff',
            border: '2px solid #000000',
            boxShadow: '3px 3px 0px #000000',
            borderRadius: 8,
            padding: '12px',
          }}
        >
          <div className="panel__row panel__row--between" style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CloudRain size={16} color="#000000" strokeWidth={2.5} />
              <span style={{ fontSize: 12, fontWeight: 900, color: '#000000', textTransform: 'uppercase' }}>
                IMD Met Telemetry
              </span>
            </div>
            <span
              style={{
                fontSize: 9,
                fontWeight: 800,
                background: imdProvenance === 'LIVE' ? 'var(--nb-mint)' : 'var(--nb-yellow)',
                color: '#000000',
                padding: '2px 7px',
                border: '1.5px solid #000000',
                boxShadow: '1px 1px 0px #000000',
                borderRadius: 4,
                textTransform: 'uppercase',
              }}
            >
              ● {weatherReport?.provenance || imdProvenance}
            </span>
          </div>

          {weatherReport && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6, marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#ffffff', padding: '6px 8px', borderRadius: 6, border: '1.5px solid #000000' }}>
                <Thermometer size={14} color="var(--nb-orange)" strokeWidth={2.5} />
                <span style={{ fontSize: 11, fontWeight: 800, color: '#000000' }}>
                  {weatherReport.current.temperature}°C ({weatherReport.current.condition})
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#ffffff', padding: '6px 8px', borderRadius: 6, border: '1.5px solid #000000' }}>
                <Droplets size={14} color="#0284c7" strokeWidth={2.5} />
                <span style={{ fontSize: 11, fontWeight: 800, color: '#000000' }}>
                  Rain: {weatherReport.current.rainfall24h} mm/24h
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#ffffff', padding: '6px 8px', borderRadius: 6, border: '1.5px solid #000000' }}>
                <Wind size={14} color="#000000" strokeWidth={2.5} />
                <span style={{ fontSize: 11, fontWeight: 700, color: '#525252' }}>
                  Wind: {weatherReport.current.windSpeed} km/h
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#ffffff', padding: '6px 8px', borderRadius: 6, border: '1.5px solid #000000' }}>
                <Gauge size={14} color="#000000" strokeWidth={2.5} />
                <span style={{ fontSize: 11, fontWeight: 700, color: '#525252' }}>
                  Humidity: {weatherReport.current.humidity}%
                </span>
              </div>
            </div>
          )}

          {/* 5-Day Forecast Strips */}
          <div style={{ fontSize: 10, fontWeight: 900, color: '#000000', marginBottom: 6, letterSpacing: '0.2px', textTransform: 'uppercase' }}>
            5-DAY METEOROLOGICAL FORECAST
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {weather.slice(0, 4).map((f, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: '#ffffff',
                  border: '1.5px solid #000000',
                  borderRadius: 6,
                  padding: '6px 10px',
                  fontSize: 11,
                }}
              >
                <span style={{ fontWeight: 800, color: '#000000' }}>{f.dayLabel || f.date}</span>
                <span style={{ color: '#0284c7', fontWeight: 700 }}>{f.condition}</span>
                <span style={{ color: '#525252', fontWeight: 700 }}>{f.maxTemp}° / {f.minTemp}°</span>
                <span style={{ fontWeight: 800, color: f.rainfall > 10 ? 'var(--nb-pink)' : '#000000' }}>
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
