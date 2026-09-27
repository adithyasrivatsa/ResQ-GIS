import { useState } from 'react';
import { Sliders, ArrowRight, RotateCcw, Trophy } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { flyToHabitation } from '../../cesium/camera';

export default function AnalysisPanel() {
  const { prioritizationResults, calculatePrioritization, selectHabitation, habitations, relocationSites } =
    useAppStore();

  const [weightsOpen, setWeightsOpen] = useState(false);
  const [weights, setWeights] = useState({
    hvi: 0.25,
    hazard: 0.20,
    population: 0.20,
    historical: 0.10,
    structural: 0.15,
    feasibility: 0.10,
  });

  const handleWeightChange = (key: keyof typeof weights, val: number) => {
    const updated = { ...weights, [key]: val };
    setWeights(updated);
    calculatePrioritization(updated);
  };

  const handleResetWeights = () => {
    const def = {
      hvi: 0.25,
      hazard: 0.20,
      population: 0.20,
      historical: 0.10,
      structural: 0.15,
      feasibility: 0.10,
    };
    setWeights(def);
    calculatePrioritization(def);
  };

  return (
    <div className="panel">
      {/* Header Banner */}
      <div className="panel__section" style={{ background: 'var(--nb-canvas-subtle)', padding: '14px 16px', borderBottom: '2.5px solid #000000' }}>
        <div className="panel__row panel__row--between" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                background: 'var(--nb-yellow)',
                border: '2px solid #000000',
                boxShadow: '2px 2px 0px #000000',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#000000',
              }}
            >
              <Trophy size={18} strokeWidth={2.5} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 900, color: '#000000', textTransform: 'uppercase' }}>
                TOPSIS Leaderboard
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#525252' }}>
                Multi-Criteria Evacuation Staging
              </div>
            </div>
          </div>

          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              background: weightsOpen ? 'var(--nb-mint)' : '#ffffff',
              color: '#000000',
              border: '2px solid #000000',
              boxShadow: '2px 2px 0px #000000',
              padding: '6px 12px',
              borderRadius: 8,
              fontSize: 11,
              fontWeight: 800,
              textTransform: 'uppercase',
              cursor: 'pointer',
              transition: 'all 0.1s ease',
            }}
            onClick={() => setWeightsOpen(!weightsOpen)}
          >
            <Sliders size={13} strokeWidth={2.5} />
            <span>{weightsOpen ? 'Close' : 'Weights'}</span>
          </button>
        </div>
      </div>

      {/* Dynamic Weight Sliders Drawer */}
      {weightsOpen && (
        <div className="panel__section" style={{ background: 'var(--nb-canvas-subtle)', borderBottom: '2px solid #000000', padding: '14px 16px' }}>
          <div className="panel__row panel__row--between" style={{ marginBottom: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#000000', textTransform: 'uppercase' }}>DECISION CRITERIA WEIGHTS</span>
            <button
              onClick={handleResetWeights}
              style={{
                background: 'none',
                border: 'none',
                color: '#000000',
                fontSize: 11,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                textDecoration: 'underline',
              }}
            >
              <RotateCcw size={11} strokeWidth={2.5} />
              <span>Reset</span>
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'Vulnerability (HVI)', key: 'hvi', val: weights.hvi },
              { label: 'Hazard Exposure', key: 'hazard', val: weights.hazard },
              { label: 'Population Exposed', key: 'population', val: weights.population },
              { label: 'Structural Fragility', key: 'structural', val: weights.structural },
            ].map((slider) => (
              <div key={slider.key}>
                <div className="panel__row panel__row--between" style={{ fontSize: 11, marginBottom: 2 }}>
                  <span style={{ color: '#000000', fontWeight: 800 }}>{slider.label}:</span>
                  <span
                    style={{
                      background: 'var(--nb-yellow)',
                      color: '#000000',
                      border: '1.5px solid #000000',
                      boxShadow: '1px 1px 0px #000000',
                      padding: '2px 6px',
                      borderRadius: 4,
                      fontWeight: 800,
                      fontSize: 10,
                    }}
                  >
                    {(slider.val * 100).toFixed(0)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="0.50"
                  step="0.05"
                  value={slider.val}
                  onChange={(e) => handleWeightChange(slider.key as any, parseFloat(e.target.value))}
                  style={{ width: '100%', height: 6, marginTop: 4, accentColor: '#000000' }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ranked List */}
      <div className="panel__list">
        {prioritizationResults.map((item) => {
          const hab = habitations.find((h) => h.id === item.habitationId);
          const site = relocationSites.find((s) => s.id === item.nearestRelocationSite);

          const rankBadgeBg =
            item.rank === 1
              ? 'var(--nb-pink)'
              : item.rank === 2
              ? 'var(--nb-orange)'
              : 'var(--nb-yellow)';
          const rankBadgeColor = item.rank === 1 ? '#ffffff' : '#000000';

          return (
            <div
              key={item.habitationId}
              style={{
                background: '#ffffff',
                border: '2px solid #000000',
                boxShadow: '3px 3px 0px #000000',
                borderRadius: 8,
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                transition: 'all 0.1s ease',
              }}
            >
              {/* Card Header */}
              <div className="panel__row panel__row--between" style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 900,
                      padding: '3px 8px',
                      background: rankBadgeBg,
                      color: rankBadgeColor,
                      border: '1.5px solid #000000',
                      boxShadow: '1.5px 1.5px 0px #000000',
                      borderRadius: 6,
                    }}
                  >
                    #{item.rank}
                  </span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 900, color: '#000000' }}>
                      {item.name}
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#525252' }}>
                      {item.district} &bull; Pop: {item.population.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 9, fontWeight: 800, color: '#525252', textTransform: 'uppercase' }}>TOPSIS SCORE</div>
                  <div style={{ fontSize: 15, fontWeight: 900, color: '#000000', fontFamily: 'var(--font-mono)' }}>
                    {item.score.toFixed(3)}
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div style={{ width: '100%', height: 8, background: '#ffffff', border: '1.5px solid #000000', borderRadius: 9999, overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${Math.min(item.score * 100, 100)}%`,
                    height: '100%',
                    background: item.score >= 0.7 ? 'var(--nb-pink)' : item.score >= 0.4 ? 'var(--nb-orange)' : 'var(--nb-mint)',
                    borderRight: '1.5px solid #000000',
                  }}
                />
              </div>

              {/* Factor reasoning */}
              <div style={{ fontSize: 11, color: '#000000', fontWeight: 600, lineHeight: 1.4 }}>
                <strong>Factors:</strong> {item.reason}
              </div>

              {/* Action Button */}
              {site && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'var(--nb-canvas-subtle)',
                    border: '1.5px solid #000000',
                    borderRadius: 6,
                    padding: '8px 10px',
                    marginTop: 2,
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#525252' }}>
                    Haven: <strong style={{ color: '#000000' }}>{site.name}</strong> ({site.distanceFromAffected} km)
                  </div>
                  <button
                    onClick={() => {
                      selectHabitation(item.habitationId);
                      if (hab) flyToHabitation(hab.location.lng, hab.location.lat);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      background: 'var(--nb-yellow)',
                      border: '1.5px solid #000000',
                      boxShadow: '1.5px 1.5px 0px #000000',
                      borderRadius: 6,
                      padding: '4px 10px',
                      fontSize: 10,
                      fontWeight: 800,
                      color: '#000000',
                      cursor: 'pointer',
                      transition: 'all 0.1s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--nb-mint)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--nb-yellow)')}
                  >
                    <span>View</span>
                    <ArrowRight size={11} strokeWidth={2.5} />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
