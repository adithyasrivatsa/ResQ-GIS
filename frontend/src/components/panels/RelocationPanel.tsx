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
        <div className="panel__section" style={{ background: '#f0fdf4', paddingBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Compass size={18} color="#15803d" />
            <div>
              <div style={{ fontFamily: 'Silkscreen', fontSize: 13, fontWeight: 700, color: '#166534' }}>
                SAFE HAVEN REGISTRY
              </div>
              <div style={{ fontFamily: 'Space Mono', fontSize: 9, color: '#64748b' }}>
                DESIGNATED DISASTER RELOCATION GROUNDS
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    background: '#dcfce7',
                    border: '1.5px solid #000',
                    borderRadius: 6,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 14,
                  }}
                >
                  🏕️
                </div>
                <div>
                  <div className="panel__list-item-name">{s.name}</div>
                  <div className="panel__list-item-meta">
                    Cap: {s.capacity.toLocaleString()} beds · Dist: {s.distanceFromAffected} km
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
        <div style={{ padding: 24, textAlign: 'center', fontFamily: 'Space Mono', color: '#64748b' }}>
          Select a relocation site from the map or list to view telemetry.
        </div>
      </div>
    );
  }

  return (
    <div className="panel">
      {/* Site Avatar & Header */}
      <div className="panel__section" style={{ background: '#f0fdf4', paddingBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 44,
              height: 44,
              background: '#bbf7d0',
              border: '2px solid #000',
              boxShadow: '3px 3px 0px #000',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
            }}
          >
            🏕️
          </div>
          <div>
            <div style={{ fontFamily: 'Silkscreen', fontSize: 14, fontWeight: 700, color: '#166534' }}>
              {site.name}
            </div>
            <div style={{ fontFamily: 'Space Mono', fontSize: 10, color: '#64748b' }}>
              {site.district}, Uttarakhand · Elev: {site.location.elevation || 1200}m
            </div>
          </div>
        </div>

        <div style={{ marginTop: 10 }} className="panel__row panel__row--between">
          <span style={{ fontFamily: 'Silkscreen', fontSize: 10 }}>SUITABILITY GRADE:</span>
          <span className={`risk-badge ${SUIT_CLASS[site.suitability] || ''}`}>
            {site.suitabilityScore.toFixed(2)} — {site.suitability}
          </span>
        </div>
      </div>

      {/* Metrics Card */}
      <div className="panel__section">
        <div className="panel__row panel__row--between">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Users size={14} color="#166534" />
            <span className="panel__label">TOTAL BED CAPACITY:</span>
          </div>
          <span className="panel__value">{site.capacity.toLocaleString()}</span>
        </div>

        <div className="panel__row panel__row--between" style={{ marginTop: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Ruler size={14} color="#166534" />
            <span className="panel__label">TRANSIT DISTANCE:</span>
          </div>
          <span className="panel__value">{site.distanceFromAffected} km</span>
        </div>
      </div>

      {/* Slope & Infrastructure */}
      <div className="panel__section">
        <div className="panel__section-title">
          <ShieldCheck size={14} color="#166534" />
          <span>GEOLOGICAL & ACCESS VERIFICATION</span>
        </div>

        <div style={{ fontFamily: 'Space Mono', fontSize: 11, marginBottom: 8 }}>
          <strong>TERRAIN GRADIENT:</strong> {site.slopeGrade}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {site.constraints.map((c, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '4px 8px',
                background: c.met ? '#f0fdf4' : '#fef2f2',
                border: '1.5px solid #000',
                borderRadius: 4,
              }}
            >
              {c.met ? (
                <Check size={14} color="#16a34a" strokeWidth={3} />
              ) : (
                <XIcon size={14} color="#dc2626" strokeWidth={3} />
              )}
              <span
                style={{
                  fontFamily: 'Space Mono',
                  fontSize: 10,
                  fontWeight: 700,
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
