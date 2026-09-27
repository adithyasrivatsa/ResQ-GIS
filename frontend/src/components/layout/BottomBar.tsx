import { Radio, Disc, Droplets, CloudRain } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

function timeAgo(isoStr: string): string {
  const diff = Date.now() - new Date(isoStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h`;
}

export default function BottomBar() {
  const { alerts, habitations, systemStatus, riverStations, weatherReport } = useAppStore();
  const topAlert = alerts[0];
  const atRiskCount = habitations.filter((h) => h.riskScore >= 0.6).length;

  // Real telemetry provenance from /api/status (Core Operational Hierarchy)
  const sources = systemStatus?.sources || {
    osm: { status: 'STATIC', details: 'OpenStreetMap Base Geographic Context & Roads', last_updated: '' },
    copernicus: { status: 'STATIC', details: 'Copernicus 30m DEM Elevation & Slope Grid', last_updated: '' },
    bhuvan: { status: 'STATIC', details: 'ISRO Bhuvan / NRSC Glacial & Inundation Layers', last_updated: '' },
    lgd: { status: 'STATIC', details: 'LGD Admin Boundaries & Census Demographics', last_updated: '' },
    gsi: { status: 'STATIC', details: 'GSI BhuKosh / NLSM Landslide Susceptibility', last_updated: '' },
    cwc: { status: 'DEMO', details: 'CWC / India-WRIS River Gauging Telemetry', last_updated: '' },
    imd: { status: 'DEMO', details: 'IMD High-Fidelity Meteorological Telemetry', last_updated: '' },
    sachet: { status: 'DEMO', details: 'SACHET / NDMA CAP Multi-Hazard Alerts', last_updated: '' },
    sdma: { status: 'STATIC', details: 'USDMA State Emergency Advisories & Dispatch', last_updated: '' },
    idrn: { status: 'STATIC', details: 'IDRN / DEOC Emergency Shelters, Depots & Helipads', last_updated: '' },
    postgis: { status: 'DEMO', details: 'PostGIS Spatial Engine with GeoJSON Fallback', last_updated: '' },
  };

  const getDotClass = (status: string) => {
    switch (status.toUpperCase()) {
      case 'LIVE':
        return 'dot--green';
      case 'CACHED':
        return 'dot--blue';
      case 'STATIC':
        return 'dot--purple';
      case 'STALE':
      case 'DOWN':
        return 'dot--red';
      case 'DEMO':
      default:
        return 'dot--yellow';
    }
  };

  const PROVIDER_BADGES = [
    { key: 'osm', label: 'OSM' },
    { key: 'copernicus', label: 'DEM' },
    { key: 'bhuvan', label: 'BHUVAN' },
    { key: 'lgd', label: 'LGD' },
    { key: 'gsi', label: 'GSI' },
    { key: 'cwc', label: 'CWC' },
    { key: 'imd', label: 'IMD' },
    { key: 'sachet', label: 'SACHET' },
    { key: 'sdma', label: 'SDMA' },
    { key: 'idrn', label: 'IDRN' },
    { key: 'postgis', label: 'POSTGIS' },
  ];

  // Find most critical river station observation
  const warningStation = riverStations.find((s) => s.status === 'warning' || s.status === 'danger') || riverStations[0];

  return (
    <footer className="bottom-bar">
      {/* Retro Audio Deck & Equalizer */}
      <div className="bottom-bar__section" style={{ minWidth: 240 }}>
        <div
          style={{
            width: 36,
            height: 36,
            background: 'var(--retro-purple)',
            border: '2px solid #000',
            boxShadow: '2px 2px 0px #000',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
          }}
          className="spin"
        >
          <Disc size={20} />
        </div>

        <div>
          <div className="bottom-bar__section-title">
            <Radio size={12} color="#ea580c" />
            <span>TELEMETRY MIXER</span>
          </div>

          {/* Equalizer Bar Visualization */}
          <div style={{ display: 'flex', gap: 3, marginTop: 4, height: 14, alignItems: 'flex-end' }}>
            {[12, 8, 14, 6, 10, 14, 8, 12].map((h, i) => (
              <div
                key={i}
                style={{
                  width: 5,
                  height: h,
                  background: i % 2 === 0 ? 'var(--retro-purple)' : 'var(--retro-orange)',
                  border: '1px solid #000',
                  borderRadius: 1,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Live Broadcast Feed Marquee */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: '#ffffff',
          border: '2px solid #000000',
          boxShadow: '3px 3px 0px #000000',
          borderRadius: 8,
          padding: '6px 12px',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <span style={{ fontSize: 10, color: 'var(--retro-pink)' }}>♥</span>
          <span
            style={{
              fontFamily: 'Silkscreen',
              fontSize: 9,
              fontWeight: 700,
              background: 'var(--retro-orange)',
              padding: '2px 6px',
              border: '1px solid #000',
              borderRadius: 4,
            }}
          >
            DISPATCH
          </span>
        </div>

        <div style={{ fontFamily: 'Space Mono', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {topAlert ? (
            <span>
              [{topAlert.source}] {topAlert.eventType} — {topAlert.area}: {topAlert.description} ({timeAgo(topAlert.issuedAt)} ago)
            </span>
          ) : (
            <span>SECTOR STABLE // {atRiskCount} habitations under active radar surveillance</span>
          )}
        </div>

        {/* Live River Sensor Capsule */}
        {warningStation && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              background: warningStation.status === 'warning' ? '#fef3c7' : '#e0f2fe',
              border: '1.5px solid #000',
              borderRadius: 4,
              padding: '2px 6px',
              flexShrink: 0,
              fontFamily: 'Space Mono',
              fontSize: 10,
              fontWeight: 700,
            }}
            title={`${warningStation.name}: ${warningStation.waterLevel}m (Warn: ${warningStation.warningLevel}m)`}
          >
            <Droplets size={12} color="#0284c7" />
            <span>
              {warningStation.name.split(' ')[0]}: {warningStation.waterLevel?.toFixed(1)}m{' '}
              {warningStation.status === 'warning' ? '⚠️' : '✓'}
            </span>
          </div>
        )}

        {/* Live Weather Capsule */}
        {weatherReport && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              background: '#f8fafc',
              border: '1.5px solid #000',
              borderRadius: 4,
              padding: '2px 6px',
              flexShrink: 0,
              fontFamily: 'Space Mono',
              fontSize: 10,
            }}
          >
            <CloudRain size={12} color="#0284c7" />
            <span>{weatherReport.current.temperature}°C Rain {weatherReport.current.rainfall24h}mm</span>
          </div>
        )}
      </div>

      {/* Provenance Status Badges (LIVE / CACHED / STATIC / DEMO) */}
      <div
        className="system-status"
        title="Data Source Provenance Hierarchy: ● LIVE (Real-time external API) | ● CACHED (Redis L2 cache) | ● STATIC (High-fidelity verified dataset) | ● DEMO (Evaluation scenario)"
      >
        {PROVIDER_BADGES.map((prov) => {
          const item = sources[prov.key] || { status: 'STATIC', details: prov.label };
          const statusStr = (item.status || 'STATIC').toUpperCase();
          return (
            <div
              key={prov.key}
              className="system-status__item"
              title={`${prov.label}: ${item.details || ''} [Provenance: ${statusStr}]`}
            >
              <span className={getDotClass(statusStr)} />
              <span>{prov.label}: {statusStr}</span>
            </div>
          );
        })}
      </div>
    </footer>
  );
}
