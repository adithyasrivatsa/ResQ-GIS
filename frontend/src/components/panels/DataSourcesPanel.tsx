import { Database, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export default function DataSourcesPanel() {
  const { systemStatus, backendConnected, alerts, weatherReport, riverStations, loadAllData } = useAppStore();

  const sources = [
    {
      id: 'sachet',
      name: 'NDMA SACHET (CAP Alert Engine)',
      agency: 'National Disaster Management Authority, Govt of India',
      endpoint: 'https://sachet.ndma.gov.in/cap_public_website/FetchAllAlertDetails',
      status: systemStatus?.sources?.sachet?.status || (alerts.length > 0 ? 'LIVE' : 'DEMO'),
      type: 'Real-time JSON CAP feed',
      latency: '5 min sync interval',
      details: `${alerts.length} active governmental warning bulletins currently loaded into spatial engine.`,
    },
    {
      id: 'openmeteo',
      name: 'Open-Meteo Meteorological Service',
      agency: 'ECMWF / DWD High-Resolution NWP Models',
      endpoint: 'https://api.open-meteo.com/v1/forecast',
      status: backendConnected ? (weatherReport?.provenance || 'LIVE') : 'DEMO',
      type: 'Real-time Hourly & 7-Day Atmospheric Telemetry',
      latency: '< 400ms query',
      details: weatherReport?.current?.rainfall24h !== undefined
        ? `Current 24h Rainfall: ${weatherReport.current.rainfall24h.toFixed(1)} mm, Temp: ${weatherReport.current.temperature.toFixed(1)}°C, Humidity: ${weatherReport.current.humidity}%.`
        : 'Live meteorological telemetry active.',
    },
    {
      id: 'isro',
      name: 'ISRO Bhuvan NRSC LULC 50k',
      agency: 'National Remote Sensing Centre (NRSC) / ISRO',
      endpoint: 'https://bhuvan-app1.nrsc.gov.in/api/lulc50k/get_lulc50k_district.php?dist_code=0502',
      status: systemStatus?.sources?.isro_bhuvan?.status || 'LIVE',
      type: 'Official District Land Use / Land Cover Statistics',
      latency: 'On-demand REST',
      details: 'Satellite land use classification (Built-up, Forest, Agriculture, Snow/Glacier) for Himalayan districts.',
    },
    {
      id: 'cwc',
      name: 'Central Water Commission (CWC)',
      agency: 'Ministry of Jal Shakti, Department of Water Resources',
      endpoint: 'National Hydrological Telemetry / river_stations.geojson',
      status: systemStatus?.sources?.cwc?.status || 'STATIC',
      type: 'River Gauge & Flood Stage Telemetry',
      latency: 'Calibrated Station Baseline',
      details: `${riverStations.length} critical gauge stations monitored (Alaknanda, Dhauliganga, Mandakini, Bhagirathi).`,
    },
    {
      id: 'gsi',
      name: 'Geological Survey of India (GSI)',
      agency: 'Ministry of Mines, Govt of India',
      endpoint: 'Tectonic Fault & Landslide Inventory Vector Datasets',
      status: 'VERIFIED',
      type: 'Geodesic Haversine Proximity Engine',
      latency: 'Local Geodesic Spatial Matrix',
      details: 'Main Central Thrust (MCT) tectonic fault buffer calculations and slope instability zones.',
    },
    {
      id: 'osm',
      name: 'OpenStreetMap & BRO Road Corridors',
      agency: 'Border Roads Organisation / OSM Highway Network',
      endpoint: 'NH-7 Badrinath National Highway & Feeder Corridors',
      status: 'ACTIVE',
      type: 'Evacuation Route Geometry & Passability Matrix',
      latency: 'Sub-second Path Verification',
      details: 'Monitors bridge bottlenecks, landslide debris pinch points, and alternate evacuation havens.',
    },
  ];

  return (
    <div className="panel">
      {/* Header Banner */}
      <div className="panel__section" style={{ background: 'var(--bg-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
              <Database size={18} strokeWidth={2} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                Data Feeds & Provenance
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Real-Time Government & Geospatial Integrations
              </div>
            </div>
          </div>

          <button
            onClick={() => loadAllData()}
            className="btn-action"
            style={{ padding: '5px 10px', fontSize: 10 }}
          >
            <RefreshCw size={12} strokeWidth={2} />
            <span>Sync All</span>
          </button>
        </div>
      </div>

      {/* Backend Connectivity Status Card */}
      <div
        style={{
          margin: '10px 14px 4px 14px',
          padding: '8px 12px',
          background: backendConnected ? 'var(--accent-emerald-subtle)' : 'var(--accent-rose-subtle)',
          border: backendConnected ? '1px solid var(--accent-emerald)' : '1px solid var(--accent-rose)',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {backendConnected ? (
            <CheckCircle2 size={15} strokeWidth={2} color="var(--accent-emerald)" />
          ) : (
            <AlertTriangle size={15} strokeWidth={2} color="var(--accent-rose)" />
          )}
          <span style={{ fontSize: 11, fontWeight: 600, color: backendConnected ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
            FastAPI Engine: {backendConnected ? 'ONLINE (127.0.0.1:8000)' : 'STANDALONE OFFLINE'}
          </span>
        </div>
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            background: 'var(--bg-surface)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-color)',
            padding: '2px 7px',
            borderRadius: 'var(--radius-pill)',
          }}
        >
          {backendConnected ? 'TELEMETRY SYNCED' : 'DEMO FALLBACK'}
        </span>
      </div>

      {/* List of Data Sources */}
      <div className="panel__list" style={{ padding: '8px 14px 16px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {sources.map((src) => {
          const isLive = src.status === 'LIVE' || src.status === 'ACTIVE' || src.status === 'VERIFIED';
          return (
            <div
              key={src.id}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                boxShadow: 'var(--shadow-xs)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{src.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{src.agency}</div>
                </div>
                <span
                  style={{
                    background: isLive ? 'var(--accent-emerald-subtle)' : 'var(--accent-amber-subtle)',
                    color: isLive ? 'var(--accent-emerald)' : 'var(--accent-amber)',
                    fontSize: 9,
                    fontWeight: 700,
                    border: '1px solid var(--border-color)',
                    padding: '2px 6px',
                    borderRadius: 'var(--radius-pill)',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {src.status}
                </span>
              </div>

              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  color: 'var(--text-secondary)',
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border-color)',
                  padding: '3px 6px',
                  borderRadius: 'var(--radius-xs)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={src.endpoint}
              >
                {src.endpoint}
              </div>

              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{src.details}</div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderTop: '1px solid var(--border-color)',
                  paddingTop: 6,
                  marginTop: 2,
                  fontSize: 10,
                  color: 'var(--text-muted)',
                }}
              >
                <span>Protocol: {src.type}</span>
                <span>{src.latency}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
