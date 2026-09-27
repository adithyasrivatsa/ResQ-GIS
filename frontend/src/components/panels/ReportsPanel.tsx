import { useState, useEffect } from 'react';
import { FileText, Printer, ShieldCheck, AlertTriangle, Users, Building } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export default function ReportsPanel() {
  const { loadDistrictReport, habitations, relocationSites } = useAppStore();
  const [selectedDistrict, setSelectedDistrict] = useState<'Chamoli' | 'Rudraprayag'>('Chamoli');

  useEffect(() => {
    loadDistrictReport(selectedDistrict);
  }, [selectedDistrict]); // eslint-disable-line react-hooks/exhaustive-deps

  const distHabs = habitations.filter((h) => h.district.toLowerCase() === selectedDistrict.toLowerCase());
  const distSites = relocationSites.filter((s) => s.district.toLowerCase() === selectedDistrict.toLowerCase());
  const atRiskHabs = distHabs.filter((h) => h.riskScore >= 0.6);
  const exposedPop = atRiskHabs.reduce((sum, h) => sum + h.population, 0);
  const totalSafeCapacity = distSites.reduce((sum, s) => sum + s.capacity, 0);
  const capacitySurplus = totalSafeCapacity - exposedPop;

  return (
    <div className="panel report-panel">
      {/* Top Banner */}
      <div className="panel__section" style={{ background: '#fdfbf7', paddingBottom: 10 }}>
        <div className="panel__row panel__row--between">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={18} color="var(--retro-purple)" />
            <div>
              <div style={{ fontFamily: 'Silkscreen', fontSize: 13, fontWeight: 700 }}>
                OPERATIONAL MEMO
              </div>
              <div style={{ fontFamily: 'Space Mono', fontSize: 9, color: '#64748b' }}>
                DISTRICT RELOCATION BRIEF // NDMA
              </div>
            </div>
          </div>

          <button
            className="retro-btn retro-btn--orange"
            style={{ fontSize: 9, padding: '4px 8px' }}
            onClick={() => window.print()}
            title="Print or save as PDF"
          >
            <Printer size={12} />
            <span>PRINT / PDF</span>
          </button>
        </div>
      </div>

      {/* Target District Selector */}
      <div className="panel__section" style={{ background: '#f1f5f9', padding: '8px 14px' }}>
        <div className="panel__row panel__row--between">
          <span style={{ fontFamily: 'Silkscreen', fontSize: 9, color: '#475569' }}>DISTRICT:</span>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['Chamoli', 'Rudraprayag'] as const).map((dist) => (
              <button
                key={dist}
                className={`panel__filter-btn ${selectedDistrict === dist ? 'panel__filter-btn--active' : ''}`}
                onClick={() => setSelectedDistrict(dist)}
              >
                {dist.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Executive Key Figures in Retro Cards */}
      <div className="panel__section">
        <div className="overview-stats">
          <div className="overview-stat" style={{ borderLeft: '4px solid var(--retro-pink)' }}>
            <AlertTriangle size={15} color="var(--retro-pink)" />
            <div className="overview-stat__value" style={{ color: 'var(--retro-pink)' }}>
              {atRiskHabs.length} / {distHabs.length}
            </div>
            <div className="overview-stat__label">HIGH-RISK SECTORS</div>
          </div>

          <div className="overview-stat" style={{ borderLeft: '4px solid var(--retro-orange)' }}>
            <Users size={15} color="var(--retro-orange-dark)" />
            <div className="overview-stat__value">{exposedPop.toLocaleString()}</div>
            <div className="overview-stat__label">DISPLACED POP</div>
          </div>

          <div className="overview-stat" style={{ borderLeft: '4px solid var(--retro-purple)' }}>
            <Building size={15} color="var(--retro-purple)" />
            <div className="overview-stat__value">{totalSafeCapacity.toLocaleString()}</div>
            <div className="overview-stat__label">SAFE CAPACITY</div>
          </div>
        </div>

        {/* Capacity Cushion Banner */}
        <div
          style={{
            marginTop: 10,
            padding: '8px 12px',
            background: capacitySurplus >= 0 ? '#f0fdf4' : '#fef2f2',
            border: `2px solid ${capacitySurplus >= 0 ? '#16a34a' : '#dc2626'}`,
            boxShadow: '2px 2px 0px #000',
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontFamily: 'Space Mono',
            fontSize: 10,
            fontWeight: 700,
          }}
        >
          <ShieldCheck size={16} color={capacitySurplus >= 0 ? '#16a34a' : '#dc2626'} />
          <div>
            {capacitySurplus >= 0
              ? `SURPLUS: +${capacitySurplus.toLocaleString()} safe bed reserve in designated safe zones.`
              : `DEFICIT of ${Math.abs(capacitySurplus).toLocaleString()} beds! Emergency inter-district staging required.`}
          </div>
        </div>
      </div>

      {/* Capacity Allocation Matrix Table */}
      <div className="panel__section">
        <div className="panel__section-title">
          <span>SAFE HAVEN ABSORPTION MATRIX</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: 10,
              fontFamily: 'Space Mono',
              border: '2px solid #000',
              borderRadius: 6,
            }}
          >
            <thead>
              <tr style={{ background: 'var(--retro-purple)', color: '#ffffff' }}>
                <th style={{ padding: '6px 8px', border: '1px solid #000', textAlign: 'left' }}>HAVEN</th>
                <th style={{ padding: '6px 8px', border: '1px solid #000', textAlign: 'right' }}>CAPACITY</th>
                <th style={{ padding: '6px 8px', border: '1px solid #000', textAlign: 'left' }}>SOURCE</th>
                <th style={{ padding: '6px 8px', border: '1px solid #000', textAlign: 'center' }}>LOAD %</th>
              </tr>
            </thead>
            <tbody>
              {distSites.map((site) => {
                const feeds = distHabs.filter((h) => h.nearestRelocationSite === site.id);
                const assignedPop = feeds.reduce((sum, h) => sum + h.population, 0);
                const loadPct = Math.round((assignedPop / site.capacity) * 100);

                return (
                  <tr key={site.id} style={{ borderBottom: '1px solid #cbd5e1', background: '#ffffff' }}>
                    <td style={{ padding: '6px 8px', fontWeight: 'bold', color: 'var(--retro-purple)' }}>
                      {site.name}
                    </td>
                    <td style={{ padding: '6px 8px', textAlign: 'right' }}>{site.capacity.toLocaleString()}</td>
                    <td style={{ padding: '6px 8px', color: '#475569' }}>
                      {feeds.length > 0 ? feeds.map((f) => f.name).join(', ') : 'Reserve standby'}
                    </td>
                    <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                      <span
                        style={{
                          fontWeight: 'bold',
                          padding: '1px 5px',
                          borderRadius: 3,
                          border: '1px solid #000',
                          background: loadPct > 90 ? 'var(--retro-pink-light)' : loadPct > 60 ? 'var(--retro-orange-light)' : 'var(--retro-green-light)',
                          color: '#000',
                        }}
                      >
                        {loadPct}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recommended Staged Action Plan */}
      <div className="panel__section">
        <div className="panel__section-title">
          <span>PHASED EVACUATION PROTOCOL</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div
            style={{
              background: '#ffffff',
              padding: '8px 10px',
              border: '2px solid #000',
              borderLeft: '5px solid var(--retro-pink)',
              boxShadow: '2px 2px 0px #000',
              borderRadius: 6,
            }}
          >
            <div style={{ fontFamily: 'Silkscreen', fontSize: 10, color: 'var(--retro-pink)' }}>
              PHASE 1 (0–24H IMMEDIATE):
            </div>
            <div style={{ fontFamily: 'Space Mono', fontSize: 9, color: '#334155', marginTop: 2 }}>
              Priority evacuation for Reni (380 pop) and Sunil/Marwari vulnerable sectors along designated NH-7 corridor to Pipalkoti.
            </div>
          </div>

          <div
            style={{
              background: '#ffffff',
              padding: '8px 10px',
              border: '2px solid #000',
              borderLeft: '5px solid var(--retro-orange)',
              boxShadow: '2px 2px 0px #000',
              borderRadius: 6,
            }}
          >
            <div style={{ fontFamily: 'Silkscreen', fontSize: 10, color: 'var(--retro-orange-dark)' }}>
              PHASE 2 (24–72H STAGED):
            </div>
            <div style={{ fontFamily: 'Space Mono', fontSize: 9, color: '#334155', marginTop: 2 }}>
              Phased bus convoy transport for Joshimath non-ambulatory families to Gauchar and Chamoli relief centers.
            </div>
          </div>

          <div
            style={{
              background: '#ffffff',
              padding: '8px 10px',
              border: '2px solid #000',
              borderLeft: '5px solid var(--retro-purple)',
              boxShadow: '2px 2px 0px #000',
              borderRadius: 6,
            }}
          >
            <div style={{ fontFamily: 'Silkscreen', fontSize: 10, color: 'var(--retro-purple)' }}>
              PHASE 3 (MONITORING):
            </div>
            <div style={{ fontFamily: 'Space Mono', fontSize: 9, color: '#334155', marginTop: 2 }}>
              Maintain telemetry on Alaknanda discharge (CWC station) and landslide slip sensors.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
