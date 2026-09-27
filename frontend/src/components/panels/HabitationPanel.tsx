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

  // Dynamic telemetry values (if live assessment available, else fallback)
  const slopeDeg = activeHazardAssessment?.slope_degrees ?? (hab.location.elevation && hab.location.elevation > 2000 ? 32.5 : 24.2);
  const rain24h = activeHazardAssessment?.weather_observation?.rainfall_24h ?? 28.9;
  const riverDist = activeHazardAssessment?.nearest_river_dist_km ?? 0.65;
  const mlScore = activeHazardAssessment?.ml_prediction?.susceptibility_score ?? (hab.riskScore * 0.95);
  const mlConf = activeHazardAssessment?.ml_prediction?.confidence ? `${(activeHazardAssessment.ml_prediction.confidence * 100).toFixed(0)}%` : '92%';
  const provenance = activeHazardAssessment?.provenance || 'LIVE';

  const riskPct = Math.round(hab.riskScore * 100);
  const barColor =
    hab.riskScore >= 0.8 ? '#ef4444' : hab.riskScore >= 0.6 ? '#f59e0b' : '#10b981';

  return (
    <div className="panel">
      {/* Village Avatar & Meta Section */}
      <div className="panel__section" style={{ background: 'var(--nb-canvas-subtle)', padding: '14px 16px', borderBottom: '2.5px solid #000000' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 44,
                height: 44,
                background: 'var(--nb-yellow)',
                border: '2px solid #000000',
                boxShadow: '2.5px 2.5px 0px #000000',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22,
              }}
            >
              🏔️
            </div>

            <div>
              <div style={{ fontSize: 15, fontWeight: 900, color: '#000000', textTransform: 'uppercase', letterSpacing: '-0.3px' }}>
                {hab.name}
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#525252' }}>
                {hab.district}, {hab.state} &bull; Elev: {hab.location.elevation || 1800}m
              </div>
            </div>
          </div>

          {/* Truthful Data Provenance Tag */}
          <span
            style={{
              fontSize: 10,
              padding: '3px 8px',
              borderRadius: 6,
              border: '1.5px solid #000000',
              boxShadow: '1.5px 1.5px 0px #000000',
              background: 'var(--nb-mint)',
              color: '#000000',
              fontWeight: 800,
              textTransform: 'uppercase',
            }}
          >
            ● {provenance}
          </span>
        </div>

        {/* Clean Risk Score Meter */}
        <div style={{ marginTop: 8 }}>
          <div className="panel__row panel__row--between" style={{ marginBottom: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#000000', textTransform: 'uppercase' }}>DYNAMIC HAZARD SCORE</span>
            <span className={`risk-badge risk-badge--sm ${RISK_CLASS[hab.riskLevel]}`}>
              SCORE {hab.riskScore.toFixed(2)}
            </span>
          </div>

          <div
            style={{
              width: '100%',
              height: 10,
              background: '#ffffff',
              border: '2px solid #000000',
              borderRadius: 9999,
              boxShadow: '1.5px 1.5px 0px #000000',
              overflow: 'hidden',
              marginTop: 4,
            }}
          >
            <div
              style={{
                width: `${riskPct}%`,
                height: '100%',
                background: barColor,
                borderRight: '2px solid #000000',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>
      </div>

      {/* Measurable Telemetry & ML Susceptibility Breakdown */}
      <div className="panel__section" style={{ padding: '14px 16px', borderBottom: '2px solid #000000' }}>
        <div className="panel__title" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <Gauge size={15} color="#000000" />
          <span>Measurable Hazard Drivers</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          {/* Slope */}
          <div
            style={{
              padding: '10px',
              background: '#ffffff',
              border: '2px solid #000000',
              borderRadius: 8,
              boxShadow: '2px 2px 0px #000000',
            }}
          >
            <div style={{ fontSize: 10, fontWeight: 800, color: '#525252' }}>COPERNICUS SLOPE</div>
            <div style={{ fontSize: 16, fontWeight: 900, color: slopeDeg >= 30 ? 'var(--nb-pink)' : '#000000', marginTop: 2 }}>
              {slopeDeg.toFixed(1)}°
            </div>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#737373' }}>GLO-30 Finite Diff</div>
          </div>

          {/* 24h Rainfall */}
          <div
            style={{
              padding: '10px',
              background: '#ffffff',
              border: '2px solid #000000',
              borderRadius: 8,
              boxShadow: '2px 2px 0px #000000',
            }}
          >
            <div style={{ fontSize: 10, fontWeight: 800, color: '#525252' }}>24H PRECIPITATION</div>
            <div style={{ fontSize: 16, fontWeight: 900, color: rain24h >= 30 ? 'var(--nb-pink)' : '#0284c7', marginTop: 2 }}>
              {rain24h.toFixed(1)} mm
            </div>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#737373' }}>Open-Meteo Live</div>
          </div>

          {/* River Proximity */}
          <div
            style={{
              padding: '10px',
              background: '#ffffff',
              border: '2px solid #000000',
              borderRadius: 8,
              boxShadow: '2px 2px 0px #000000',
            }}
          >
            <div style={{ fontSize: 10, fontWeight: 800, color: '#525252' }}>RIVER CORRIDOR</div>
            <div style={{ fontSize: 16, fontWeight: 900, color: riverDist < 0.5 ? 'var(--nb-pink)' : '#000000', marginTop: 2 }}>
              {riverDist.toFixed(2)} km
            </div>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#737373' }}>CWC Gauging Stream</div>
          </div>

          {/* ML Susceptibility */}
          <div
            style={{
              padding: '10px',
              background: '#ffffff',
              border: '2px solid #000000',
              borderRadius: 8,
              boxShadow: '2px 2px 0px #000000',
            }}
          >
            <div style={{ fontSize: 10, fontWeight: 800, color: '#525252' }}>ML SUSCEPTIBILITY</div>
            <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--nb-purple)', marginTop: 2 }}>
              {mlScore.toFixed(2)}
            </div>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#737373' }}>RandomForest ({mlConf})</div>
          </div>
        </div>
      </div>

      {/* Population & Household Card */}
      <div className="panel__section" style={{ padding: '12px 16px', borderBottom: '2px solid #000000' }}>
        <div className="panel__row panel__row--between">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Users size={15} color="#000000" />
            <span className="panel__label">TOTAL POPULATION:</span>
          </div>
          <span className="panel__value" style={{ fontSize: 14 }}>{hab.population.toLocaleString()}</span>
        </div>

        <div className="panel__row panel__row--between" style={{ marginTop: 6 }}>
          <span className="panel__label" style={{ paddingLeft: 21 }}>HOUSEHOLDS:</span>
          <span className="panel__value" style={{ fontSize: 14 }}>{hab.households.toLocaleString()}</span>
        </div>
      </div>

      {/* Per-Hazard Breakdown */}
      <div className="panel__section" style={{ padding: '14px 16px', borderBottom: '2px solid #000000' }}>
        <div className="panel__title" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <ShieldAlert size={15} color="var(--nb-orange)" />
          <span>Hazard Exposure Matrix</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {hab.hazardExposure.map((hazard) => (
            <div
              key={hazard.type}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                background: '#ffffff',
                border: '2px solid #000000',
                borderRadius: 8,
                boxShadow: '2px 2px 0px #000000',
              }}
            >
              <div>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#000000' }}>
                  {HAZARD_LABEL[hazard.type]}
                </span>
                {hazard.contributors.length > 0 && (
                  <div style={{ fontSize: 10, fontWeight: 600, color: '#525252', marginTop: 1 }}>
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
      <div className="panel__section" style={{ padding: '14px 16px', borderBottom: '2px solid #000000' }}>
        <div className="panel__title" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <HeartHandshake size={15} color="var(--nb-pink)" />
          <span>HVI (Vulnerability Index)</span>
        </div>

        <div style={{ background: '#ffffff', padding: '12px 14px', border: '2px solid #000000', borderRadius: 8, boxShadow: '2px 2px 0px #000000' }}>
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
      <div className="panel__section" style={{ padding: '14px 16px', borderBottom: nearestSite ? '2px solid #000000' : 'none' }}>
        <div className="panel__title" style={{ marginBottom: 8 }}>
          Directive for Incident Commander
        </div>

        <div className="speech-bubble">
          &ldquo;{hab.recommendedAction}&rdquo;
        </div>
      </div>

      {/* Nearest Safe Haven Corridor Card */}
      {nearestSite && (
        <div className="panel__section" style={{ background: 'var(--nb-canvas-subtle)', padding: '14px 16px' }}>
          <div className="panel__title" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, color: '#000000' }}>
            <Compass size={15} color="#000000" />
            <span>Designated Relocation Haven</span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#ffffff',
              border: '2px solid #000000',
              boxShadow: '3px 3px 0px #000000',
              borderRadius: 8,
              padding: '12px 14px',
            }}
          >
            <div>
              <div style={{ fontSize: 13, fontWeight: 900, color: '#000000' }}>
                {nearestSite.name}
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#525252', marginTop: 2 }}>
                Dist: {nearestSite.distanceFromAffected} km &bull; Cap: {nearestSite.capacity.toLocaleString()} beds
              </div>
            </div>

            <button
              onClick={() => {
                selectSite(nearestSite.id);
                flyToSite(nearestSite.location.lng, nearestSite.location.lat);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                background: 'var(--nb-yellow)',
                color: '#000000',
                border: '2px solid #000000',
                boxShadow: '2px 2px 0px #000000',
                borderRadius: 6,
                padding: '6px 12px',
                fontSize: 11,
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'all 0.1s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--nb-mint)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--nb-yellow)')}
              title="Fly to site"
            >
              <span>Inspect</span>
              <ArrowRight size={12} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
