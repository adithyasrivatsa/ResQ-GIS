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
      <div className="panel__section" style={{ background: 'var(--retro-purple-soft)', paddingBottom: 10 }}>
        <div className="panel__row panel__row--between">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Trophy size={18} color="var(--retro-purple)" />
            <div>
              <div style={{ fontFamily: 'Silkscreen', fontSize: 13, fontWeight: 700 }}>
                TOPSIS LEADERBOARD
              </div>
              <div style={{ fontFamily: 'Space Mono', fontSize: 9, color: '#64748b' }}>
                PRIORITY STAGING RANKINGS
              </div>
            </div>
          </div>

          <button
            className={`retro-btn ${weightsOpen ? 'retro-btn--purple' : ''}`}
            style={{ fontSize: 9, padding: '4px 8px' }}
            onClick={() => setWeightsOpen(!weightsOpen)}
          >
            <Sliders size={12} />
            <span>{weightsOpen ? 'CLOSE' : 'WEIGHTS'}</span>
          </button>
        </div>
      </div>

      {/* Dynamic Weight Sliders Drawer */}
      {weightsOpen && (
        <div className="panel__section" style={{ background: '#fdfbf7' }}>
          <div className="panel__row panel__row--between" style={{ marginBottom: 10 }}>
            <span style={{ fontFamily: 'Silkscreen', fontSize: 10 }}>DECISION WEIGHT SLIDERS</span>
            <button
              onClick={handleResetWeights}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--retro-purple)',
                fontFamily: 'Silkscreen',
                fontSize: 9,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <RotateCcw size={10} />
              <span>RESET</span>
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: 'Vulnerability (HVI)', key: 'hvi', val: weights.hvi, color: 'var(--retro-purple)' },
              { label: 'Hazard Exposure', key: 'hazard', val: weights.hazard, color: 'var(--retro-orange)' },
              { label: 'Population Exposed', key: 'population', val: weights.population, color: 'var(--retro-pink)' },
              { label: 'Structural Fragility', key: 'structural', val: weights.structural, color: '#0ea5e9' },
            ].map((slider) => (
              <div key={slider.key}>
                <div className="panel__row panel__row--between" style={{ fontSize: 10, fontFamily: 'Space Mono', fontWeight: 700 }}>
                  <span>{slider.label}:</span>
                  <span
                    style={{
                      fontFamily: 'Silkscreen',
                      background: slider.color,
                      color: '#fff',
                      padding: '1px 4px',
                      borderRadius: 3,
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
                  style={{ width: '100%', height: 6, marginTop: 2 }}
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

          const badgeBg =
            item.rank === 1
              ? 'var(--retro-orange)'
              : item.rank === 2
              ? 'var(--retro-yellow)'
              : item.rank === 3
              ? 'var(--retro-purple-light)'
              : '#e2e8f0';

          return (
            <div
              key={item.habitationId}
              style={{
                background: '#ffffff',
                border: '2px solid #000000',
                boxShadow: item.rank === 1 ? '4px 4px 0px #000000' : '3px 3px 0px #000000',
                borderRadius: 8,
                padding: '10px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              {/* Card Header */}
              <div className="panel__row panel__row--between">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    style={{
                      fontFamily: 'Silkscreen',
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '3px 6px',
                      background: badgeBg,
                      border: '1.5px solid #000',
                      borderRadius: 4,
                      color: '#000',
                    }}
                  >
                    #{item.rank}
                  </span>
                  <div>
                    <div style={{ fontFamily: 'Silkscreen', fontSize: 12, fontWeight: 700 }}>
                      {item.name}
                    </div>
                    <div style={{ fontFamily: 'Space Mono', fontSize: 9, color: '#64748b' }}>
                      {item.district} · Pop: {item.population.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'Space Mono', fontSize: 8, color: '#64748b' }}>TOPSIS SCORE</div>
                  <div style={{ fontFamily: 'Silkscreen', fontSize: 13, fontWeight: 700, color: 'var(--retro-purple)' }}>
                    {item.score.toFixed(3)}
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div style={{ width: '100%', height: 6, background: '#e2e8f0', border: '1px solid #000', borderRadius: 2, overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${Math.min(item.score * 100, 100)}%`,
                    height: '100%',
                    background: item.score >= 0.7 ? 'var(--retro-pink)' : item.score >= 0.4 ? 'var(--retro-orange)' : 'var(--retro-purple)',
                  }}
                />
              </div>

              {/* Factor reasoning */}
              <div style={{ fontFamily: 'Space Mono', fontSize: 9, color: '#334155', lineHeight: 1.3 }}>
                <strong>FACTORS:</strong> {item.reason}
              </div>

              {/* Action Button */}
              {site && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'var(--retro-purple-soft)',
                    border: '1.5px solid #000',
                    borderRadius: 6,
                    padding: '4px 8px',
                    marginTop: 2,
                  }}
                >
                  <div style={{ fontFamily: 'Space Mono', fontSize: 9, color: '#475569' }}>
                    HAVEN: <strong style={{ color: '#000' }}>{site.name}</strong> ({site.distanceFromAffected} km)
                  </div>
                  <button
                    className="retro-btn"
                    style={{ fontSize: 8, padding: '2px 6px' }}
                    onClick={() => {
                      selectHabitation(item.habitationId);
                      if (hab) flyToHabitation(hab.location.lng, hab.location.lat);
                    }}
                  >
                    <span>VIEW</span>
                    <ArrowRight size={10} />
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
