import { Check, X as XIcon, Users, Ruler, ShieldCheck, Compass, ArrowLeft } from 'lucide-react';
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

export default function RelocationPanel(_props: Props = {}) {
  const { relocationSites, getSelectedSite, selectedSiteId, selectSite } = useAppStore();
  const site = getSelectedSite();

  if (!site) {
    return (
      <div className="panel">
        <div className="panel__section" style={{ background: 'var(--bg-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                background: 'var(--accent-emerald-subtle)',
                border: '1px solid var(--accent-emerald)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-emerald)',
              }}
            >
              <Compass size={18} strokeWidth={2} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                Safe Haven Registry
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Designated Disaster Relocation Grounds ({relocationSites.length} Verified)
              </div>
            </div>
          </div>
        </div>

        <div className="panel__list" style={{ padding: '12px', gap: 6 }}>
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
                    width: 32,
                    height: 32,
                    background: 'var(--accent-emerald-subtle)',
                    border: '1px solid var(--accent-emerald)',
                    borderRadius: 'var(--radius-md)',
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
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            color: 'var(--accent-blue)',
          }}
        >
          <ArrowLeft size={13} />
          Back to Safe Haven Registry
        </button>
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>ID: {site.id}</span>
      </div>

      {/* Site Avatar & Header */}
      <div className="panel__section" style={{ background: 'var(--bg-surface)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              background: 'var(--accent-emerald-subtle)',
              border: '1px solid var(--accent-emerald)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
            }}
          >
            🏕️
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
              {site.name}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {site.district}, Uttarakhand &bull; Elev: {site.location.elevation || 1200}m
            </div>
          </div>
        </div>

        <div style={{ marginTop: 12 }} className="panel__row panel__row--between">
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>SUITABILITY GRADE</span>
          <span className={`risk-badge ${SUIT_CLASS[site.suitability] || ''}`}>
            {site.suitabilityScore.toFixed(2)} &mdash; {site.suitability}
          </span>
        </div>
      </div>

      {/* Metrics Card */}
      <div className="panel__section">
        <div className="panel__row panel__row--between">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Users size={15} color="var(--text-muted)" />
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Total Bed Capacity:</span>
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
            {site.capacity.toLocaleString()}
          </span>
        </div>

        <div className="panel__row panel__row--between" style={{ marginTop: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Ruler size={15} color="var(--text-muted)" />
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Transit Distance:</span>
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
            {site.distanceFromAffected} km
          </span>
        </div>
      </div>

      {/* Slope & Infrastructure */}
      <div className="panel__section" style={{ overflowY: 'auto' }}>
        <div className="panel__title" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <ShieldCheck size={16} color="var(--accent-emerald)" />
          <span>Geological & Access Verification</span>
        </div>

        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 10 }}>
          <strong>Terrain Gradient:</strong> {site.slopeGrade}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {site.constraints.map((c, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 12px',
                background: c.met ? 'var(--accent-emerald-subtle)' : 'var(--accent-rose-subtle)',
                border: c.met ? '1px solid var(--accent-emerald)' : '1px solid var(--accent-rose)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              {c.met ? (
                <Check size={15} color="var(--accent-emerald)" strokeWidth={2.5} />
              ) : (
                <XIcon size={15} color="var(--accent-rose)" strokeWidth={2.5} />
              )}
              <span
                style={{
                  fontSize: 11,
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
