import { useState, useMemo } from 'react';
import { Search, Download, Eye, ChevronUp, ChevronDown, Maximize2, Minimize2 } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { flyToHabitation, flyToSite } from '../../cesium/camera';
import type { RiskLevel } from '../../types';

type TabType = 'habitations' | 'sites' | 'infrastructure' | 'rivers' | 'weather';

const RISK_BADGES: Record<RiskLevel, { bg: string; color: string; label: string }> = {
  CRITICAL: { bg: 'var(--accent-rose-subtle)', color: 'var(--accent-rose)', label: 'Critical' },
  HIGH: { bg: '#fff7ed', color: '#ea580c', label: 'High' },
  MODERATE: { bg: 'var(--accent-amber-subtle)', color: 'var(--accent-amber)', label: 'Moderate' },
  LOW: { bg: 'var(--accent-emerald-subtle)', color: 'var(--accent-emerald)', label: 'Low' },
  MINIMAL: { bg: 'var(--bg-subtle)', color: 'var(--text-muted)', label: 'Minimal' },
};

export default function BottomDataTable() {
  const {
    habitations,
    relocationSites,
    riverStations,
    roads,
    weather,
    selectHabitation,
    selectSite,
    selectRiver,
    setActiveNav,
    bottomTableState,
    setBottomTableState,
    selectedBlock,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<TabType>('habitations');
  const [tableSearch, setTableSearch] = useState('');
  const [selectedRiskFilter, setSelectedRiskFilter] = useState('all');
  const selectedBlockFilter = selectedBlock || 'all';

  // Filtered habitations
  const filteredHabs = useMemo(() => {
    return habitations.filter((h) => {
      const matchesSearch =
        !tableSearch ||
        h.name.toLowerCase().includes(tableSearch.toLowerCase()) ||
        h.district.toLowerCase().includes(tableSearch.toLowerCase());
      const matchesRisk =
        selectedRiskFilter === 'all' ||
        (selectedRiskFilter === 'high' && (h.riskLevel === 'HIGH' || h.riskLevel === 'CRITICAL')) ||
        (selectedRiskFilter === 'moderate' && h.riskLevel === 'MODERATE') ||
        (selectedRiskFilter === 'low' && (h.riskLevel === 'LOW' || h.riskLevel === 'MINIMAL'));
      const matchesBlock =
        selectedBlockFilter === 'all' ||
        (h.block && h.block.toLowerCase() === selectedBlockFilter.toLowerCase());

      return matchesSearch && matchesRisk && matchesBlock;
    });
  }, [habitations, tableSearch, selectedRiskFilter, selectedBlockFilter]);

  const handleExport = () => {
    let csvHeader = '';
    let csvRows: string[] = [];

    if (activeTab === 'habitations') {
      csvHeader = 'Name,District,Block,Population,RiskScore,RiskLevel,RecommendedAction';
      csvRows = filteredHabs.map(
        (h) => `"${h.name}","${h.district}","${h.block || ''}",${h.population},${h.riskScore.toFixed(2)},"${h.riskLevel}","${h.recommendedAction}"`
      );
    } else if (activeTab === 'sites') {
      csvHeader = 'Name,District,CapacityBeds,Suitability,SlopeGrade,Latitude,Longitude';
      csvRows = relocationSites.map(
        (s) => `"${s.name}","${s.district}",${s.capacity},"${s.suitability}","${s.slopeGrade}",${s.location.lat},${s.location.lng}`
      );
    } else if (activeTab === 'infrastructure') {
      csvHeader = 'Name,HighwayType,Surface,Lanes,Status,IsEvacuationRoute';
      csvRows = roads.map(
        (r) => `"${r.name}","${r.highwayType || (r as any).type || 'primary'}","${r.surface || 'asphalt'}",${r.lanes || 2},"${r.passabilityStatus}",${r.isEvacuationRoute ? 'YES' : 'NO'}`
      );
    } else if (activeTab === 'rivers') {
      csvHeader = 'StationName,River,CurrentLevel_m,WarningLevel_m,DangerLevel_m,Status';
      csvRows = riverStations.map(
        (r) => `"${r.name}","${r.river}",${r.waterLevel ?? ''},${r.warningLevel ?? ''},${r.dangerLevel ?? ''},"${r.status}"`
      );
    } else if (activeTab === 'weather') {
      csvHeader = 'Date,Day,Rainfall_mm,MaxTemp_C,MinTemp_C,Condition';
      csvRows = weather.map(
        (w) => `"${w.date}","${w.dayLabel || (w as any).day || ''}",${w.rainfall},${w.maxTemp ?? (w as any).tempMax ?? ''},${w.minTemp ?? (w as any).tempMin ?? ''},"${w.condition}"`
      );
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + [csvHeader].concat(csvRows).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `resq_gis_${activeTab}_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const panelHeight =
    bottomTableState === 'collapsed' ? 38 : bottomTableState === 'expanded' ? 420 : 255;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
        overflow: 'hidden',
        height: panelHeight,
        flexShrink: 0,
        transition: 'height 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {/* Top Tab Bar & Bendable Controls */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-subtle)',
          borderBottom: bottomTableState === 'collapsed' ? 'none' : '1px solid var(--border-color)',
          padding: '0 8px',
          height: 38,
        }}
      >
        <div style={{ display: 'flex', gap: 4, height: '100%', alignItems: 'center' }}>
          {[
            { id: 'habitations', label: 'Habitations at Risk', count: filteredHabs.length },
            { id: 'sites', label: 'Relocation Grounds', count: relocationSites.length },
            { id: 'infrastructure', label: 'Corridors & Passes', count: roads.length },
            { id: 'rivers', label: 'River Gauges', count: riverStations.length },
            { id: 'weather', label: 'Meteo Telemetry', count: weather.length },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as TabType);
                  if (bottomTableState === 'collapsed') setBottomTableState('normal');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '5px 10px',
                  background: isActive ? 'var(--bg-surface)' : 'transparent',
                  color: isActive ? 'var(--accent-blue)' : 'var(--text-secondary)',
                  border: '1px solid',
                  borderColor: isActive ? 'var(--border-color)' : 'transparent',
                  borderBottom: isActive ? '1px solid var(--bg-surface)' : 'transparent',
                  borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 11,
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.12s ease',
                  marginTop: isActive ? 2 : 0,
                }}
              >
                <span>{tab.label}</span>
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    background: isActive ? 'var(--accent-blue-subtle)' : 'var(--border-color)',
                    color: isActive ? 'var(--accent-blue)' : 'var(--text-muted)',
                    padding: '1px 5px',
                    borderRadius: 'var(--radius-pill)',
                  }}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Panel Height Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {bottomTableState !== 'collapsed' && (
            <button
              onClick={() => setBottomTableState(bottomTableState === 'expanded' ? 'normal' : 'expanded')}
              className="btn-action"
              style={{ padding: '3px 6px', border: 'none', background: 'transparent', boxShadow: 'none' }}
              title={bottomTableState === 'expanded' ? 'Restore height' : 'Expand table'}
            >
              {bottomTableState === 'expanded' ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            </button>
          )}

          <button
            onClick={() => setBottomTableState(bottomTableState === 'collapsed' ? 'normal' : 'collapsed')}
            className="btn-action"
            style={{ padding: '3px 6px', border: 'none', background: 'transparent', boxShadow: 'none' }}
            title={bottomTableState === 'collapsed' ? 'Expand Data Table' : 'Minimize Data Table'}
          >
            {bottomTableState === 'collapsed' ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        </div>
      </div>

      {/* Main Content Area (Hidden if Collapsed) */}
      {bottomTableState !== 'collapsed' && (
        <>
          {/* Controls Bar: Search, Filters & Export */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 12px',
              background: 'var(--bg-surface)',
              borderBottom: '1px solid var(--border-color)',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
              {/* Search Box */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '4px 8px',
                  maxWidth: 280,
                  width: '100%',
                }}
              >
                <Search size={13} color="var(--text-muted)" />
                <input
                  type="text"
                  placeholder={`Search ${activeTab}...`}
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    outline: 'none',
                    fontFamily: 'var(--font-sans)',
                    fontSize: 11,
                    fontWeight: 500,
                    color: 'var(--text-primary)',
                    width: '100%',
                  }}
                />
              </div>

              {/* Risk Level Filter */}
              {activeTab === 'habitations' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>Risk</span>
                  <select
                    value={selectedRiskFilter}
                    onChange={(e) => setSelectedRiskFilter(e.target.value)}
                    style={{
                      padding: '3px 8px',
                      fontFamily: 'var(--font-sans)',
                      fontSize: 11,
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--bg-subtle)',
                      cursor: 'pointer',
                      outline: 'none',
                    }}
                  >
                    <option value="all">All Levels</option>
                    <option value="high">High & Critical</option>
                    <option value="moderate">Moderate</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              )}
            </div>

            {/* CSV Export Button */}
            <button
              onClick={handleExport}
              className="btn-action btn-action--primary"
              style={{ padding: '4px 10px', fontSize: 11 }}
            >
              <Download size={13} />
              <span>Export CSV</span>
            </button>
          </div>

          {/* Structured High-Density Table */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {activeTab === 'habitations' && (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', position: 'sticky', top: 0, zIndex: 10 }}>
                    <th style={{ padding: '6px 8px', textAlign: 'center', width: 35, fontWeight: 700 }}>#</th>
                    <th style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 700 }}>Settlement</th>
                    <th style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 700 }}>Block</th>
                    <th style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 700 }}>Population</th>
                    <th style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 700 }}>Primary Threat</th>
                    <th style={{ padding: '6px 10px', textAlign: 'center', fontWeight: 700 }}>Severity</th>
                    <th style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 700 }}>Mitigation Directive</th>
                    <th style={{ padding: '6px 8px', textAlign: 'center', width: 45, fontWeight: 700 }}>View</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHabs.map((hab, idx) => {
                    const primaryHazard = hab.hazardExposure && hab.hazardExposure[0] ? hab.hazardExposure[0].type.toUpperCase() : 'LANDSLIDE';
                    const badge = RISK_BADGES[hab.riskLevel] || RISK_BADGES.MODERATE;
                    return (
                      <tr
                        key={hab.id}
                        style={{
                          borderBottom: '1px solid var(--border-color)',
                          background: idx % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-subtle)',
                          transition: 'background 0.1s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent-blue-subtle)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = idx % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-subtle)')}
                      >
                        <td style={{ padding: '5px 8px', textAlign: 'center', fontWeight: 600, color: 'var(--text-muted)' }}>{idx + 1}</td>
                        <td style={{ padding: '5px 10px', fontWeight: 700, color: 'var(--text-primary)' }}>{hab.name}</td>
                        <td style={{ padding: '5px 10px', fontWeight: 500, color: 'var(--text-secondary)' }}>{hab.block || 'Joshimath'}</td>
                        <td style={{ padding: '5px 10px', textAlign: 'right', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                          {hab.population.toLocaleString()}
                        </td>
                        <td style={{ padding: '5px 10px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                          {primaryHazard}
                        </td>
                        <td style={{ padding: '5px 10px', textAlign: 'center' }}>
                          <span
                            className="risk-badge risk-badge--sm"
                            style={{
                              background: badge.bg,
                              color: badge.color,
                            }}
                          >
                            {badge.label}
                          </span>
                        </td>
                        <td style={{ padding: '5px 10px', fontWeight: 500, color: 'var(--text-secondary)' }}>
                          {hab.recommendedAction || 'Prepare for relocation'}
                        </td>
                        <td style={{ padding: '5px 8px', textAlign: 'center' }}>
                          <button
                            onClick={() => {
                              selectHabitation(hab.id);
                              setActiveNav('habitations');
                              if (hab.location) flyToHabitation(hab.location.lng, hab.location.lat);
                            }}
                            className="btn-action"
                            style={{ padding: '3px 6px', borderRadius: 'var(--radius-sm)' }}
                            title={`Inspect ${hab.name}`}
                          >
                            <Eye size={12} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {/* Relocation Sites Table */}
            {activeTab === 'sites' && (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', position: 'sticky', top: 0, zIndex: 10 }}>
                    <th style={{ padding: '6px 8px', textAlign: 'center', width: 35, fontWeight: 700 }}>#</th>
                    <th style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 700 }}>Safe Haven Name</th>
                    <th style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 700 }}>District</th>
                    <th style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 700 }}>Capacity (Beds)</th>
                    <th style={{ padding: '6px 10px', textAlign: 'center', fontWeight: 700 }}>Suitability</th>
                    <th style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 700 }}>Slope Gradient</th>
                    <th style={{ padding: '6px 8px', textAlign: 'center', width: 45, fontWeight: 700 }}>View</th>
                  </tr>
                </thead>
                <tbody>
                  {relocationSites.map((site, idx) => (
                    <tr
                      key={site.id}
                      style={{
                        borderBottom: '1px solid var(--border-color)',
                        background: idx % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-subtle)',
                      }}
                    >
                      <td style={{ padding: '5px 8px', textAlign: 'center', color: 'var(--text-muted)' }}>{idx + 1}</td>
                      <td style={{ padding: '5px 10px', fontWeight: 700, color: 'var(--text-primary)' }}>{site.name}</td>
                      <td style={{ padding: '5px 10px', color: 'var(--text-secondary)' }}>{site.district}</td>
                      <td style={{ padding: '5px 10px', textAlign: 'right', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{site.capacity.toLocaleString()}</td>
                      <td style={{ padding: '5px 10px', textAlign: 'center' }}>
                        <span className="risk-badge risk-badge--sm risk--low">
                          {site.suitability}
                        </span>
                      </td>
                      <td style={{ padding: '5px 10px', color: 'var(--text-secondary)' }}>{site.slopeGrade}</td>
                      <td style={{ padding: '5px 8px', textAlign: 'center' }}>
                        <button
                          onClick={() => {
                            selectSite(site.id);
                            setActiveNav('relocation');
                            if (site.location) flyToSite(site.location.lng, site.location.lat);
                          }}
                          className="btn-action"
                          style={{ padding: '3px 6px' }}
                        >
                          <Eye size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* River Gauges Table */}
            {activeTab === 'rivers' && (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', position: 'sticky', top: 0, zIndex: 10 }}>
                    <th style={{ padding: '6px 8px', textAlign: 'center', width: 35, fontWeight: 700 }}>#</th>
                    <th style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 700 }}>Gauge Station</th>
                    <th style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 700 }}>River Basin</th>
                    <th style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 700 }}>Current Level</th>
                    <th style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 700 }}>Warning Level</th>
                    <th style={{ padding: '6px 10px', textAlign: 'center', fontWeight: 700 }}>Status</th>
                    <th style={{ padding: '6px 8px', textAlign: 'center', width: 45, fontWeight: 700 }}>View</th>
                  </tr>
                </thead>
                <tbody>
                  {riverStations.map((river, idx) => (
                    <tr
                      key={river.id}
                      style={{
                        borderBottom: '1px solid var(--border-color)',
                        background: idx % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-subtle)',
                      }}
                    >
                      <td style={{ padding: '5px 8px', textAlign: 'center', color: 'var(--text-muted)' }}>{idx + 1}</td>
                      <td style={{ padding: '5px 10px', fontWeight: 700, color: 'var(--text-primary)' }}>{river.name}</td>
                      <td style={{ padding: '5px 10px', color: 'var(--text-secondary)' }}>{river.river}</td>
                      <td style={{ padding: '5px 10px', textAlign: 'right', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{river.waterLevel ?? '—'}m</td>
                      <td style={{ padding: '5px 10px', textAlign: 'right', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{river.warningLevel ?? '—'}m</td>
                      <td style={{ padding: '5px 10px', textAlign: 'center' }}>
                        <span
                          className={`risk-badge risk-badge--sm ${river.status === 'danger' ? 'risk--critical' : river.status === 'warning' ? 'risk--moderate' : 'risk--low'}`}
                        >
                          {river.status}
                        </span>
                      </td>
                      <td style={{ padding: '5px 8px', textAlign: 'center' }}>
                        <button
                          onClick={() => {
                            selectRiver(river.id);
                            setActiveNav('rivers');
                            if (river.location) flyToSite(river.location.lng, river.location.lat);
                          }}
                          className="btn-action"
                          style={{ padding: '3px 6px' }}
                        >
                          <Eye size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Corridors / Infrastructure Table */}
            {activeTab === 'infrastructure' && (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', position: 'sticky', top: 0, zIndex: 10 }}>
                    <th style={{ padding: '6px 8px', textAlign: 'center', width: 35, fontWeight: 700 }}>#</th>
                    <th style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 700 }}>Highway / Corridor</th>
                    <th style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 700 }}>Classification</th>
                    <th style={{ padding: '6px 10px', textAlign: 'center', fontWeight: 700 }}>Passability</th>
                    <th style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 700 }}>Lanes / Span</th>
                    <th style={{ padding: '6px 10px', textAlign: 'center', fontWeight: 700 }}>Evacuation Lifeline</th>
                  </tr>
                </thead>
                <tbody>
                  {roads.map((road, idx) => (
                    <tr
                      key={road.id}
                      style={{
                        borderBottom: '1px solid var(--border-color)',
                        background: idx % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-subtle)',
                      }}
                    >
                      <td style={{ padding: '5px 8px', textAlign: 'center', color: 'var(--text-muted)' }}>{idx + 1}</td>
                      <td style={{ padding: '5px 10px', fontWeight: 700, color: 'var(--text-primary)' }}>{road.name}</td>
                      <td style={{ padding: '5px 10px', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                        {road.highwayType || (road as any).type || 'Primary'}
                      </td>
                      <td style={{ padding: '5px 10px', textAlign: 'center' }}>
                        <span
                          className={`risk-badge risk-badge--sm ${road.passabilityStatus === 'blocked' ? 'risk--critical' : 'risk--low'}`}
                        >
                          {road.passabilityStatus}
                        </span>
                      </td>
                      <td style={{ padding: '5px 10px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                        {road.lanes ? `${road.lanes} lanes` : (road.distanceKm ? `${road.distanceKm} km` : '2 lanes')}
                      </td>
                      <td style={{ padding: '5px 10px', textAlign: 'center' }}>
                        <span style={{ color: road.isEvacuationRoute ? 'var(--accent-emerald)' : 'var(--text-muted)', fontWeight: 700 }}>
                          {road.isEvacuationRoute ? '✓ Lifeline' : 'Secondary'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Weather Forecast Table */}
            {activeTab === 'weather' && (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', position: 'sticky', top: 0, zIndex: 10 }}>
                    <th style={{ padding: '6px 8px', textAlign: 'center', width: 35, fontWeight: 700 }}>#</th>
                    <th style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 700 }}>Date</th>
                    <th style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 700 }}>Day</th>
                    <th style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 700 }}>24h Rainfall</th>
                    <th style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 700 }}>Max Temp</th>
                    <th style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 700 }}>Min Temp</th>
                    <th style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 700 }}>Condition</th>
                  </tr>
                </thead>
                <tbody>
                  {weather.map((w, idx) => (
                    <tr
                      key={w.date}
                      style={{
                        borderBottom: '1px solid var(--border-color)',
                        background: idx % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-subtle)',
                      }}
                    >
                      <td style={{ padding: '5px 8px', textAlign: 'center', color: 'var(--text-muted)' }}>{idx + 1}</td>
                      <td style={{ padding: '5px 10px', fontWeight: 700, color: 'var(--text-primary)' }}>{w.date}</td>
                      <td style={{ padding: '5px 10px', color: 'var(--text-secondary)' }}>{w.dayLabel || (w as any).day || '—'}</td>
                      <td style={{ padding: '5px 10px', textAlign: 'right', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>
                        {(w.rainfall ?? 0).toFixed(1)} mm
                      </td>
                      <td style={{ padding: '5px 10px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                        {w.maxTemp !== undefined ? `${w.maxTemp}°C` : (w as any).tempMax !== undefined ? `${(w as any).tempMax}°C` : '—'}
                      </td>
                      <td style={{ padding: '5px 10px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                        {w.minTemp !== undefined ? `${w.minTemp}°C` : (w as any).tempMin !== undefined ? `${(w as any).tempMin}°C` : '—'}
                      </td>
                      <td style={{ padding: '5px 10px', color: 'var(--text-secondary)' }}>{w.condition}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
