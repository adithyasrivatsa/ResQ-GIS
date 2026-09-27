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
      <div className="panel__section" style={{ background: '#f8fafc', padding: '14px 16px', borderBottom: '1px solid #e2e8f0' }}>
        <div className="panel__row panel__row--between" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 32,
                height: 32,
                background: '#f1f5f9',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#0f172a',
              }}
            >
              <Trophy size={16} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                TOPSIS Leaderboard
              </div>
              <div style={{ fontSize: 11, color: '#64748b' }}>
                Multi-Criteria Evacuation Staging
              </div>
            </div>
          </div>

          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              background: weightsOpen ? '#0f172a' : '#ffffff',
              color: weightsOpen ? '#ffffff' : '#334155',
              border: '1px solid #e2e8f0',
              padding: '5px 10px',
              borderRadius: 8,
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onClick={() => setWeightsOpen(!weightsOpen)}
          >
            <Sliders size={12} />
            <span>{weightsOpen ? 'Close' : 'Weights'}</span>
          </button>
        </div>
      </div>

      {/* Dynamic Weight Sliders Drawer */}
      {weightsOpen && (
        <div className="panel__section" style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', padding: '12px 16px' }}>
          <div className="panel__row panel__row--between" style={{ marginBottom: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#475569' }}>DECISION CRITERIA WEIGHTS</span>
            <button
              onClick={handleResetWeights}
              style={{
                background: 'none',
                border: 'none',
                color: '#0284c7',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <RotateCcw size={11} />
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
                  <span style={{ color: '#334155', fontWeight: 500 }}>{slider.label}:</span>
                  <span
                    style={{
                      background: '#f1f5f9',
                      color: '#0f172a',
                      padding: '2px 6px',
                      borderRadius: 4,
                      fontWeight: 600,
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
                  style={{ width: '100%', height: 4, marginTop: 2, accentColor: '#0f172a' }}
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
              ? '#fef2f2'
              : item.rank === 2
              ? '#fffbeb'
              : '#f1f5f9';
          const rankBadgeColor =
            item.rank === 1
              ? '#b91c1c'
              : item.rank === 2
              ? '#b45309'
              : '#475569';
          const rankBadgeBorder =
            item.rank === 1
              ? '#fecaca'
              : item.rank === 2
              ? '#fde68a'
              : '#e2e8f0';

          return (
            <div
              key={item.habitationId}
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                borderRadius: 10,
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                transition: 'all 0.15s ease',
              }}
            >
              {/* Card Header */}
              <div className="panel__row panel__row--between" style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '3px 8px',
                      background: rankBadgeBg,
                      color: rankBadgeColor,
                      border: `1px solid ${rankBadgeBorder}`,
                      borderRadius: 6,
                    }}
                  >
                    #{item.rank}
                  </span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
                      {item.name}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>
                      {item.district} &bull; Pop: {item.population.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 9, fontWeight: 500, color: '#64748b' }}>TOPSIS SCORE</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0284c7' }}>
                    {item.score.toFixed(3)}
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div style={{ width: '100%', height: 4, background: '#f1f5f9', borderRadius: 9999, overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${Math.min(item.score * 100, 100)}%`,
                    height: '100%',
                    background: item.score >= 0.7 ? '#ef4444' : item.score >= 0.4 ? '#f59e0b' : '#0284c7',
                    borderRadius: 9999,
                  }}
                />
              </div>

              {/* Factor reasoning */}
              <div style={{ fontSize: 11, color: '#475569', lineHeight: 1.4 }}>
                <strong>Factors:</strong> {item.reason}
              </div>

              {/* Action Button */}
              {site && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: 6,
                    padding: '6px 10px',
                    marginTop: 2,
                  }}
                >
                  <div style={{ fontSize: 11, color: '#64748b' }}>
                    Haven: <strong style={{ color: '#0f172a' }}>{site.name}</strong> ({site.distanceFromAffected} km)
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
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: 6,
                      padding: '3px 8px',
                      fontSize: 10,
                      fontWeight: 600,
                      color: '#0f172a',
                      cursor: 'pointer',
                    }}
                  >
                    <span>View</span>
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
