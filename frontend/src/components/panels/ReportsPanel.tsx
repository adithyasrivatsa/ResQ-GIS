import { useState, useMemo } from 'react';
import {
  FileText,
  Printer,
  AlertTriangle,
  Users,
  Building,
  Bus,
  Ambulance,
  Download,
  CheckCircle2,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

const STATE_DISTRICT_MAP: Record<string, string[]> = {
  Uttarakhand: ['Chamoli', 'Rudraprayag'],
  'Himachal Pradesh': ['Kullu', 'Mandi'],
  Kerala: ['Wayanad', 'Idukki', 'Alappuzha'],
  'Andhra Pradesh': ['Dr. B.R. Ambedkar Konaseema', 'Visakhapatnam'],
  Assam: ['Majuli', 'Cachar'],
  Sikkim: ['Mangan', 'Pakyong'],
  Odisha: ['Jagatsinghpur', 'Puri'],
  'Jammu & Kashmir': ['Anantnag'],
  Meghalaya: ['East Khasi Hills'],
  'Manipur & Nagaland': ['Noney', 'Kohima'],
};

export default function ReportsPanel() {
  const { habitations, relocationSites } = useAppStore();

  const [selectedState, setSelectedState] = useState<string>('Uttarakhand');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('Chamoli');

  // When state changes, auto-select first district in that state
  const handleStateChange = (st: string) => {
    setSelectedState(st);
    const districts = STATE_DISTRICT_MAP[st] || [];
    if (districts.length > 0) {
      setSelectedDistrict(districts[0]);
    }
  };

  const distHabs = useMemo(() => {
    return habitations.filter((h) => {
      const matchDist = h.district.toLowerCase() === selectedDistrict.toLowerCase();
      const matchState = !selectedState || h.state?.toLowerCase().includes(selectedState.toLowerCase().split(' ')[0]);
      return matchDist || matchState;
    });
  }, [habitations, selectedDistrict, selectedState]);

  const distSites = useMemo(() => {
    return relocationSites.filter((s) => {
      const matchDist = s.district.toLowerCase() === selectedDistrict.toLowerCase();
      const matchState = !selectedState || s.state?.toLowerCase().includes(selectedState.toLowerCase().split(' ')[0]);
      return matchDist || matchState;
    });
  }, [relocationSites, selectedDistrict, selectedState]);

  const atRiskHabs = distHabs.filter((h) => h.riskScore >= 0.6);
  const exposedPop = atRiskHabs.reduce((sum, h) => sum + h.population, 0);
  const totalSafeCapacity = distSites.reduce((sum, s) => sum + s.capacity, 0);
  const capacitySurplus = totalSafeCapacity - exposedPop;

  // Logistics calculations
  const busesNeeded = Math.ceil(exposedPop / 50);
  const ambulancesNeeded = Math.max(2, Math.ceil(exposedPop / 400));
  const rationsTonnes = ((exposedPop * 0.45 * 14) / 1000).toFixed(1); // 14-day food requirement

  const handleExportCSV = () => {
    const csvHeader = 'Settlement,District,State,Population,RiskScore,PrimaryHazard,AssignedSafeHaven,DistanceKm,Corridor';
    const csvRows = distHabs.map((h) => {
      const haven = distSites.find((s) => s.id === h.nearestRelocationSite) || distSites[0];
      const primaryHaz = h.hazardExposure[0]?.type || 'general';
      return `"${h.name}","${h.district}","${h.state || ''}",${h.population},${h.riskScore.toFixed(2)},"${primaryHaz}","${haven?.name || 'District Safe Enclave'}",${haven?.distanceFromAffected || 10},"${haven?.lifelineCorridor || 'Arterial Highway'}"`;
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + [csvHeader].concat(csvRows).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `resq_gis_relocation_memo_${selectedDistrict.toLowerCase().replace(/[^a-z0-9]/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="panel report-panel">
      {/* Top Banner */}
      <div className="panel__section" style={{ background: 'var(--bg-subtle)' }}>
        <div className="panel__row panel__row--between">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                background: 'var(--accent-indigo-subtle)',
                border: '1.5px solid var(--accent-indigo)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-indigo)',
              }}
            >
              <FileText size={19} strokeWidth={2.5} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>
                National Relocation Operations Memo
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                NDMA &bull; Inter-State Disaster Relocation & Evacuation Protocol
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={handleExportCSV}
              className="btn-action"
              title="Export Full Relocation Memo as CSV"
              style={{ padding: '5px 8px', fontSize: 11 }}
            >
              <Download size={13} strokeWidth={2} />
              <span>CSV</span>
            </button>
            <button
              onClick={() => window.print()}
              className="btn-action"
              title="Print or Save Official Briefing as PDF"
              style={{ padding: '5px 10px', fontSize: 11, background: 'var(--accent-blue)', color: '#ffffff', border: 'none' }}
            >
              <Printer size={13} strokeWidth={2} />
              <span>Print PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Target Geography Selectors (10 States) */}
      <div className="panel__section" style={{ background: 'var(--bg-surface)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', width: 60 }}>
              State
            </span>
            <select
              value={selectedState}
              onChange={(e) => handleStateChange(e.target.value)}
              style={{
                flex: 1,
                padding: '5px 8px',
                fontFamily: 'var(--font-sans)',
                fontSize: 11,
                fontWeight: 700,
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-subtle)',
                color: 'var(--text-primary)',
                outline: 'none',
              }}
            >
              {Object.keys(STATE_DISTRICT_MAP).map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', width: 60 }}>
              District
            </span>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              style={{
                flex: 1,
                padding: '5px 8px',
                fontFamily: 'var(--font-sans)',
                fontSize: 11,
                fontWeight: 600,
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-subtle)',
                color: 'var(--text-primary)',
                outline: 'none',
              }}
            >
              {(STATE_DISTRICT_MAP[selectedState] || []).map((dst) => (
                <option key={dst} value={dst}>
                  {dst} Sector
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Executive Relocation Balance Sheet */}
      <div className="panel__section" style={{ background: 'var(--bg-subtle)' }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 8 }}>
          Sector Relocation Balance Sheet
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          <div style={{ background: 'var(--bg-surface)', padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-muted)' }}>
              <Users size={14} color="var(--accent-rose)" />
              <span>Evacuee Influx Demand</span>
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent-rose)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>
              {exposedPop.toLocaleString()}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
              From {atRiskHabs.length} high/critical settlements
            </div>
          </div>

          <div style={{ background: 'var(--bg-surface)', padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-muted)' }}>
              <Building size={14} color="var(--accent-emerald)" />
              <span>Safe Haven Capacity</span>
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent-emerald)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>
              {totalSafeCapacity.toLocaleString()}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
              Across {distSites.length} institutional safe refuges
            </div>
          </div>
        </div>

        {/* Net Capacity Surplus Banner */}
        <div
          style={{
            marginTop: 8,
            padding: '8px 12px',
            borderRadius: 'var(--radius-sm)',
            background: capacitySurplus >= 0 ? 'var(--accent-emerald-subtle)' : 'var(--accent-rose-subtle)',
            border: `1px solid ${capacitySurplus >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {capacitySurplus >= 0 ? (
              <CheckCircle2 size={16} color="var(--accent-emerald)" />
            ) : (
              <AlertTriangle size={16} color="var(--accent-rose)" />
            )}
            <span style={{ fontSize: 11, fontWeight: 700, color: capacitySurplus >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
              {capacitySurplus >= 0 ? 'Adequate Carrying Capacity' : 'CRITICAL SHELTER DEFICIT'}
            </span>
          </div>
          <span style={{ fontSize: 11, fontWeight: 800, fontFamily: 'var(--font-mono)', color: capacitySurplus >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
            {capacitySurplus >= 0 ? `+${capacitySurplus.toLocaleString()} Beds Surplus` : `${capacitySurplus.toLocaleString()} Deficit`}
          </span>
        </div>
      </div>

      {/* Evacuation Fleet & Logistics Requirements */}
      <div className="panel__section" style={{ background: 'var(--bg-surface)' }}>
        <div className="panel__title" style={{ marginBottom: 8 }}>
          Evacuation Logistics & Transport Requirements
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
          <div style={{ background: 'var(--bg-subtle)', padding: '8px', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
            <Bus size={15} color="var(--accent-blue)" style={{ margin: '0 auto 4px' }} />
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
              {busesNeeded}
            </div>
            <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Convoy Buses</div>
          </div>

          <div style={{ background: 'var(--bg-subtle)', padding: '8px', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
            <Ambulance size={15} color="var(--accent-rose)" style={{ margin: '0 auto 4px' }} />
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
              {ambulancesNeeded}
            </div>
            <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Ambulances</div>
          </div>

          <div style={{ background: 'var(--bg-subtle)', padding: '8px', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
            <FileText size={15} color="var(--accent-amber)" style={{ margin: '0 auto 4px' }} />
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
              {rationsTonnes} T
            </div>
            <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>14-Day Rations</div>
          </div>
        </div>
      </div>

      {/* Matched Relocation Allocation Matrix */}
      <div className="panel__section">
        <div className="panel__title" style={{ marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>Settlement Relocation Allocation Matrix</span>
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{distHabs.length} settlements evaluated</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 700 }}>Settlement</th>
                <th style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 700 }}>Pop</th>
                <th style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 700 }}>Risk</th>
                <th style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 700 }}>Designated Safe Refuge</th>
                <th style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 700 }}>Dist</th>
              </tr>
            </thead>
            <tbody>
              {distHabs.map((h, i) => {
                const haven = distSites.find((s) => s.id === h.nearestRelocationSite) || distSites[0];
                return (
                  <tr
                    key={h.id}
                    style={{
                      borderBottom: '1px solid var(--border-color)',
                      background: i % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-subtle)',
                    }}
                  >
                    <td style={{ padding: '6px 8px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {h.name}
                    </td>
                    <td style={{ padding: '6px 8px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                      {h.population.toLocaleString()}
                    </td>
                    <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                      <span
                        className={`risk-badge risk-badge--sm ${h.riskScore >= 0.75 ? 'risk--critical' : h.riskScore >= 0.6 ? 'risk--high' : 'risk--moderate'}`}
                      >
                        {(h.riskScore * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td style={{ padding: '6px 8px', color: 'var(--accent-blue)', fontWeight: 600 }}>
                      {haven?.name || 'District Safe Haven'}
                    </td>
                    <td style={{ padding: '6px 8px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                      {haven?.distanceFromAffected || 10} km
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recommended Staged Action Plan */}
      <div className="panel__section" style={{ overflowY: 'auto' }}>
        <div className="panel__title" style={{ marginBottom: 10 }}>
          Phased Evacuation Directives &bull; {selectedDistrict} ({selectedState})
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div
            style={{
              background: 'var(--bg-subtle)',
              padding: '10px 12px',
              border: '1px solid var(--border-color)',
              borderLeft: '3px solid var(--accent-rose)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent-rose)', textTransform: 'uppercase' }}>
              Phase 1 (0–24h Immediate Zero-Hour Evacuation)
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.45 }}>
              {atRiskHabs.slice(0, 2).length > 0
                ? `Immediate zero-hour evacuation of critical settlements ${atRiskHabs.slice(0, 2).map((h) => `${h.name} (${h.population.toLocaleString()} evacuees, ${h.hazardExposure[0]?.type || 'hazard'} threat: ${(h.riskScore * 100).toFixed(0)}%)`).join(' and ')} to ${distSites[0]?.name || 'District Staging Area'} via designated lifeline corridor ${distSites[0]?.lifelineCorridor || 'State Highway'}.`
                : `No critical 0–24h zero-hour evacuations mandated in ${selectedDistrict}. Pre-emptive flood and landslide alert warnings broadcasted.`}
            </div>
          </div>

          <div
            style={{
              background: 'var(--bg-subtle)',
              padding: '10px 12px',
              border: '1px solid var(--border-color)',
              borderLeft: '3px solid var(--accent-amber)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent-amber)', textTransform: 'uppercase' }}>
              Phase 2 (24–72h Staged Mobilization & Logistics)
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.45 }}>
              {atRiskHabs.slice(2).length > 0
                ? `Staged bus convoy mobilization (${busesNeeded} buses) for secondary vulnerable settlements ${atRiskHabs.slice(2).map((h) => `${h.name} (${h.population.toLocaleString()} pop)`).join(', ')} to ${distSites.slice(1).map((s) => s.name).join(' & ') || 'Safe Relocation Hubs'}.`
                : `Staged logistics support: deploy ${ambulancesNeeded} dedicated ambulances and pre-position ${rationsTonnes} MT dry rations at designated safe havens across ${selectedDistrict}.`}
            </div>
          </div>

          <div
            style={{
              background: 'var(--bg-subtle)',
              padding: '10px 12px',
              border: '1px solid var(--border-color)',
              borderLeft: '3px solid var(--accent-blue)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent-blue)', textTransform: 'uppercase' }}>
              Phase 3 (Continuous Telemetry & Inundation Monitoring)
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.45 }}>
              Maintain 24/7 automated telemetry monitoring on river gauging telemeters, slope creep sensors, and IMD/SACHET radar alerts across {selectedDistrict}, {selectedState}. Keep heavy road-clearing machinery on 15-minute standby.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
