import { useState, useMemo } from 'react';
import {
  Check,
  X as XIcon,
  Users,
  ShieldCheck,
  ArrowLeft,
  Building,
  Navigation,
  Zap,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { flyToSite } from '../../cesium/camera';

const SUIT_CLASS: Record<string, string> = {
  HIGH: 'risk--low',
  CRITICAL: 'risk--low',
  MODERATE: 'risk--moderate',
  LOW: 'risk--high',
};

interface Props {
  showList?: boolean;
}

export default function RelocationPanel(_props: Props = {}) {
  const { relocationSites, habitations, getSelectedSite, selectedSiteId, selectSite, selectHabitation } = useAppStore();
  const site = getSelectedSite();
  const [selectedStateFilter, setSelectedStateFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Extract unique states from relocation sites
  const availableStates = useMemo(() => {
    const set = new Set<string>();
    relocationSites.forEach((s) => {
      if (s.state) set.add(s.state);
    });
    return Array.from(set).sort();
  }, [relocationSites]);

  // Filtered sites
  const filteredSites = useMemo(() => {
    return relocationSites.filter((s) => {
      const matchState = selectedStateFilter === 'all' || s.state?.toLowerCase() === selectedStateFilter.toLowerCase();
      const matchQuery =
        !searchQuery ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.facilityType && s.facilityType.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchState && matchQuery;
    });
  }, [relocationSites, selectedStateFilter, searchQuery]);

  // Matched habitations assigned to current site
  const matchedHabitations = useMemo(() => {
    if (!site) return [];
    return habitations.filter((h) => h.nearestRelocationSite === site.id);
  }, [habitations, site]);

  const totalAssignedPopulation = matchedHabitations.reduce((acc, h) => acc + h.population, 0);
  const capacityLoadPct = site ? Math.min(100, Math.round((totalAssignedPopulation / site.capacity) * 100)) : 0;

  if (!site) {
    return (
      <div className="panel">
        {/* Mainstream Relocation Engine Banner */}
        <div className="panel__section" style={{ background: 'var(--bg-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  background: 'var(--accent-emerald-subtle)',
                  border: '1.5px solid var(--accent-emerald)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-emerald)',
                }}
              >
                <Building size={19} strokeWidth={2.5} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.2px' }}>
                  Safe Haven Relocation Registry
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  Institutional Disaster Refuges ({filteredSites.length} verified safe havens)
                </div>
              </div>
            </div>

            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: 'var(--radius-pill)',
                background: 'rgba(16, 185, 129, 0.15)',
                color: 'var(--accent-emerald)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
              }}
            >
              RELOCATION USP
            </span>
          </div>
        </div>

        {/* State Filter & Search */}
        <div className="panel__section" style={{ padding: '8px 12px', background: 'var(--bg-surface)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <select
                value={selectedStateFilter}
                onChange={(e) => setSelectedStateFilter(e.target.value)}
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
                <option value="all">All 10 Disaster States ({relocationSites.length} Havens)</option>
                {availableStates.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>

              <input
                type="text"
                placeholder="Filter safe havens..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: 140,
                  padding: '5px 8px',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 11,
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-subtle)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                }}
              />
            </div>

            {/* Quick Metrics Bar */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 6,
                padding: '6px',
                background: 'var(--bg-subtle)',
                borderRadius: 'var(--radius-sm)',
                textAlign: 'center',
              }}
            >
              <div>
                <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Capacity</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--accent-emerald)', fontFamily: 'var(--font-mono)' }}>
                  {filteredSites.reduce((acc, s) => acc + s.capacity, 0).toLocaleString()}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Avg Suitability</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                  {filteredSites.length > 0 ? (filteredSites.reduce((acc, s) => acc + s.suitabilityScore, 0) / filteredSites.length).toFixed(2) : '0.00'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Ready Shelters</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--accent-blue)', fontFamily: 'var(--font-mono)' }}>
                  {filteredSites.filter((s) => s.operationalStatus === 'READY' || !s.operationalStatus).length}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Haven Card List */}
        <div className="panel__list" style={{ padding: '10px 12px', gap: 6, overflowY: 'auto' }}>
          {filteredSites.map((s) => (
            <button
              key={s.id}
              className={`panel__list-item ${selectedSiteId === s.id ? 'panel__list-item--active' : ''}`}
              onClick={() => {
                selectSite(s.id);
                flyToSite(s.location.lng, s.location.lat);
              }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch',
                gap: 6,
                padding: '10px 12px',
                borderLeft: '3px solid var(--accent-emerald)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      background: 'var(--accent-emerald-subtle)',
                      border: '1px solid var(--accent-emerald)',
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 16,
                      flexShrink: 0,
                    }}
                  >
                    🏛️
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', textAlign: 'left', lineHeight: 1.3 }}>
                      {s.name}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'left', marginTop: 2 }}>
                      {s.district}, {s.state || 'India'} &bull; Elev: {s.location.elevation || 0}m
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
                  <span className={`risk-badge risk-badge--sm ${SUIT_CLASS[s.suitability] || ''}`}>
                    {s.suitability}
                  </span>
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      color: s.operationalStatus === 'ACTIVE_CAMP' ? 'var(--accent-rose)' : 'var(--accent-emerald)',
                    }}
                  >
                    ● {s.operationalStatus || 'READY'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-secondary)', background: 'var(--bg-subtle)', padding: '4px 8px', borderRadius: 'var(--radius-xs)' }}>
                <span>
                  <strong>Capacity:</strong> {s.capacity.toLocaleString()} beds
                </span>
                <span>
                  <strong>Clearance:</strong> +{s.elevationAboveFloodPlane || 20}m flood plane
                </span>
                <span>
                  <strong>Corridor:</strong> {s.lifelineCorridor ? s.lifelineCorridor.split(' ')[0] : 'All-weather'}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="panel">
      {/* Return to Registry Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 14px',
          background: 'var(--bg-subtle)',
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        <button
          onClick={() => selectSite(null as any)}
          style={{
            background: 'none',
            border: 'none',
            fontSize: 11,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            color: 'var(--accent-blue)',
          }}
        >
          <ArrowLeft size={14} />
          <span>Back to Safe Haven Registry</span>
        </button>
        <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>ID: {site.id}</span>
      </div>

      {/* Main Relocation Haven Card */}
      <div className="panel__section" style={{ background: 'var(--bg-surface)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div
            style={{
              width: 44,
              height: 44,
              background: 'var(--accent-emerald-subtle)',
              border: '1.5px solid var(--accent-emerald)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              flexShrink: 0,
            }}
          >
            🏛️
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.3 }}>
              {site.name}
            </div>
            <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', marginTop: 2 }}>
              {site.facilityType || 'Designated Disaster Refuge'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--accent-blue)', fontWeight: 600, marginTop: 2 }}>
              {site.district}, {site.state || 'Uttarakhand'} &bull; Elevation: {site.location.elevation || 0}m MSL
            </div>
          </div>
        </div>

        {/* Status & Managing Agency Badge */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, padding: '6px 10px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)' }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
            <strong>Managing Agency:</strong> {site.managingAgency || 'SDMA & District Emergency Operations Centre'}
          </div>
          <span
            style={{
              fontSize: 10,
              fontWeight: 800,
              color: site.operationalStatus === 'ACTIVE_CAMP' ? 'var(--accent-rose)' : 'var(--accent-emerald)',
              background: site.operationalStatus === 'ACTIVE_CAMP' ? 'var(--accent-rose-subtle)' : 'var(--accent-emerald-subtle)',
              padding: '2px 8px',
              borderRadius: 'var(--radius-pill)',
              border: '1px solid var(--border-color)',
            }}
          >
            ● {site.operationalStatus || 'READY FOR INTAKE'}
          </span>
        </div>

        {/* Capacity Load Bar */}
        <div style={{ marginTop: 12, background: 'var(--bg-subtle)', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, marginBottom: 6 }}>
            <span style={{ color: 'var(--text-secondary)' }}>Assigned Evacuee Allocation</span>
            <span style={{ color: capacityLoadPct > 80 ? 'var(--accent-rose)' : 'var(--accent-emerald)', fontFamily: 'var(--font-mono)' }}>
              {totalAssignedPopulation.toLocaleString()} / {site.capacity.toLocaleString()} beds ({capacityLoadPct}%)
            </span>
          </div>
          <div style={{ width: '100%', height: 6, background: 'var(--border-color)', borderRadius: 3, overflow: 'hidden' }}>
            <div
              style={{
                width: `${capacityLoadPct}%`,
                height: '100%',
                background: capacityLoadPct > 80 ? 'var(--accent-rose)' : 'var(--accent-emerald)',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4, display: 'flex', justifyContent: 'space-between' }}>
            <span>Available Capacity: {(site.capacity - totalAssignedPopulation).toLocaleString()} beds surplus</span>
            <span>Terrain Gradient: {site.slopeGrade}</span>
          </div>
        </div>
      </div>

      {/* Lifeline Highway & Engineering Verification */}
      <div className="panel__section" style={{ background: 'var(--bg-surface)' }}>
        <div className="panel__title" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <ShieldCheck size={16} color="var(--accent-emerald)" />
          <span>Structural & Topographic Certification</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11, color: 'var(--text-secondary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Building size={14} color="var(--accent-indigo)" />
            <span><strong>Engineering:</strong> {site.structuralType || 'RCC Category-IV Seismic & Cyclone Resilient Structure'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Navigation size={14} color="var(--accent-blue)" />
            <span><strong>Lifeline Corridor:</strong> {site.lifelineCorridor || 'National Highway Arterial Corridor'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <ShieldCheck size={14} color="var(--accent-emerald)" />
            <span><strong>Flood Plane Buffer:</strong> +{site.elevationAboveFloodPlane || 20}m above maximum danger watermark</span>
          </div>
        </div>
      </div>

      {/* Life Safety Amenities */}
      {site.amenities && site.amenities.length > 0 && (
        <div className="panel__section">
          <div className="panel__title" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <Zap size={15} color="var(--accent-amber)" />
            <span>Life-Support Amenities & Infrastructure</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {site.amenities.map((am, idx) => (
              <span
                key={idx}
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-pill)',
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                }}
              >
                ✓ {am}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Assigned At-Risk Habitations (Relocation Match) */}
      <div className="panel__section" style={{ overflowY: 'auto' }}>
        <div className="panel__title" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <Users size={15} color="var(--accent-rose)" />
          <span>Matched Influx Settlements ({matchedHabitations.length})</span>
        </div>

        {matchedHabitations.length === 0 ? (
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic', padding: 4 }}>
            No immediate critical habitations dynamically allocated to this safe haven. Available for regional reserve staging.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {matchedHabitations.map((h) => (
              <button
                key={h.id}
                onClick={() => selectHabitation(h.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 10px',
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)' }}>{h.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                    Pop: {h.population.toLocaleString()} &bull; Risk: {(h.riskScore * 100).toFixed(0)}% ({h.riskLevel})
                  </div>
                </div>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: 'var(--accent-blue)',
                    background: 'var(--accent-blue-subtle)',
                    padding: '2px 6px',
                    borderRadius: 'var(--radius-xs)',
                  }}
                >
                  View Route
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Constraints & Readiness Checklist */}
      <div className="panel__section">
        <div className="panel__title" style={{ marginBottom: 8 }}>
          Site Ingress & Readiness Verification
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {site.constraints.map((c, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 10px',
                background: c.met ? 'var(--accent-emerald-subtle)' : 'var(--accent-rose-subtle)',
                border: c.met ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(244, 63, 94, 0.3)',
                borderRadius: 'var(--radius-xs)',
              }}
            >
              {c.met ? (
                <Check size={13} color="var(--accent-emerald)" strokeWidth={2.5} />
              ) : (
                <XIcon size={13} color="var(--accent-rose)" strokeWidth={2.5} />
              )}
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: c.met ? 'var(--accent-emerald)' : 'var(--accent-rose)',
                }}
              >
                {c.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
