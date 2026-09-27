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
      <div className="panel__section" style={{ background: 'var(--bg-subtle)' }}>
        <div className="panel__row panel__row--between">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                background: 'var(--accent-indigo-subtle)',
                border: '1px solid var(--accent-indigo)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-indigo)',
              }}
            >
              <FileText size={18} strokeWidth={2} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                Operational Memo
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                District Relocation Brief &bull; NDMA
              </div>
            </div>
          </div>

          <button
            onClick={() => window.print()}
            className="btn-action"
            title="Print or save as PDF"
          >
            <Printer size={13} strokeWidth={2} />
            <span>Print PDF</span>
          </button>
        </div>
      </div>

      {/* Target District Selector */}
      <div className="panel__section" style={{ background: 'var(--bg-surface)' }}>
        <div className="panel__row panel__row--between">
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Target District
          </span>
          <div style={{ display: 'flex', background: 'var(--bg-subtle)', padding: 2, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', gap: 2 }}>
            {(['Chamoli', 'Rudraprayag'] as const).map((dist) => (
              <button
                key={dist}
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  padding: '4px 12px',
                  border: selectedDistrict === dist ? '1px solid var(--accent-blue)' : '1px solid transparent',
                  background: selectedDistrict === dist ? 'var(--accent-blue)' : 'transparent',
                  color: selectedDistrict === dist ? '#ffffff' : 'var(--text-secondary)',
                  borderRadius: 'var(--radius-xs)',
                  cursor: 'pointer',
                  transition: 'all 0.12s ease',
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
      <div className="panel__section">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '10px 8px', textAlign: 'center' }}>
            <AlertTriangle size={15} color="var(--accent-rose)" strokeWidth={2} style={{ margin: '0 auto 4px' }} />
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--accent-rose)', fontFamily: 'var(--font-mono)' }}>
              {atRiskHabs.length} / {distHabs.length}
            </div>
            <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: 2 }}>
              High-Risk
            </div>
          </div>

          <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '10px 8px', textAlign: 'center' }}>
            <Users size={15} color="var(--text-secondary)" strokeWidth={2} style={{ margin: '0 auto 4px' }} />
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
              {exposedPop.toLocaleString()}
            </div>
            <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: 2 }}>
              Displaced Pop
            </div>
          </div>

          <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '10px 8px', textAlign: 'center' }}>
            <Building size={15} color="var(--accent-emerald)" strokeWidth={2} style={{ margin: '0 auto 4px' }} />
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--accent-emerald)', fontFamily: 'var(--font-mono)' }}>
              {totalSafeCapacity.toLocaleString()}
            </div>
            <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: 2 }}>
              Safe Capacity
            </div>
          </div>
        </div>

        {/* Capacity Cushion Banner */}
        <div
          style={{
            marginTop: 10,
            padding: '10px 12px',
            background: capacitySurplus >= 0 ? 'var(--accent-emerald-subtle)' : 'var(--accent-rose-subtle)',
            border: capacitySurplus >= 0 ? '1px solid var(--accent-emerald)' : '1px solid var(--accent-rose)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 11,
            fontWeight: 600,
            color: capacitySurplus >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)',
          }}
        >
          <ShieldCheck size={18} strokeWidth={2} style={{ flexShrink: 0 }} />
          <div>
            {capacitySurplus >= 0
              ? `Surplus: +${capacitySurplus.toLocaleString()} safe bed reserve in designated safe zones.`
              : `Deficit of ${Math.abs(capacitySurplus).toLocaleString()} beds! Emergency staging required.`}
          </div>
        </div>
      </div>

      {/* Capacity Allocation Matrix Table */}
      <div className="panel__section">
        <div className="panel__title" style={{ marginBottom: 10 }}>
          Safe Haven Absorption Matrix
        </div>

        <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: 11,
              background: 'var(--bg-surface)',
            }}
          >
            <thead>
              <tr style={{ background: 'var(--bg-subtle)', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 700, textTransform: 'uppercase', fontSize: 10 }}>HAVEN</th>
                <th style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, textTransform: 'uppercase', fontSize: 10 }}>CAPACITY</th>
                <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 700, textTransform: 'uppercase', fontSize: 10 }}>FEEDS</th>
                <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 700, textTransform: 'uppercase', fontSize: 10 }}>LOAD</th>
              </tr>
            </thead>
            <tbody>
              {distSites.map((site) => {
                const feeds = distHabs.filter((h) => h.nearestRelocationSite === site.id);
                const assignedPop = feeds.reduce((sum, h) => sum + h.population, 0);
                const loadPct = Math.round((assignedPop / site.capacity) * 100);

                const loadBg = loadPct > 90 ? 'var(--accent-rose-subtle)' : loadPct > 60 ? 'var(--accent-amber-subtle)' : 'var(--accent-emerald-subtle)';
                const loadColor = loadPct > 90 ? 'var(--accent-rose)' : loadPct > 60 ? 'var(--accent-amber)' : 'var(--accent-emerald)';

                return (
                  <tr key={site.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '8px 10px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {site.name}
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                      {site.capacity.toLocaleString()}
                    </td>
                    <td style={{ padding: '8px 10px', color: 'var(--text-muted)', fontSize: 10 }}>
                      {feeds.length > 0 ? feeds.map((f) => f.name).join(', ') : 'Reserve standby'}
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: 10,
                          padding: '2px 7px',
                          borderRadius: 'var(--radius-pill)',
                          border: '1px solid var(--border-color)',
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
      <div className="panel__section" style={{ overflowY: 'auto' }}>
        <div className="panel__title" style={{ marginBottom: 10 }}>
          Phased Evacuation Protocol &bull; {selectedDistrict}
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
              Phase 1 (0–24h Immediate Priority)
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.45 }}>
              {atRiskHabs.slice(0, 2).length > 0
                ? `Immediate priority evacuation for ${atRiskHabs.slice(0, 2).map((h) => `${h.name} (${h.population.toLocaleString()} pop, risk: ${(h.riskScore * 100).toFixed(0)}%)`).join(' and ')} via designated corridors to ${distSites[0]?.name || 'District Staging Area'}.`
                : `No critical habitations requiring immediate 0–24h evacuation in ${selectedDistrict}. Pre-emptive surveillance active.`}
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
              Phase 2 (24–72h Staged Mobilization)
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.45 }}>
              {atRiskHabs.slice(2).length > 0
                ? `Staged convoy transport for ${atRiskHabs.slice(2).map((h) => `${h.name} (${h.population.toLocaleString()} pop)`).join(', ')} to ${distSites.slice(1).map((s) => s.name).join(' & ') || 'Safe Relocation Hubs'}.`
                : distHabs.length > 0
                ? `Secondary logistical transport for vulnerable households across ${selectedDistrict} to ${distSites.slice(1).map((s) => s.name).join(' & ') || 'Safe Relocation Hubs'}.`
                : `Standby civil defense evacuation transport for ${selectedDistrict} sector.`}
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
              Phase 3 (Continuous Telemetry & Monitoring)
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.45 }}>
              Maintain telemetry on river discharge gauges, rainfall thresholds, and slope stability sensors across {selectedDistrict} sector.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
