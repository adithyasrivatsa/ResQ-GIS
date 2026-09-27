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
      <div className="panel__section" style={{ background: 'var(--nb-canvas-subtle)', padding: '14px 16px', borderBottom: '2.5px solid #000000' }}>
        <div className="panel__row panel__row--between" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                background: 'var(--nb-yellow)',
                border: '2px solid #000000',
                boxShadow: '2px 2px 0px #000000',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#000000',
              }}
            >
              <FileText size={18} strokeWidth={2.5} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 900, color: '#000000', textTransform: 'uppercase' }}>
                Operational Memo
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#525252' }}>
                District Relocation Brief &bull; NDMA
              </div>
            </div>
          </div>

          <button
            onClick={() => window.print()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'var(--nb-yellow)',
              color: '#000000',
              border: '2px solid #000000',
              boxShadow: '2px 2px 0px #000000',
              padding: '6px 12px',
              borderRadius: 8,
              fontSize: 11,
              fontWeight: 800,
              textTransform: 'uppercase',
              cursor: 'pointer',
              transition: 'all 0.1s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--nb-mint)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--nb-yellow)')}
            title="Print or save as PDF"
          >
            <Printer size={13} strokeWidth={2.5} />
            <span>Print PDF</span>
          </button>
        </div>
      </div>

      {/* Target District Selector */}
      <div className="panel__section" style={{ background: '#ffffff', padding: '12px 16px', borderBottom: '2px solid #000000' }}>
        <div className="panel__row panel__row--between" style={{ marginBottom: 0 }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: '#000000', textTransform: 'uppercase' }}>TARGET DISTRICT:</span>
          <div style={{ display: 'flex', background: '#ffffff', padding: 2, borderRadius: 8, border: '2px solid #000000', boxShadow: '2px 2px 0px #000000', gap: 2 }}>
            {(['Chamoli', 'Rudraprayag'] as const).map((dist) => (
              <button
                key={dist}
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  padding: '4px 14px',
                  border: selectedDistrict === dist ? '1.5px solid #000000' : '1.5px solid transparent',
                  background: selectedDistrict === dist ? 'var(--nb-mint)' : 'transparent',
                  color: '#000000',
                  boxShadow: selectedDistrict === dist ? '1px 1px 0px #000000' : 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  transition: 'all 0.1s ease',
                }}
                onClick={() => setSelectedDistrict(dist)}
              >
                {dist}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Executive Key Figures in Minimalist Cards */}
      <div className="panel__section" style={{ padding: '14px 16px', borderBottom: '2px solid #000000' }}>
        <div className="overview-stats">
          <div className="overview-stat">
            <AlertTriangle size={16} color="var(--nb-pink)" strokeWidth={2.5} />
            <div className="overview-stat__value" style={{ color: 'var(--nb-pink)' }}>
              {atRiskHabs.length} / {distHabs.length}
            </div>
            <div className="overview-stat__label">HIGH-RISK SECTORS</div>
          </div>

          <div className="overview-stat">
            <Users size={16} color="#000000" strokeWidth={2.5} />
            <div className="overview-stat__value">{exposedPop.toLocaleString()}</div>
            <div className="overview-stat__label">DISPLACED POP</div>
          </div>

          <div className="overview-stat">
            <Building size={16} color="#000000" strokeWidth={2.5} />
            <div className="overview-stat__value">{totalSafeCapacity.toLocaleString()}</div>
            <div className="overview-stat__label">SAFE CAPACITY</div>
          </div>
        </div>

        {/* Capacity Cushion Banner */}
        <div
          style={{
            marginTop: 12,
            padding: '12px 14px',
            background: capacitySurplus >= 0 ? 'var(--nb-mint-light)' : 'var(--nb-pink-light)',
            border: '2px solid #000000',
            boxShadow: '2px 2px 0px #000000',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 11,
            fontWeight: 800,
            color: '#000000',
          }}
        >
          <ShieldCheck size={20} color="#000000" strokeWidth={2.5} style={{ flexShrink: 0 }} />
          <div>
            {capacitySurplus >= 0
              ? `Surplus: +${capacitySurplus.toLocaleString()} safe bed reserve in designated safe zones.`
              : `Deficit of ${Math.abs(capacitySurplus).toLocaleString()} beds! Emergency staging required.`}
          </div>
        </div>
      </div>

      {/* Capacity Allocation Matrix Table */}
      <div className="panel__section" style={{ padding: '14px 16px', borderBottom: '2px solid #000000' }}>
        <div className="panel__title" style={{ marginBottom: 10 }}>
          Safe Haven Absorption Matrix
        </div>

        <div style={{ overflowX: 'auto', border: '2px solid #000000', boxShadow: '3px 3px 0px #000000', borderRadius: 8 }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: 11,
              background: '#ffffff',
            }}
          >
            <thead>
              <tr style={{ background: 'var(--nb-canvas-subtle)', color: '#000000', borderBottom: '2px solid #000000' }}>
                <th style={{ padding: '9px 10px', textAlign: 'left', fontWeight: 800, textTransform: 'uppercase' }}>HAVEN</th>
                <th style={{ padding: '9px 10px', textAlign: 'right', fontWeight: 800, textTransform: 'uppercase' }}>CAPACITY</th>
                <th style={{ padding: '9px 10px', textAlign: 'left', fontWeight: 800, textTransform: 'uppercase' }}>FEEDS</th>
                <th style={{ padding: '9px 10px', textAlign: 'center', fontWeight: 800, textTransform: 'uppercase' }}>LOAD</th>
              </tr>
            </thead>
            <tbody>
              {distSites.map((site) => {
                const feeds = distHabs.filter((h) => h.nearestRelocationSite === site.id);
                const assignedPop = feeds.reduce((sum, h) => sum + h.population, 0);
                const loadPct = Math.round((assignedPop / site.capacity) * 100);

                const loadBg = loadPct > 90 ? 'var(--nb-pink)' : loadPct > 60 ? 'var(--nb-orange)' : 'var(--nb-mint)';
                const loadColor = loadPct > 90 ? '#ffffff' : '#000000';

                return (
                  <tr key={site.id} style={{ borderBottom: '1.5px solid #000000' }}>
                    <td style={{ padding: '9px 10px', fontWeight: 800, color: '#000000' }}>
                      {site.name}
                    </td>
                    <td style={{ padding: '9px 10px', textAlign: 'right', fontWeight: 800, color: '#000000', fontFamily: 'var(--font-mono)' }}>
                      {site.capacity.toLocaleString()}
                    </td>
                    <td style={{ padding: '9px 10px', color: '#525252', fontWeight: 600 }}>
                      {feeds.length > 0 ? feeds.map((f) => f.name).join(', ') : 'Reserve standby'}
                    </td>
                    <td style={{ padding: '9px 10px', textAlign: 'center' }}>
                      <span
                        style={{
                          fontWeight: 800,
                          fontSize: 10,
                          padding: '2px 7px',
                          borderRadius: 6,
                          border: '1.5px solid #000000',
                          boxShadow: '1px 1px 0px #000000',
                          background: loadBg,
                          color: loadColor,
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
      <div className="panel__section" style={{ padding: '14px 16px' }}>
        <div className="panel__title" style={{ marginBottom: 10 }}>
          Phased Evacuation Protocol
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div
            style={{
              background: '#ffffff',
              padding: '12px 14px',
              border: '2px solid #000000',
              boxShadow: '3px 3px 0px #000000',
              borderRadius: 8,
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--nb-pink)', textTransform: 'uppercase' }}>
              PHASE 1 (0–24H IMMEDIATE)
            </div>
            <div style={{ fontSize: 11, color: '#000000', fontWeight: 600, marginTop: 4, lineHeight: 1.45 }}>
              Priority evacuation for Reni (380 pop) and Sunil/Marwari vulnerable sectors along designated NH-7 corridor to Pipalkoti.
            </div>
          </div>

          <div
            style={{
              background: '#ffffff',
              padding: '12px 14px',
              border: '2px solid #000000',
              boxShadow: '3px 3px 0px #000000',
              borderRadius: 8,
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--nb-orange)', textTransform: 'uppercase' }}>
              PHASE 2 (24–72H STAGED)
            </div>
            <div style={{ fontSize: 11, color: '#000000', fontWeight: 600, marginTop: 4, lineHeight: 1.45 }}>
              Phased bus convoy transport for Joshimath non-ambulatory families to Gauchar and Chamoli relief centers.
            </div>
          </div>

          <div
            style={{
              background: '#ffffff',
              padding: '12px 14px',
              border: '2px solid #000000',
              boxShadow: '3px 3px 0px #000000',
              borderRadius: 8,
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 900, color: '#0284c7', textTransform: 'uppercase' }}>
              PHASE 3 (MONITORING)
            </div>
            <div style={{ fontSize: 11, color: '#000000', fontWeight: 600, marginTop: 4, lineHeight: 1.45 }}>
              Maintain telemetry on Alaknanda discharge (CWC station) and landslide slip sensors.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
