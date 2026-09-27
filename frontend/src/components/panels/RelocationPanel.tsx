import { Check, X as XIcon, Users, Ruler, ShieldCheck, Compass } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { flyToSite } from '../../cesium/camera';

const SUIT_CLASS: Record<string, string> = {
  HIGH: 'risk--low',
  MODERATE: 'risk--moderate',
  LOW: 'risk--high',
};

interface Props {
  showList?: boolean;
}

export default function RelocationPanel({ showList }: Props) {
  const { relocationSites, getSelectedSite, selectedSiteId, selectSite } = useAppStore();
  const site = getSelectedSite();

  if (showList && !site) {
    return (
      <div className="panel">
        <div className="panel__section" style={{ background: 'var(--nb-canvas-subtle)', padding: '14px 16px', borderBottom: '2.5px solid #000000' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                background: 'var(--nb-mint)',
                border: '2px solid #000000',
                boxShadow: '2px 2px 0px #000000',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#000000',
              }}
            >
              <Compass size={18} strokeWidth={2.5} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 900, color: '#000000', textTransform: 'uppercase' }}>
                Safe Haven Registry
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#525252' }}>
                Designated Disaster Relocation Grounds
              </div>
            </div>
          </div>
        </div>

        <div className="panel__list">
          {relocationSites.map((s) => (
            <button
              key={s.id}
              className={`panel__list-item ${selectedSiteId === s.id ? 'panel__list-item--active' : ''}`}
              onClick={() => {
                selectSite(s.id);
                flyToSite(s.location.lng, s.location.lat);
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    background: 'var(--nb-mint)',
                    border: '2px solid #000000',
                    boxShadow: '1.5px 1.5px 0px #000000',
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18,
                  }}
                >
                  🏕️
                </div>
                <div>
                  <div className="panel__list-item-name">{s.name}</div>
                  <div className="panel__list-item-meta">
                    Cap: {s.capacity.toLocaleString()} beds &bull; Dist: {s.distanceFromAffected} km
                  </div>
                </div>
              </div>
              <span className={`risk-badge risk-badge--sm ${SUIT_CLASS[s.suitability] || ''}`}>
                {s.suitability}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (!site) {
    return (
      <div className="panel">
        <div style={{ padding: 32, textAlign: 'center', color: '#525252', fontSize: 12, fontWeight: 700 }}>
          Select a relocation site from the map or list to view telemetry.
        </div>
      </div>
    );
  }

  return (
    <div className="panel">
      {/* Site Avatar & Header */}
      <div className="panel__section" style={{ background: 'var(--nb-canvas-subtle)', padding: '14px 16px', borderBottom: '2.5px solid #000000' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 44,
              height: 44,
              background: 'var(--nb-mint)',
              border: '2px solid #000000',
              boxShadow: '2.5px 2.5px 0px #000000',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
            }}
          >
            🏕️
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 900, color: '#000000', textTransform: 'uppercase', letterSpacing: '-0.3px' }}>
              {site.name}
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#525252' }}>
              {site.district}, Uttarakhand &bull; Elev: {site.location.elevation || 1200}m
            </div>
          </div>
        </div>

        <div style={{ marginTop: 12 }} className="panel__row panel__row--between">
          <span style={{ fontSize: 11, fontWeight: 800, color: '#000000', textTransform: 'uppercase' }}>SUITABILITY GRADE:</span>
          <span className={`risk-badge ${SUIT_CLASS[site.suitability] || ''}`}>
            {site.suitabilityScore.toFixed(2)} &mdash; {site.suitability}
          </span>
        </div>
      </div>

      {/* Metrics Card */}
      <div className="panel__section" style={{ padding: '14px 16px', borderBottom: '2px solid #000000' }}>
        <div className="panel__row panel__row--between">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Users size={15} color="#000000" />
            <span className="panel__label">TOTAL BED CAPACITY:</span>
          </div>
          <span className="panel__value" style={{ fontSize: 14 }}>{site.capacity.toLocaleString()}</span>
        </div>

        <div className="panel__row panel__row--between" style={{ marginTop: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Ruler size={15} color="#000000" />
            <span className="panel__label">TRANSIT DISTANCE:</span>
          </div>
          <span className="panel__value" style={{ fontSize: 14 }}>{site.distanceFromAffected} km</span>
        </div>
      </div>

      {/* Slope & Infrastructure */}
      <div className="panel__section" style={{ padding: '14px 16px' }}>
        <div className="panel__title" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <ShieldCheck size={16} color="var(--nb-mint)" />
          <span>Geological & Access Verification</span>
        </div>

        <div style={{ fontSize: 11, fontWeight: 700, color: '#000000', marginBottom: 10 }}>
          <strong>Terrain Gradient:</strong> {site.slopeGrade}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {site.constraints.map((c, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 12px',
                background: c.met ? 'var(--nb-mint-light)' : 'var(--nb-pink-light)',
                border: '2px solid #000000',
                borderRadius: 8,
                boxShadow: '2px 2px 0px #000000',
              }}
            >
              {c.met ? (
                <Check size={16} color="#000000" strokeWidth={3} />
              ) : (
                <XIcon size={16} color="#000000" strokeWidth={3} />
              )}
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: '#000000',
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
