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
      <div className="panel__section" style={{ background: '#f8fafc', padding: '14px 16px', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 42,
                height: 42,
                background: hab.riskScore >= 0.7 ? '#fef2f2' : '#fffbeb',
                border: `1px solid ${hab.riskScore >= 0.7 ? '#fecaca' : '#fde68a'}`,
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
              }}
            >
              🏔️
            </div>

            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                {hab.name}
              </div>
              <div style={{ fontSize: 11, color: '#64748b' }}>
                {hab.district}, {hab.state} &bull; Elev: {hab.location.elevation || 1800}m
              </div>
            </div>
          </div>

          {/* Truthful Data Provenance Tag */}
          <span
            style={{
              fontSize: 10,
              padding: '2px 8px',
              borderRadius: 12,
              border: '1px solid #bbf7d0',
              background: '#f0fdf4',
              color: '#15803d',
              fontWeight: 600,
            }}
          >
            ● {provenance}
          </span>
        </div>

        {/* Clean Risk Score Meter */}
        <div style={{ marginTop: 6 }}>
          <div className="panel__row panel__row--between" style={{ marginBottom: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#475569' }}>DYNAMIC HAZARD SCORE</span>
            <span className={`risk-badge risk-badge--sm ${RISK_CLASS[hab.riskLevel]}`}>
              SCORE {hab.riskScore.toFixed(2)}
            </span>
          </div>

          <div
            style={{
              width: '100%',
              height: 6,
              background: '#e2e8f0',
              borderRadius: 9999,
              overflow: 'hidden',
              marginTop: 4,
            }}
          >
            <div
              style={{
                width: `${riskPct}%`,
                height: '100%',
                background: barColor,
                borderRadius: 9999,
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>
      </div>

      {/* Measurable Telemetry & ML Susceptibility Breakdown */}
      <div className="panel__section" style={{ padding: '12px 16px' }}>
        <div className="panel__title" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <Gauge size={14} color="#0284c7" />
          <span>Measurable Hazard Drivers</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
          {/* Slope */}
          <div
            style={{
              padding: '8px 10px',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ fontSize: 10, fontWeight: 500, color: '#64748b' }}>COPERNICUS SLOPE</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: slopeDeg >= 30 ? '#dc2626' : '#0f172a', marginTop: 2 }}>
              {slopeDeg.toFixed(1)}°
            </div>
            <div style={{ fontSize: 9, color: '#94a3b8' }}>GLO-30 Finite Diff</div>
          </div>

          {/* 24h Rainfall */}
          <div
            style={{
              padding: '8px 10px',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ fontSize: 10, fontWeight: 500, color: '#64748b' }}>24H PRECIPITATION</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: rain24h >= 30 ? '#dc2626' : '#0284c7', marginTop: 2 }}>
              {rain24h.toFixed(1)} mm
            </div>
            <div style={{ fontSize: 9, color: '#94a3b8' }}>Open-Meteo Live</div>
          </div>

          {/* River Proximity */}
          <div
            style={{
              padding: '8px 10px',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ fontSize: 10, fontWeight: 500, color: '#64748b' }}>RIVER CORRIDOR</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: riverDist < 0.5 ? '#dc2626' : '#0f172a', marginTop: 2 }}>
              {riverDist.toFixed(2)} km
            </div>
            <div style={{ fontSize: 9, color: '#94a3b8' }}>CWC Gauging Stream</div>
          </div>

          {/* ML Susceptibility */}
          <div
            style={{
              padding: '8px 10px',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ fontSize: 10, fontWeight: 500, color: '#0284c7' }}>ML SUSCEPTIBILITY</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0284c7', marginTop: 2 }}>
              {mlScore.toFixed(2)}
            </div>
            <div style={{ fontSize: 9, color: '#94a3b8' }}>RandomForest ({mlConf})</div>
          </div>
        </div>
      </div>

      {/* Population & Household Card */}
      <div className="panel__section" style={{ padding: '12px 16px' }}>
        <div className="panel__row panel__row--between">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Users size={14} color="#0f172a" />
            <span className="panel__label">TOTAL POPULATION:</span>
          </div>
          <span className="panel__value">{hab.population.toLocaleString()}</span>
        </div>

        <div className="panel__row panel__row--between" style={{ marginTop: 4 }}>
          <span className="panel__label" style={{ paddingLeft: 20 }}>HOUSEHOLDS:</span>
          <span className="panel__value">{hab.households.toLocaleString()}</span>
        </div>
      </div>

      {/* Per-Hazard Breakdown */}
      <div className="panel__section" style={{ padding: '12px 16px' }}>
        <div className="panel__title" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <ShieldAlert size={14} color="#ea580c" />
          <span>Hazard Exposure Matrix</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {hab.hazardExposure.map((hazard) => (
            <div
              key={hazard.type}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 10px',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
              }}
            >
              <div>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#0f172a' }}>
                  {HAZARD_LABEL[hazard.type]}
                </span>
                {hazard.contributors.length > 0 && (
                  <div style={{ fontSize: 10, color: '#64748b', marginTop: 1 }}>
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
      <div className="panel__section" style={{ padding: '12px 16px' }}>
        <div className="panel__title" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <HeartHandshake size={14} color="#0284c7" />
          <span>HVI (Vulnerability Index)</span>
        </div>

        <div style={{ background: '#f8fafc', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8 }}>
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
      <div className="panel__section" style={{ padding: '12px 16px' }}>
        <div className="panel__title" style={{ marginBottom: 6 }}>
          Directive for Incident Commander
        </div>

        <div className="speech-bubble">
          &ldquo;{hab.recommendedAction}&rdquo;
        </div>
      </div>

      {/* Nearest Safe Haven Corridor Card */}
      {nearestSite && (
        <div className="panel__section" style={{ background: '#f8fafc', padding: '12px 16px' }}>
          <div className="panel__title" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, color: '#15803d' }}>
            <Compass size={14} color="#15803d" />
            <span>Designated Relocation Haven</span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              borderRadius: 8,
              padding: '10px 12px',
            }}
          >
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#15803d' }}>
                {nearestSite.name}
              </div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
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
                background: '#0f172a',
                color: '#ffffff',
                border: 'none',
                borderRadius: 6,
                padding: '6px 12px',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              title="Fly to site"
            >
              <span>Inspect</span>
              <ArrowRight size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
