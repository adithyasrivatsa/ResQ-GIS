import { Activity, Droplets, CloudRain, ShieldAlert } from 'lucide-react';
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

  const getDotColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'LIVE':
        return '#10b981'; // emerald
      case 'CACHED':
        return '#0284c7'; // sky
      case 'STATIC':
        return '#64748b'; // slate
      case 'STALE':
      case 'DOWN':
        return '#ef4444'; // red
      case 'DEMO':
      default:
        return '#f59e0b'; // amber
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
      {/* Live System Indicator */}
      <div className="bottom-bar__section" style={{ minWidth: 200, flexShrink: 0 }}>
        <div
          style={{
            width: 32,
            height: 32,
            background: 'var(--nb-mint)',
            border: '2px solid #000000',
            boxShadow: '2px 2px 0px #000000',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#000000',
            flexShrink: 0,
          }}
        >
          <Activity size={17} strokeWidth={2.5} />
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#000000',
              }}
            />
            <span style={{ fontSize: 12, fontWeight: 800, color: '#000000', textTransform: 'uppercase' }}>Live Telemetry</span>
          </div>
          <div style={{ fontSize: 10, fontWeight: 600, color: '#525252' }}>Active Spatial Network</div>
        </div>
      </div>

      {/* Live Dispatch Marquee / Ticker */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: '#ffffff',
          border: '2px solid #000000',
          boxShadow: '2px 2px 0px #000000',
          borderRadius: 8,
          padding: '6px 12px',
          overflow: 'hidden',
          minWidth: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 900,
              background: topAlert ? 'var(--nb-pink)' : 'var(--nb-mint)',
              color: topAlert ? '#ffffff' : '#000000',
              border: '1.5px solid #000000',
              boxShadow: '1.5px 1.5px 0px #000000',
              padding: '2px 8px',
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              textTransform: 'uppercase',
            }}
          >
            {topAlert ? <ShieldAlert size={12} strokeWidth={2.5} /> : null}
            {topAlert ? 'DISPATCH' : 'NORMAL'}
          </span>
        </div>

        <div
          style={{
            fontSize: 11,
            color: '#000000',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            flex: 1,
          }}
        >
          {topAlert ? (
            <span>
              <strong style={{ color: '#000000', fontWeight: 800 }}>[{topAlert.source}]</strong> {topAlert.eventType} &mdash; {topAlert.area}: {topAlert.description} ({timeAgo(topAlert.issuedAt)} ago)
            </span>
          ) : (
            <span>Sector Stable &bull; {atRiskCount} habitations under active radar surveillance</span>
          )}
        </div>

        {/* Live River Sensor Capsule */}
        {warningStation && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              background: 'var(--nb-yellow)',
              border: '1.5px solid #000000',
              boxShadow: '1.5px 1.5px 0px #000000',
              borderRadius: 6,
              padding: '2px 8px',
              flexShrink: 0,
              fontSize: 11,
              fontWeight: 700,
              color: '#000000',
            }}
            title={`${warningStation.name}: ${warningStation.waterLevel}m (Warning Level: ${warningStation.warningLevel}m)`}
          >
            <Droplets size={12} strokeWidth={2.5} color="#000000" />
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
              gap: 5,
              background: 'var(--nb-cyan-light)',
              border: '1.5px solid #000000',
              boxShadow: '1.5px 1.5px 0px #000000',
              borderRadius: 6,
              padding: '2px 8px',
              flexShrink: 0,
              fontSize: 11,
              color: '#000000',
              fontWeight: 700,
            }}
          >
            <CloudRain size={12} strokeWidth={2.5} color="#000000" />
            <span>{weatherReport.current.temperature}°C &bull; Rain {weatherReport.current.rainfall24h}mm</span>
          </div>
        )}
      </div>

      {/* Provenance Status Badges (LIVE / CACHED / STATIC / DEMO) */}
      <div
        className="system-status"
        title="Data Source Provenance Hierarchy: ● LIVE (Real-time external API) | ● CACHED (Redis L2 cache) | ● STATIC (Verified GIS dataset) | ● DEMO (Evaluation scenario)"
      >
        {PROVIDER_BADGES.map((prov) => {
          const item = sources[prov.key] || { status: 'STATIC', details: prov.label };
          const statusStr = (item.status || 'STATIC').toUpperCase();
          const dotColor = getDotColor(statusStr);
          return (
            <div
              key={prov.key}
              className="system-status__item"
              title={`${prov.label}: ${item.details || ''} [Provenance: ${statusStr}]`}
            >
              <span style={{ backgroundColor: dotColor, width: 6, height: 6, borderRadius: '50%' }} />
              <span>{prov.label}</span>
            </div>
          );
        })}
      </div>
    </footer>
  );
}
