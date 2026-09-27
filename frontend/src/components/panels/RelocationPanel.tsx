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
        <div className="panel__section" style={{ background: '#f8fafc', padding: '14px 16px', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 32,
                height: 32,
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#15803d',
              }}
            >
              <Compass size={16} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                Safe Haven Registry
              </div>
              <div style={{ fontSize: 11, color: '#64748b' }}>
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
                    width: 34,
                    height: 34,
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 16,
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
        <div style={{ padding: 32, textAlign: 'center', color: '#64748b', fontSize: 12 }}>
          Select a relocation site from the map or list to view telemetry.
        </div>
      </div>
    );
  }

  return (
    <div className="panel">
      {/* Site Avatar & Header */}
      <div className="panel__section" style={{ background: '#f8fafc', padding: '14px 16px', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 42,
              height: 42,
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
            }}
          >
            🏕️
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
              {site.name}
            </div>
            <div style={{ fontSize: 11, color: '#64748b' }}>
              {site.district}, Uttarakhand &bull; Elev: {site.location.elevation || 1200}m
            </div>
          </div>
        </div>

        <div style={{ marginTop: 12 }} className="panel__row panel__row--between">
          <span style={{ fontSize: 11, fontWeight: 600, color: '#475569' }}>SUITABILITY GRADE:</span>
          <span className={`risk-badge ${SUIT_CLASS[site.suitability] || ''}`}>
            {site.suitabilityScore.toFixed(2)} &mdash; {site.suitability}
          </span>
        </div>
      </div>

      {/* Metrics Card */}
      <div className="panel__section" style={{ padding: '12px 16px' }}>
        <div className="panel__row panel__row--between">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Users size={14} color="#15803d" />
            <span className="panel__label">TOTAL BED CAPACITY:</span>
          </div>
          <span className="panel__value">{site.capacity.toLocaleString()}</span>
        </div>

        <div className="panel__row panel__row--between" style={{ marginTop: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Ruler size={14} color="#15803d" />
            <span className="panel__label">TRANSIT DISTANCE:</span>
          </div>
          <span className="panel__value">{site.distanceFromAffected} km</span>
        </div>
      </div>

      {/* Slope & Infrastructure */}
      <div className="panel__section" style={{ padding: '12px 16px' }}>
        <div className="panel__title" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <ShieldCheck size={15} color="#15803d" />
          <span>Geological & Access Verification</span>
        </div>

        <div style={{ fontSize: 11, color: '#475569', marginBottom: 10 }}>
          <strong>Terrain Gradient:</strong> {site.slopeGrade}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {site.constraints.map((c, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 10px',
                background: c.met ? '#f0fdf4' : '#fef2f2',
                border: `1px solid ${c.met ? '#bbf7d0' : '#fecaca'}`,
                borderRadius: 6,
              }}
            >
              {c.met ? (
                <Check size={14} color="#16a34a" strokeWidth={2.5} />
              ) : (
                <XIcon size={14} color="#dc2626" strokeWidth={2.5} />
              )}
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: c.met ? '#15803d' : '#b91c1c',
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
