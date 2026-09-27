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
      <div className="panel__section" style={{ background: '#f8fafc', padding: '14px 16px', borderBottom: '1px solid #e2e8f0' }}>
        <div className="panel__row panel__row--between" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 32,
                height: 32,
                background: '#f1f5f9',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#0f172a',
              }}
            >
              <FileText size={16} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                Operational Memo
              </div>
              <div style={{ fontSize: 11, color: '#64748b' }}>
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
              background: '#0f172a',
              color: '#ffffff',
              border: 'none',
              padding: '6px 12px',
              borderRadius: 8,
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
              transition: 'all 0.15s ease',
            }}
            title="Print or save as PDF"
          >
            <Printer size={13} />
            <span>Print PDF</span>
          </button>
        </div>
      </div>

      {/* Target District Selector */}
      <div className="panel__section" style={{ background: '#ffffff', padding: '10px 16px', borderBottom: '1px solid #e2e8f0' }}>
        <div className="panel__row panel__row--between" style={{ marginBottom: 0 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#475569' }}>TARGET DISTRICT:</span>
          <div style={{ display: 'flex', background: '#f1f5f9', padding: 2, borderRadius: 8, border: '1px solid #e2e8f0', gap: 2 }}>
            {(['Chamoli', 'Rudraprayag'] as const).map((dist) => (
              <button
                key={dist}
                style={{
                  fontSize: 11,
                  fontWeight: selectedDistrict === dist ? 600 : 500,
                  padding: '3px 12px',
                  border: 'none',
                  background: selectedDistrict === dist ? '#ffffff' : 'transparent',
                  color: selectedDistrict === dist ? '#0f172a' : '#64748b',
                  boxShadow: selectedDistrict === dist ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
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
      <div className="panel__section" style={{ padding: '12px 16px' }}>
        <div className="overview-stats">
          <div className="overview-stat">
            <AlertTriangle size={15} color="#ef4444" />
            <div className="overview-stat__value" style={{ color: '#ef4444' }}>
              {atRiskHabs.length} / {distHabs.length}
            </div>
            <div className="overview-stat__label">HIGH-RISK SECTORS</div>
          </div>

          <div className="overview-stat">
            <Users size={15} color="#0284c7" />
            <div className="overview-stat__value">{exposedPop.toLocaleString()}</div>
            <div className="overview-stat__label">DISPLACED POP</div>
          </div>

          <div className="overview-stat">
            <Building size={15} color="#0f172a" />
            <div className="overview-stat__value">{totalSafeCapacity.toLocaleString()}</div>
            <div className="overview-stat__label">SAFE CAPACITY</div>
          </div>
        </div>

        {/* Capacity Cushion Banner */}
        <div
          style={{
            marginTop: 10,
            padding: '10px 12px',
            background: capacitySurplus >= 0 ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${capacitySurplus >= 0 ? '#bbf7d0' : '#fecaca'}`,
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 11,
            fontWeight: 500,
            color: capacitySurplus >= 0 ? '#15803d' : '#b91c1c',
          }}
        >
          <ShieldCheck size={18} color={capacitySurplus >= 0 ? '#16a34a' : '#dc2626'} style={{ flexShrink: 0 }} />
          <div>
            {capacitySurplus >= 0
              ? `Surplus: +${capacitySurplus.toLocaleString()} safe bed reserve in designated safe zones.`
              : `Deficit of ${Math.abs(capacitySurplus).toLocaleString()} beds! Emergency staging required.`}
          </div>
        </div>
      </div>

      {/* Capacity Allocation Matrix Table */}
      <div className="panel__section" style={{ padding: '12px 16px' }}>
        <div className="panel__title" style={{ marginBottom: 10 }}>
          Safe Haven Absorption Matrix
        </div>

        <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: 8 }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: 11,
              background: '#ffffff',
            }}
          >
            <thead>
              <tr style={{ background: '#f8fafc', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600 }}>HAVEN</th>
                <th style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600 }}>CAPACITY</th>
                <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600 }}>FEEDS</th>
                <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 600 }}>LOAD</th>
              </tr>
            </thead>
            <tbody>
              {distSites.map((site) => {
                const feeds = distHabs.filter((h) => h.nearestRelocationSite === site.id);
                const assignedPop = feeds.reduce((sum, h) => sum + h.population, 0);
                const loadPct = Math.round((assignedPop / site.capacity) * 100);

                const loadBg = loadPct > 90 ? '#fef2f2' : loadPct > 60 ? '#fffbeb' : '#f0fdf4';
                const loadColor = loadPct > 90 ? '#b91c1c' : loadPct > 60 ? '#b45309' : '#15803d';
                const loadBorder = loadPct > 90 ? '#fecaca' : loadPct > 60 ? '#fde68a' : '#bbf7d0';

                return (
                  <tr key={site.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '8px 10px', fontWeight: 600, color: '#0f172a' }}>
                      {site.name}
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', color: '#475569' }}>
                      {site.capacity.toLocaleString()}
                    </td>
                    <td style={{ padding: '8px 10px', color: '#64748b' }}>
                      {feeds.length > 0 ? feeds.map((f) => f.name).join(', ') : 'Reserve standby'}
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                      <span
                        style={{
                          fontWeight: 600,
                          fontSize: 10,
                          padding: '2px 6px',
                          borderRadius: 6,
                          border: `1px solid ${loadBorder}`,
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
      <div className="panel__section" style={{ padding: '12px 16px' }}>
        <div className="panel__title" style={{ marginBottom: 10 }}>
          Phased Evacuation Protocol
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div
            style={{
              background: '#ffffff',
              padding: '10px 12px',
              border: '1px solid #e2e8f0',
              borderLeft: '4px solid #ef4444',
              borderRadius: 8,
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: '#b91c1c' }}>
              PHASE 1 (0–24H IMMEDIATE)
            </div>
            <div style={{ fontSize: 11, color: '#334155', marginTop: 3, lineHeight: 1.4 }}>
              Priority evacuation for Reni (380 pop) and Sunil/Marwari vulnerable sectors along designated NH-7 corridor to Pipalkoti.
            </div>
          </div>

          <div
            style={{
              background: '#ffffff',
              padding: '10px 12px',
              border: '1px solid #e2e8f0',
              borderLeft: '4px solid #f59e0b',
              borderRadius: 8,
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: '#b45309' }}>
              PHASE 2 (24–72H STAGED)
            </div>
            <div style={{ fontSize: 11, color: '#334155', marginTop: 3, lineHeight: 1.4 }}>
              Phased bus convoy transport for Joshimath non-ambulatory families to Gauchar and Chamoli relief centers.
            </div>
          </div>

          <div
            style={{
              background: '#ffffff',
              padding: '10px 12px',
              border: '1px solid #e2e8f0',
              borderLeft: '4px solid #0284c7',
              borderRadius: 8,
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: '#0369a1' }}>
              PHASE 3 (MONITORING)
            </div>
            <div style={{ fontSize: 11, color: '#334155', marginTop: 3, lineHeight: 1.4 }}>
              Maintain telemetry on Alaknanda discharge (CWC station) and landslide slip sensors.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
