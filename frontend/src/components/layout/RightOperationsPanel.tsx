import { useAppStore } from '../../store/useAppStore';
import HabitationPanel from '../panels/HabitationPanel';
import RelocationPanel from '../panels/RelocationPanel';
import AnalysisPanel from '../panels/AnalysisPanel';
import ReportsPanel from '../panels/ReportsPanel';
import AlertsPanel from '../panels/AlertsPanel';
import RiversPanel from '../panels/RiversPanel';
import LayerPanel from '../panels/LayerPanel';
import DataSourcesPanel from '../panels/DataSourcesPanel';
import SettingsPanel from '../panels/SettingsPanel';
import WorkspacesPanel from '../panels/WorkspacesPanel';
import SurveillancePanel from '../panels/SurveillancePanel';
import { ChevronRight, ChevronLeft, X } from 'lucide-react';

export default function RightOperationsPanel() {
  const {
    activeNav,
    setActiveNav,
    habitations,
    relocationSites,
    riverStations,
    roads,
    alerts,
    weatherReport,
    weather,
    systemStatus,
    backendConnected,
    selectedDistrict,
    selectedHabitationId,
    selectedSiteId,
    selectHabitation,
    selectSite,
    isRightPanelCollapsed,
    toggleRightPanel,
  } = useAppStore();

  // If collapsed, render slim vertical dock bar
  if (isRightPanelCollapsed) {
    return (
      <div
        style={{
          width: 36,
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '10px 4px',
          gap: 12,
          flexShrink: 0,
          cursor: 'pointer',
        }}
        onClick={toggleRightPanel}
        title="Expand Operations Panel"
      >
        <button
          className="btn-action"
          style={{
            padding: 4,
            border: 'none',
            background: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          <ChevronLeft size={16} />
        </button>
        <div
          style={{
            writingMode: 'vertical-rl',
            transform: 'rotate(180deg)',
            fontSize: 11,
            fontWeight: 700,
            color: 'var(--text-muted)',
            letterSpacing: '0.8px',
            textTransform: 'uppercase',
          }}
        >
          Operations Desk
        </div>
      </div>
    );
  }

  // Dynamic filter by district
  const districtHabs = habitations.filter(
    (h) => !selectedDistrict || h.district.toLowerCase() === selectedDistrict.toLowerCase()
  );
  const districtSites = relocationSites.filter(
    (s) => !selectedDistrict || s.district.toLowerCase() === selectedDistrict.toLowerCase()
  );

  const atRiskCount = districtHabs.filter(
    (h) => h.riskScore >= 0.6 || h.riskLevel === 'HIGH' || h.riskLevel === 'CRITICAL'
  ).length;
  const readySitesCount = districtSites.filter(
    (s) => s.suitability === 'HIGH' || s.suitability === 'MODERATE' || s.suitabilityScore >= 0.5
  ).length;
  const blockedRoadsCount = roads.filter(
    (r) => r.passabilityStatus === 'blocked' || r.isEvacuationRoute === false
  ).length || (alerts.some((a) => a.eventType.toLowerCase().includes('road') || a.description.toLowerCase().includes('block')) ? 1 : 0);
  const warningRiversCount = riverStations.filter(
    (r) => r.status === 'warning' || r.status === 'danger' || (r.waterLevel && r.warningLevel && r.waterLevel >= r.warningLevel)
  ).length;

  // Donut risk distribution
  const totalHabs = districtHabs.length || habitations.length || 1;
  const highRiskCount = districtHabs.filter(
    (h) => h.riskScore >= 0.7 || h.riskLevel === 'HIGH' || h.riskLevel === 'CRITICAL'
  ).length;
  const modRiskCount = districtHabs.filter(
    (h) => (h.riskScore >= 0.4 && h.riskScore < 0.7) || h.riskLevel === 'MODERATE'
  ).length;
  const lowRiskCount = districtHabs.filter(
    (h) => (h.riskScore >= 0.2 && h.riskScore < 0.4) || h.riskLevel === 'LOW'
  ).length;

  const highPct = totalHabs > 0 ? Math.round((highRiskCount / totalHabs) * 100) : 0;
  const modPct = totalHabs > 0 ? Math.round((modRiskCount / totalHabs) * 100) : 0;
  const lowPct = totalHabs > 0 ? Math.round((lowRiskCount / totalHabs) * 100) : 0;

  // Dynamic live feeds calculation
  const currentRainfall = weatherReport?.current?.rainfall24h ?? (weather[0]?.rainfall ?? 0);
  const activeGauge = riverStations.find((r) => r.status === 'warning' || r.status === 'danger') || riverStations[0];
  const topAlert = alerts[0];

  const liveFeeds = [
    {
      icon: '🌧️',
      name: 'Weather (Open-Meteo)',
      status: backendConnected ? (weatherReport?.provenance || 'LIVE') : 'DEMO',
      time: weatherReport?.updatedAt ? new Date(weatherReport.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Live',
      val: `${currentRainfall.toFixed(1)} mm (${selectedDistrict || 'Chamoli'})`,
    },
    {
      icon: '🌊',
      name: 'CWC Hydrology',
      status: systemStatus?.sources?.cwc?.status || 'STATIC',
      time: 'Live Gauges',
      val: activeGauge ? `${activeGauge.river}: ${activeGauge.waterLevel}m (${activeGauge.status.toUpperCase()})` : 'Normal Stage',
    },
    {
      icon: '⚠️',
      name: 'NDMA / SACHET',
      status: systemStatus?.sources?.sachet?.status || (alerts.length > 0 ? 'LIVE' : 'DEMO'),
      time: topAlert?.issuedAt ? new Date(topAlert.issuedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Active',
      val: `${alerts.length} Government Feeds`,
    },
    {
      icon: '🛰️',
      name: 'ISRO Bhuvan',
      status: systemStatus?.sources?.isro_bhuvan?.status || 'LIVE',
      time: 'NRSC Portal',
      val: 'LULC 50k & Census Vectors',
    },
    {
      icon: '🧭',
      name: 'OpenStreetMap',
      status: 'LIVE',
      time: 'Lifeline Mesh',
      val: `${roads.length || 5} Corridors Active`,
    },
  ];

  // Contextual Panel Routing: If activeNav is a dedicated tool panel, render it!
  const isContextualTool =
    activeNav === 'analysis' ||
    activeNav === 'reports' ||
    activeNav === 'alerts' ||
    activeNav === 'rivers' ||
    activeNav === 'layers' ||
    activeNav === 'habitations' ||
    activeNav === 'relocation' ||
    activeNav === 'datasources' ||
    activeNav === 'settings' ||
    activeNav === 'workspaces' ||
    activeNav === 'surveillance';

  const toolTitle =
    activeNav === 'analysis'
      ? 'TOPSIS Leaderboard'
      : activeNav === 'workspaces'
      ? 'Workspaces & Folders'
      : activeNav === 'surveillance'
      ? 'Surveillance & AOI Marking'
      : activeNav === 'datasources'
      ? 'Data Feeds & Provenance'
      : activeNav === 'settings'
      ? 'System Preferences'
      : activeNav === 'rivers'
      ? 'Hydrology & Gauges'
      : activeNav === 'layers'
      ? 'Hazard GIS Layers'
      : activeNav === 'habitations'
      ? 'Habitations Directory'
      : activeNav === 'relocation'
      ? 'Safe Haven Registry'
      : activeNav.toUpperCase();

  return (
    <aside
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: 380,
        gap: 8,
        overflowY: 'auto',
        flexShrink: 0,
        height: '100%',
        paddingRight: 2,
        transition: 'width 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {/* If a contextual tool is active, render the tool view with a quick back button */}
      {isContextualTool ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, height: '100%' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-xs)',
              borderRadius: 'var(--radius-lg)',
              padding: '8px 12px',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 12,
                fontWeight: 800,
                color: 'var(--accent-blue)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span>⚡</span>
              <span>{toolTitle}</span>
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                onClick={() => {
                  selectHabitation(null as any);
                  selectSite(null as any);
                  setActiveNav('map');
                }}
                className="btn-action"
                style={{ padding: '3px 8px', fontSize: 10 }}
              >
                &larr; Overview
              </button>
              <button
                onClick={toggleRightPanel}
                className="btn-action"
                style={{ padding: '4px', border: 'none', background: 'transparent', boxShadow: 'none' }}
                title="Collapse Panel"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {activeNav === 'analysis' && <AnalysisPanel />}
            {activeNav === 'workspaces' && <WorkspacesPanel />}
            {activeNav === 'surveillance' && <SurveillancePanel />}
            {activeNav === 'reports' && <ReportsPanel />}
            {activeNav === 'alerts' && <AlertsPanel />}
            {activeNav === 'rivers' && <RiversPanel />}
            {activeNav === 'layers' && <LayerPanel />}
            {activeNav === 'habitations' && <HabitationPanel />}
            {activeNav === 'relocation' && <RelocationPanel />}
            {activeNav === 'datasources' && <DataSourcesPanel />}
            {activeNav === 'settings' && <SettingsPanel />}
          </div>
        </div>
      ) : (
        <>
          {/* Active Inspector Drawer if habitation or site selected on map */}
          {(selectedHabitationId || selectedSiteId) && (
            <div
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                boxShadow: 'var(--shadow-sm)',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                marginBottom: 2,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'var(--accent-blue-subtle)',
                  borderBottom: '1px solid var(--border-color)',
                  padding: '6px 12px',
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'var(--accent-blue)',
                    textTransform: 'uppercase',
                  }}
                >
                  Inspector Telemetry
                </span>
                <button
                  onClick={() => {
                    selectHabitation(null as any);
                    selectSite(null as any);
                  }}
                  className="btn-action"
                  style={{ padding: '2px 5px', fontSize: 10 }}
                  title="Close inspector"
                >
                  <X size={12} />
                </button>
              </div>
              <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                {selectedHabitationId ? <HabitationPanel /> : <RelocationPanel />}
              </div>
            </div>
          )}

          {/* 1. CURRENT SITUATION - DISTRICT SUMMARY */}
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-sm)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                background: 'var(--bg-subtle)',
                padding: '8px 12px',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)' }}>
                  Current Situation &bull; {selectedDistrict}
                </div>
                <div style={{ fontSize: 10, fontWeight: 500, color: 'var(--text-muted)' }}>
                  Multi-Feed Telemetry Evaluation
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button
                  onClick={() => setActiveNav('analysis')}
                  className="btn-action btn-action--primary"
                  style={{ padding: '3px 8px', fontSize: 10 }}
                >
                  TOPSIS &rarr;
                </button>
                <button
                  onClick={toggleRightPanel}
                  className="btn-action"
                  style={{ padding: '4px', border: 'none', background: 'transparent', boxShadow: 'none' }}
                  title="Collapse Panel"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

            {/* 4 KPI Metric Cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 6,
                padding: '8px',
              }}
            >
              {/* Card 1: Habitations At Risk */}
              <button
                onClick={() => setActiveNav('habitations')}
                className="btn-action"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '8px 4px',
                  background: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-md)',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 15 }}>🏠</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--accent-rose)', lineHeight: 1.2 }}>
                  {atRiskCount}
                </div>
                <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  At Risk
                </div>
              </button>

              {/* Card 2: Relocation Sites Ready */}
              <button
                onClick={() => setActiveNav('relocation')}
                className="btn-action"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '8px 4px',
                  background: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-md)',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 15 }}>🏕️</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--accent-emerald)', lineHeight: 1.2 }}>
                  {readySitesCount}
                </div>
                <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Safe Sites
                </div>
              </button>

              {/* Card 3: Blocked Corridors */}
              <button
                onClick={() => setActiveNav('rivers')}
                className="btn-action"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '8px 4px',
                  background: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-md)',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 15 }}>🚧</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--accent-amber)', lineHeight: 1.2 }}>
                  {blockedRoadsCount}
                </div>
                <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Cutoffs
                </div>
              </button>

              {/* Card 4: River Flood Warning */}
              <button
                onClick={() => setActiveNav('rivers')}
                className="btn-action"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '8px 4px',
                  background: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-md)',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 15 }}>🌊</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--accent-cyan)', lineHeight: 1.2 }}>
                  {warningRiversCount}
                </div>
                <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  High Stage
                </div>
              </button>
            </div>
          </div>

          {/* 2. LIVE DATA FEEDS & PROVENANCE TABLE */}
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-sm)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                background: 'var(--bg-subtle)',
                padding: '7px 12px',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase' }}>
                Live Ingestion Feeds
              </div>
              <button
                onClick={() => setActiveNav('datasources')}
                className="btn-action"
                style={{ padding: '2px 6px', fontSize: 10 }}
              >
                Details &rarr;
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {liveFeeds.map((feed, idx) => (
                <div
                  key={feed.name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 10px',
                    borderBottom: idx < liveFeeds.length - 1 ? '1px solid var(--border-color)' : 'none',
                    fontSize: 11,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                    <span>{feed.icon}</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                      {feed.name}
                    </span>
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        background: feed.status === 'LIVE' ? 'var(--accent-emerald-subtle)' : 'var(--bg-subtle)',
                        color: feed.status === 'LIVE' ? 'var(--accent-emerald)' : 'var(--text-muted)',
                        padding: '1px 5px',
                        borderRadius: 'var(--radius-pill)',
                        border: '1px solid var(--border-color)',
                      }}
                    >
                      {feed.status}
                    </span>
                  </div>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 10,
                      fontWeight: 500,
                      color: 'var(--text-secondary)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {feed.val}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 3. DISTRICT RISK DISTRIBUTION */}
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-sm)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                background: 'var(--bg-subtle)',
                padding: '7px 12px',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase' }}>
                District Risk Distribution
              </div>
              <button
                onClick={() => setActiveNav('reports')}
                className="btn-action"
                style={{ padding: '2px 6px', fontSize: 10 }}
              >
                Report &rarr;
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', padding: '12px 14px', gap: 14 }}>
              <div style={{ position: 'relative', width: 68, height: 68, flexShrink: 0 }}>
                <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                  <circle cx="18" cy="18" r="14" fill="none" stroke="var(--bg-subtle)" strokeWidth="4" />
                  <circle
                    cx="18"
                    cy="18"
                    r="14"
                    fill="none"
                    stroke="var(--accent-rose)"
                    strokeWidth="4"
                    strokeDasharray={`${highPct} 100`}
                    strokeDashoffset="0"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="14"
                    fill="none"
                    stroke="var(--accent-amber)"
                    strokeWidth="4"
                    strokeDasharray={`${modPct} 100`}
                    strokeDashoffset={`${-highPct}`}
                  />
                </svg>
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    lineHeight: 1,
                  }}
                >
                  <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>
                    {totalHabs}
                  </span>
                  <span style={{ fontSize: 8, fontWeight: 600, color: 'var(--text-muted)' }}>
                    VILLAGES
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--accent-rose)' }} />
                    <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>High/Critical</span>
                  </div>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{highRiskCount} ({highPct}%)</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--accent-amber)' }} />
                    <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Moderate</span>
                  </div>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{modRiskCount} ({modPct}%)</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--accent-emerald)' }} />
                    <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Low / Safe</span>
                  </div>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{lowRiskCount} ({lowPct}%)</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </aside>
  );
}
