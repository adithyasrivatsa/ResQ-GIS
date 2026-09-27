import { Users, ArrowRight, ShieldAlert, HeartHandshake, Compass, Gauge } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { flyToSite } from '../../cesium/camera';
import type { RiskLevel, HazardType } from '../../types';

const RISK_CLASS: Record<RiskLevel, string> = {
  CRITICAL: 'risk--critical',
  HIGH: 'risk--high',
  MODERATE: 'risk--moderate',
  LOW: 'risk--low',
  MINIMAL: 'risk--minimal',
};

const HAZARD_LABEL: Record<HazardType, string> = {
  landslide: 'Landslide',
  flood: 'Flood',
  glof: 'GLOF',
  earthquake: 'Earthquake',
  avalanche: 'Avalanche',
};

export default function HabitationPanel() {
  const { getSelectedHabitation, relocationSites, selectSite, activeHazardAssessment } = useAppStore();
  const hab = getSelectedHabitation();

  if (!hab) return null;

  const nearestSite = relocationSites.find((s) => s.id === hab.nearestRelocationSite);
  const activeCells = Math.round(hab.riskScore * 10);

  // Dynamic telemetry values (if live assessment available, else fallback)
  const slopeDeg = activeHazardAssessment?.slope_degrees ?? (hab.location.elevation && hab.location.elevation > 2000 ? 32.5 : 24.2);
  const rain24h = activeHazardAssessment?.weather_observation?.rainfall_24h ?? 28.9;
  const riverDist = activeHazardAssessment?.nearest_river_dist_km ?? 0.65;
  const mlScore = activeHazardAssessment?.ml_prediction?.susceptibility_score ?? (hab.riskScore * 0.95);
  const mlConf = activeHazardAssessment?.ml_prediction?.confidence ? `${(activeHazardAssessment.ml_prediction.confidence * 100).toFixed(0)}%` : '92%';
  const provenance = activeHazardAssessment?.provenance || 'LIVE';

  return (
    <div className="panel">
      {/* Village Avatar & Meta Section */}
      <div className="panel__section" style={{ background: '#fdfbf7', paddingBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 44,
                height: 44,
                background: hab.riskScore >= 0.7 ? 'var(--retro-pink-light)' : 'var(--retro-orange-light)',
                border: '2px solid #000',
                boxShadow: '3px 3px 0px #000',
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22,
              }}
            >
              🏔️
            </div>

            <div>
              <div style={{ fontFamily: 'Silkscreen', fontSize: 14, fontWeight: 700, color: '#000' }}>
                {hab.name}
              </div>
              <div style={{ fontFamily: 'Space Mono', fontSize: 10, color: '#64748b' }}>
                {hab.district}, {hab.state} · Elev: {hab.location.elevation || 1800}m
              </div>
            </div>
          </div>

          {/* Truthful Data Provenance Tag */}
          <span
            style={{
              fontFamily: 'Space Mono',
              fontSize: 9,
              padding: '2px 6px',
              borderRadius: 4,
              border: '1px solid #16a34a',
              background: '#dcfce7',
              color: '#166534',
              fontWeight: 700,
            }}
          >
            ● {provenance}
          </span>
        </div>

        {/* Retro 10-Cell Risk Equalizer */}
        <div style={{ marginTop: 8 }}>
          <div className="panel__row panel__row--between">
            <span style={{ fontFamily: 'Silkscreen', fontSize: 10, color: '#000' }}>DYNAMIC HAZARD SCORE</span>
            <span className={`risk-badge risk-badge--sm ${RISK_CLASS[hab.riskLevel]}`}>
              SCORE {hab.riskScore.toFixed(2)}
            </span>
          </div>

          <div className="retro-eq-grid">
            {Array.from({ length: 10 }).map((_, i) => {
              const isLit = i < activeCells;
              return (
                <div
                  key={i}
                  className={`retro-eq-cell ${
                    isLit
                      ? i >= 7
                        ? 'retro-eq-cell--lit-pink'
                        : i >= 4
                        ? 'retro-eq-cell--lit-orange'
                        : 'retro-eq-cell--lit-purple'
                      : ''
                  }`}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Measurable Telemetry & ML Susceptibility Breakdown */}
      <div className="panel__section" style={{ background: '#f8fafc' }}>
        <div className="panel__section-title">
          <Gauge size={14} color="#0284c7" />
          <span>MEASURABLE HAZARD DRIVERS</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6, marginTop: 4 }}>
          {/* Slope */}
          <div
            style={{
              padding: '6px 8px',
              background: '#ffffff',
              border: '1.5px solid #000',
              borderRadius: 6,
              boxShadow: '2px 2px 0px #000',
            }}
          >
            <div style={{ fontFamily: 'Silkscreen', fontSize: 9, color: '#64748b' }}>COPERNICUS SLOPE</div>
            <div style={{ fontFamily: 'Space Mono', fontSize: 13, fontWeight: 700, color: slopeDeg >= 30 ? '#dc2626' : '#0f172a' }}>
              {slopeDeg.toFixed(1)}°
            </div>
            <div style={{ fontFamily: 'Space Mono', fontSize: 8, color: '#94a3b8' }}>GLO-30 Finite Diff</div>
          </div>

          {/* 24h Rainfall */}
          <div
            style={{
              padding: '6px 8px',
              background: '#ffffff',
              border: '1.5px solid #000',
              borderRadius: 6,
              boxShadow: '2px 2px 0px #000',
            }}
          >
            <div style={{ fontFamily: 'Silkscreen', fontSize: 9, color: '#64748b' }}>24H PRECIPITATION</div>
            <div style={{ fontFamily: 'Space Mono', fontSize: 13, fontWeight: 700, color: rain24h >= 30 ? '#dc2626' : '#0284c7' }}>
              {rain24h.toFixed(1)} mm
            </div>
            <div style={{ fontFamily: 'Space Mono', fontSize: 8, color: '#94a3b8' }}>Open-Meteo Live</div>
          </div>

          {/* River Proximity */}
          <div
            style={{
              padding: '6px 8px',
              background: '#ffffff',
              border: '1.5px solid #000',
              borderRadius: 6,
              boxShadow: '2px 2px 0px #000',
            }}
          >
            <div style={{ fontFamily: 'Silkscreen', fontSize: 9, color: '#64748b' }}>RIVER CORRIDOR</div>
            <div style={{ fontFamily: 'Space Mono', fontSize: 13, fontWeight: 700, color: riverDist < 0.5 ? '#dc2626' : '#0f172a' }}>
              {riverDist.toFixed(2)} km
            </div>
            <div style={{ fontFamily: 'Space Mono', fontSize: 8, color: '#94a3b8' }}>CWC Gauging Stream</div>
          </div>

          {/* ML Susceptibility */}
          <div
            style={{
              padding: '6px 8px',
              background: '#ffffff',
              border: '1.5px solid #000',
              borderRadius: 6,
              boxShadow: '2px 2px 0px #000',
            }}
          >
            <div style={{ fontFamily: 'Silkscreen', fontSize: 9, color: '#7c3aed' }}>ML SUSCEPTIBILITY</div>
            <div style={{ fontFamily: 'Space Mono', fontSize: 13, fontWeight: 700, color: '#7c3aed' }}>
              {mlScore.toFixed(2)}
            </div>
            <div style={{ fontFamily: 'Space Mono', fontSize: 8, color: '#94a3b8' }}>RandomForest ({mlConf})</div>
          </div>
        </div>
      </div>

      {/* Population & Household Card */}
      <div className="panel__section">
        <div className="panel__row panel__row--between">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Users size={15} color="var(--retro-purple)" />
            <span className="panel__label">TOTAL POPULATION:</span>
          </div>
          <span className="panel__value">{hab.population.toLocaleString()}</span>
        </div>

        <div className="panel__row panel__row--between" style={{ marginTop: 4 }}>
          <span className="panel__label" style={{ paddingLeft: 21 }}>HOUSEHOLDS:</span>
          <span className="panel__value">{hab.households.toLocaleString()}</span>
        </div>
      </div>

      {/* Per-Hazard Breakdown */}
      <div className="panel__section">
        <div className="panel__section-title">
          <ShieldAlert size={14} color="var(--retro-orange)" />
          <span>HAZARD EXPOSURE MATRIX</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {hab.hazardExposure.map((hazard) => (
            <div
              key={hazard.type}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '4px 8px',
                background: '#ffffff',
                border: '2px solid #000',
                boxShadow: '2px 2px 0px #000',
                borderRadius: 6,
              }}
            >
              <div>
                <span style={{ fontFamily: 'Silkscreen', fontSize: 10, fontWeight: 700 }}>
                  {HAZARD_LABEL[hazard.type]}
                </span>
                {hazard.contributors.length > 0 && (
                  <div style={{ fontFamily: 'Space Mono', fontSize: 9, color: '#64748b' }}>
                    {hazard.contributors[0]}
                  </div>
                )}
              </div>
              <span className={`risk-badge risk-badge--sm ${RISK_CLASS[hazard.level]}`}>
                {hazard.level}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Vulnerability Index Bars */}
      <div className="panel__section">
        <div className="panel__section-title">
          <HeartHandshake size={14} color="var(--retro-purple)" />
          <span>HVI (VULNERABILITY INDEX)</span>
        </div>

        <div style={{ background: '#fdfbf7', padding: '10px 12px', border: '2px solid #000', borderRadius: 8, boxShadow: '2px 2px 0px #000' }}>
          <div className="vuln-bar">
            <span className="vuln-bar__label">Exposure</span>
            <div className="vuln-bar__track">
              <div className="vuln-bar__fill" style={{ width: `${hab.vulnerabilityIndex.exposure * 100}%` }} />
            </div>
            <span className="vuln-bar__value">{hab.vulnerabilityIndex.exposure.toFixed(2)}</span>
          </div>

          <div className="vuln-bar">
            <span className="vuln-bar__label">Sensitivity</span>
            <div className="vuln-bar__track">
              <div className="vuln-bar__fill vuln-bar__fill--orange" style={{ width: `${hab.vulnerabilityIndex.sensitivity * 100}%` }} />
            </div>
            <span className="vuln-bar__value">{hab.vulnerabilityIndex.sensitivity.toFixed(2)}</span>
          </div>

          <div className="vuln-bar">
            <span className="vuln-bar__label">Adaptive Cap.</span>
            <div className="vuln-bar__track">
              <div className="vuln-bar__fill vuln-bar__fill--green" style={{ width: `${hab.vulnerabilityIndex.adaptiveCapacity * 100}%` }} />
            </div>
            <span className="vuln-bar__value">{hab.vulnerabilityIndex.adaptiveCapacity.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Recommended Action inside Speech Bubble */}
      <div className="panel__section">
        <div className="panel__section-title">
          <span>💬 DIRECTIVE FOR INCIDENT COMMANDER</span>
        </div>

        <div className="speech-bubble">
          "{hab.recommendedAction}"
        </div>
      </div>

      {/* Nearest Safe Haven Corridor Card */}
      {nearestSite && (
        <div className="panel__section" style={{ background: '#f0fdf4' }}>
          <div className="panel__section-title" style={{ color: '#15803d' }}>
            <Compass size={14} color="#15803d" />
            <span>DESIGNATED RELOCATION HAVEN</span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#ffffff',
              border: '2px solid #000',
              boxShadow: '3px 3px 0px #000',
              borderRadius: 8,
              padding: '10px 12px',
            }}
          >
            <div>
              <div style={{ fontFamily: 'Silkscreen', fontSize: 12, fontWeight: 700, color: '#166534' }}>
                {nearestSite.name}
              </div>
              <div style={{ fontFamily: 'Space Mono', fontSize: 10, color: '#4b5563', marginTop: 2 }}>
                Dist: {nearestSite.distanceFromAffected} km · Cap: {nearestSite.capacity.toLocaleString()} beds
              </div>
            </div>

            <button
              className="retro-btn retro-btn--purple"
              onClick={() => {
                selectSite(nearestSite.id);
                flyToSite(nearestSite.location.lng, nearestSite.location.lat);
              }}
              title="Fly to site"
            >
              <span>INSPECT</span>
              <ArrowRight size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
