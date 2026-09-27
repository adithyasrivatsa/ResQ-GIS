import { useState, useMemo } from 'react';
import { Search, Download, Eye } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { flyToHabitation, flyToSite } from '../../cesium/camera';
import type { RiskLevel } from '../../types';

type TabType = 'habitations' | 'sites' | 'infrastructure' | 'rivers' | 'weather';

const RISK_BADGES: Record<RiskLevel, { bg: string; color: string; label: string }> = {
  CRITICAL: { bg: '#ef4444', color: '#ffffff', label: 'Critical' },
  HIGH: { bg: '#ef4444', color: '#ffffff', label: 'High' },
  MODERATE: { bg: '#fde047', color: '#000000', label: 'Moderate' },
  LOW: { bg: '#86efac', color: '#000000', label: 'Low' },
  MINIMAL: { bg: '#e2e8f0', color: '#000000', label: 'Minimal' },
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
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<TabType>('habitations');
  const [tableSearch, setTableSearch] = useState('');
  const [selectedRiskFilter, setSelectedRiskFilter] = useState('all');
  const [selectedBlockFilter, setSelectedBlockFilter] = useState('all');

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
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Name,District,Population,RiskScore,RiskLevel,RecommendedAction']
        .concat(
          filteredHabs.map(
            (h) =>
              `"${h.name}","${h.district}",${h.population},${h.riskScore.toFixed(2)},"${h.riskLevel}","${h.recommendedAction}"`
          )
        )
        .join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `resq_gis_${activeTab}_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: '#ffffff',
        border: '2.5px solid #000000',
        boxShadow: '3px 3px 0px #000000',
        borderRadius: 12,
        overflow: 'hidden',
        height: 275,
        flexShrink: 0,
      }}
    >
      {/* Top Tab Switcher */}
      <div
        style={{
          display: 'flex',
          background: '#fde047',
          borderBottom: '2.5px solid #000000',
          gap: 4,
          padding: '4px 6px 0 6px',
        }}
      >
        {[
          { id: 'habitations', label: 'Habitations at Risk' },
          { id: 'sites', label: 'Relocation Sites' },
          { id: 'infrastructure', label: 'Infrastructure Status' },
          { id: 'rivers', label: 'River Gauges' },
          { id: 'weather', label: 'Weather Forecast' },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              style={{
                padding: '6px 14px',
                border: '2px solid #000000',
                borderBottom: isActive ? '2px solid #ffffff' : '2px solid #000000',
                marginBottom: isActive ? -2.5 : 0,
                background: isActive ? '#38bdf8' : '#fef08a',
                color: '#000000',
                fontFamily: 'var(--font-sans)',
                fontSize: 11,
                fontWeight: 900,
                borderRadius: '6px 6px 0 0',
                cursor: 'pointer',
                transition: 'all 0.1s ease',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Controls Bar: Search, Filters & Export */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 12px',
          background: '#ffffff',
          borderBottom: '2px solid #000000',
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
              background: '#ffffff',
              border: '2px solid #000000',
              borderRadius: 6,
              padding: '4px 8px',
              maxWidth: 320,
              width: '100%',
            }}
          >
            <Search size={14} strokeWidth={2.5} color="#000000" />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              style={{
                border: 'none',
                outline: 'none',
                fontFamily: 'var(--font-sans)',
                fontSize: 11,
                fontWeight: 700,
                width: '100%',
              }}
            />
          </div>

          {/* Risk Level Filter */}
          {activeTab === 'habitations' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: '#000000' }}>Risk Level</span>
              <select
                value={selectedRiskFilter}
                onChange={(e) => setSelectedRiskFilter(e.target.value)}
                style={{
                  padding: '3px 8px',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 11,
                  fontWeight: 800,
                  border: '1.5px solid #000000',
                  borderRadius: 4,
                  background: '#ffffff',
                  cursor: 'pointer',
                }}
              >
                <option value="all">All</option>
                <option value="high">High & Critical</option>
                <option value="moderate">Moderate</option>
                <option value="low">Low</option>
              </select>
            </div>
          )}

          {/* Block Filter */}
          {activeTab === 'habitations' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: '#000000' }}>Block</span>
              <select
                value={selectedBlockFilter}
                onChange={(e) => setSelectedBlockFilter(e.target.value)}
                style={{
                  padding: '3px 8px',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 11,
                  fontWeight: 800,
                  border: '1.5px solid #000000',
                  borderRadius: 4,
                  background: '#ffffff',
                  cursor: 'pointer',
                }}
              >
                <option value="all">All</option>
                <option value="Joshimath">Joshimath</option>
                <option value="Dasholi">Dasholi</option>
                <option value="Pipalkoti">Pipalkoti</option>
                <option value="Chamoli">Chamoli</option>
                <option value="Gopeshwar">Gopeshwar</option>
              </select>
            </div>
          )}
        </div>

        {/* Export Button */}
        <button
          onClick={handleExport}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: '#38bdf8',
            color: '#000000',
            border: '2px solid #000000',
            boxShadow: '1.5px 1.5px 0px #000000',
            borderRadius: 6,
            padding: '5px 12px',
            fontFamily: 'var(--font-sans)',
            fontSize: 11,
            fontWeight: 900,
            cursor: 'pointer',
            transition: 'all 0.1s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--nb-yellow)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#38bdf8')}
        >
          <Download size={13} strokeWidth={2.5} />
          <span>Export</span>
        </button>
      </div>

      {/* Structured High-Density Table */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {activeTab === 'habitations' && (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ background: '#bfdbfe', borderBottom: '2px solid #000000', color: '#000000', position: 'sticky', top: 0, zIndex: 10 }}>
                <th style={{ padding: '6px 8px', borderRight: '1px solid #000000', textAlign: 'center', width: 35, fontWeight: 900 }}>#</th>
                <th style={{ padding: '6px 10px', borderRight: '1px solid #000000', textAlign: 'left', fontWeight: 900 }}>Habitation Name</th>
                <th style={{ padding: '6px 10px', borderRight: '1px solid #000000', textAlign: 'left', fontWeight: 900 }}>Block</th>
                <th style={{ padding: '6px 10px', borderRight: '1px solid #000000', textAlign: 'right', fontWeight: 900 }}>Population (est.)</th>
                <th style={{ padding: '6px 10px', borderRight: '1px solid #000000', textAlign: 'left', fontWeight: 900 }}>Primary Hazard</th>
                <th style={{ padding: '6px 10px', borderRight: '1px solid #000000', textAlign: 'center', fontWeight: 900 }}>Risk Level</th>
                <th style={{ padding: '6px 10px', borderRight: '1px solid #000000', textAlign: 'left', fontWeight: 900 }}>Recommended Action</th>
                <th style={{ padding: '6px 8px', textAlign: 'center', width: 45, fontWeight: 900 }}>View</th>
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
                      borderBottom: '1px solid #e2e8f0',
                      background: idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                      transition: 'background 0.1s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#fef08a')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = idx % 2 === 0 ? '#ffffff' : '#f8fafc')}
                  >
                    <td style={{ padding: '5px 8px', textAlign: 'center', fontWeight: 800, borderRight: '1px solid #e2e8f0' }}>{idx + 1}</td>
                    <td style={{ padding: '5px 10px', fontWeight: 800, borderRight: '1px solid #e2e8f0' }}>{hab.name}</td>
                    <td style={{ padding: '5px 10px', fontWeight: 600, color: '#475569', borderRight: '1px solid #e2e8f0' }}>{hab.block || 'Joshimath'}</td>
                    <td style={{ padding: '5px 10px', textAlign: 'right', fontWeight: 700, fontFamily: 'var(--font-mono)', borderRight: '1px solid #e2e8f0' }}>
                      {hab.population.toLocaleString()}
                    </td>
                    <td style={{ padding: '5px 10px', fontWeight: 700, color: '#334155', borderRight: '1px solid #e2e8f0' }}>
                      {primaryHazard}
                    </td>
                    <td style={{ padding: '5px 10px', textAlign: 'center', borderRight: '1px solid #e2e8f0' }}>
                      <span
                        style={{
                          background: badge.bg,
                          color: badge.color,
                          fontSize: 10,
                          fontWeight: 900,
                          padding: '2px 8px',
                          borderRadius: 4,
                          border: '1px solid #000000',
                          textTransform: 'uppercase',
                        }}
                      >
                        {badge.label}
                      </span>
                    </td>
                    <td style={{ padding: '5px 10px', fontWeight: 600, color: '#1e293b', borderRight: '1px solid #e2e8f0' }}>
                      {hab.recommendedAction || 'Prepare for relocation'}
                    </td>
                    <td style={{ padding: '5px 8px', textAlign: 'center' }}>
                      <button
                        onClick={() => {
                          selectHabitation(hab.id);
                          if (hab.location) flyToHabitation(hab.location.lng, hab.location.lat);
                        }}
                        style={{
                          background: '#38bdf8',
                          border: '1.5px solid #000000',
                          boxShadow: '1px 1px 0px #000000',
                          borderRadius: 4,
                          width: 26,
                          height: 24,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                        }}
                        title={`View ${hab.name}`}
                      >
                        <Eye size={13} strokeWidth={2.5} color="#000000" />
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
              <tr style={{ background: '#bfdbfe', borderBottom: '2px solid #000000', color: '#000000', position: 'sticky', top: 0, zIndex: 10 }}>
                <th style={{ padding: '6px 8px', borderRight: '1px solid #000000', textAlign: 'center', width: 35, fontWeight: 900 }}>#</th>
                <th style={{ padding: '6px 10px', borderRight: '1px solid #000000', textAlign: 'left', fontWeight: 900 }}>Safe Haven Name</th>
                <th style={{ padding: '6px 10px', borderRight: '1px solid #000000', textAlign: 'left', fontWeight: 900 }}>District</th>
                <th style={{ padding: '6px 10px', borderRight: '1px solid #000000', textAlign: 'right', fontWeight: 900 }}>Capacity (Beds)</th>
                <th style={{ padding: '6px 10px', borderRight: '1px solid #000000', textAlign: 'center', fontWeight: 900 }}>Suitability</th>
                <th style={{ padding: '6px 10px', borderRight: '1px solid #000000', textAlign: 'left', fontWeight: 900 }}>Slope Gradient</th>
                <th style={{ padding: '6px 8px', textAlign: 'center', width: 45, fontWeight: 900 }}>View</th>
              </tr>
            </thead>
            <tbody>
              {relocationSites.map((site, idx) => (
                <tr key={site.id} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                  <td style={{ padding: '5px 8px', textAlign: 'center', fontWeight: 800 }}>{idx + 1}</td>
                  <td style={{ padding: '5px 10px', fontWeight: 800 }}>{site.name}</td>
                  <td style={{ padding: '5px 10px', fontWeight: 600 }}>{site.district}</td>
                  <td style={{ padding: '5px 10px', textAlign: 'right', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{site.capacity.toLocaleString()}</td>
                  <td style={{ padding: '5px 10px', textAlign: 'center' }}>
                    <span style={{ background: '#86efac', border: '1px solid #000', padding: '2px 7px', borderRadius: 4, fontWeight: 800 }}>
                      {site.suitability}
                    </span>
                  </td>
                  <td style={{ padding: '5px 10px', fontWeight: 600 }}>{site.slopeGrade}</td>
                  <td style={{ padding: '5px 8px', textAlign: 'center' }}>
                    <button
                      onClick={() => {
                        selectSite(site.id);
                        if (site.location) flyToSite(site.location.lng, site.location.lat);
                      }}
                      style={{
                        background: '#38bdf8',
                        border: '1.5px solid #000000',
                        boxShadow: '1px 1px 0px #000000',
                        borderRadius: 4,
                        width: 26,
                        height: 24,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      <Eye size={13} strokeWidth={2.5} color="#000000" />
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
              <tr style={{ background: '#bfdbfe', borderBottom: '2px solid #000000', color: '#000000', position: 'sticky', top: 0, zIndex: 10 }}>
                <th style={{ padding: '6px 8px', borderRight: '1px solid #000000', textAlign: 'center', width: 35, fontWeight: 900 }}>#</th>
                <th style={{ padding: '6px 10px', borderRight: '1px solid #000000', textAlign: 'left', fontWeight: 900 }}>Station Name</th>
                <th style={{ padding: '6px 10px', borderRight: '1px solid #000000', textAlign: 'left', fontWeight: 900 }}>River Basin</th>
                <th style={{ padding: '6px 10px', borderRight: '1px solid #000000', textAlign: 'right', fontWeight: 900 }}>Current Level</th>
                <th style={{ padding: '6px 10px', borderRight: '1px solid #000000', textAlign: 'right', fontWeight: 900 }}>Warning Level</th>
                <th style={{ padding: '6px 10px', borderRight: '1px solid #000000', textAlign: 'center', fontWeight: 900 }}>Status</th>
                <th style={{ padding: '6px 8px', textAlign: 'center', width: 45, fontWeight: 900 }}>View</th>
              </tr>
            </thead>
            <tbody>
              {riverStations.map((river, idx) => (
                <tr key={river.id} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                  <td style={{ padding: '5px 8px', textAlign: 'center', fontWeight: 800 }}>{idx + 1}</td>
                  <td style={{ padding: '5px 10px', fontWeight: 800 }}>{river.name}</td>
                  <td style={{ padding: '5px 10px', fontWeight: 600 }}>{river.river}</td>
                  <td style={{ padding: '5px 10px', textAlign: 'right', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{river.waterLevel ?? '—'}m</td>
                  <td style={{ padding: '5px 10px', textAlign: 'right', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{river.warningLevel ?? '—'}m</td>
                  <td style={{ padding: '5px 10px', textAlign: 'center' }}>
                    <span style={{ background: river.status === 'danger' ? '#ef4444' : '#86efac', color: river.status === 'danger' ? '#ffffff' : '#000000', border: '1px solid #000', padding: '2px 7px', borderRadius: 4, fontWeight: 800, textTransform: 'uppercase' }}>
                      {river.status}
                    </span>
                  </td>
                  <td style={{ padding: '5px 8px', textAlign: 'center' }}>
                    <button
                      onClick={() => {
                        selectRiver(river.id);
                        if (river.location) flyToSite(river.location.lng, river.location.lat);
                      }}
                      style={{
                        background: '#38bdf8',
                        border: '1.5px solid #000000',
                        boxShadow: '1px 1px 0px #000000',
                        borderRadius: 4,
                        width: 26,
                        height: 24,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      <Eye size={13} strokeWidth={2.5} color="#000000" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Infrastructure Table */}
        {activeTab === 'infrastructure' && (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ background: '#bfdbfe', borderBottom: '2px solid #000000', color: '#000000', position: 'sticky', top: 0, zIndex: 10 }}>
                <th style={{ padding: '6px 8px', borderRight: '1px solid #000000', textAlign: 'center', width: 35, fontWeight: 900 }}>#</th>
                <th style={{ padding: '6px 10px', borderRight: '1px solid #000000', textAlign: 'left', fontWeight: 900 }}>Corridor / Road</th>
                <th style={{ padding: '6px 10px', borderRight: '1px solid #000000', textAlign: 'left', fontWeight: 900 }}>Classification</th>
                <th style={{ padding: '6px 10px', borderRight: '1px solid #000000', textAlign: 'center', fontWeight: 900 }}>Status</th>
                <th style={{ padding: '6px 10px', borderRight: '1px solid #000000', textAlign: 'left', fontWeight: 900 }}>Blockage Details</th>
              </tr>
            </thead>
            <tbody>
              {roads.map((road, idx) => (
                <tr key={road.id} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                  <td style={{ padding: '5px 8px', textAlign: 'center', fontWeight: 800 }}>{idx + 1}</td>
                  <td style={{ padding: '5px 10px', fontWeight: 800 }}>{road.name}</td>
                  <td style={{ padding: '5px 10px', fontWeight: 600 }}>{road.highwayType || 'Primary Highway'}</td>
                  <td style={{ padding: '5px 10px', textAlign: 'center' }}>
                    <span style={{ background: road.status === 'blocked' ? '#ef4444' : '#86efac', color: road.status === 'blocked' ? '#ffffff' : '#000000', border: '1px solid #000', padding: '2px 7px', borderRadius: 4, fontWeight: 800, textTransform: 'uppercase' }}>
                      {road.status}
                    </span>
                  </td>
                  <td style={{ padding: '5px 10px', fontWeight: 600 }}>{road.blockageReason || 'Clear and operational for convoy transit'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Weather Forecast Table */}
        {activeTab === 'weather' && (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ background: '#bfdbfe', borderBottom: '2px solid #000000', color: '#000000', position: 'sticky', top: 0, zIndex: 10 }}>
                <th style={{ padding: '6px 10px', borderRight: '1px solid #000000', textAlign: 'left', fontWeight: 900 }}>Date / Day</th>
                <th style={{ padding: '6px 10px', borderRight: '1px solid #000000', textAlign: 'left', fontWeight: 900 }}>Condition</th>
                <th style={{ padding: '6px 10px', borderRight: '1px solid #000000', textAlign: 'right', fontWeight: 900 }}>Max Temp</th>
                <th style={{ padding: '6px 10px', borderRight: '1px solid #000000', textAlign: 'right', fontWeight: 900 }}>Min Temp</th>
                <th style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 900 }}>Precipitation</th>
              </tr>
            </thead>
            <tbody>
              {weather.map((w, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                  <td style={{ padding: '6px 10px', fontWeight: 800 }}>{w.dayLabel || w.date}</td>
                  <td style={{ padding: '6px 10px', fontWeight: 700, color: '#0284c7' }}>{w.condition}</td>
                  <td style={{ padding: '6px 10px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{w.maxTemp}°C</td>
                  <td style={{ padding: '6px 10px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{w.minTemp}°C</td>
                  <td style={{ padding: '6px 10px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 800, color: w.rainfall > 10 ? '#ef4444' : '#000000' }}>
                    {w.rainfall} mm
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
