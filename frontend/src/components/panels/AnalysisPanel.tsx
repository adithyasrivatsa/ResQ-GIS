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
      <div className="panel__section" style={{ background: 'var(--bg-subtle)' }}>
        <div className="panel__row panel__row--between">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                background: 'var(--accent-amber-subtle)',
                border: '1px solid var(--accent-amber)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-amber)',
              }}
            >
              <Trophy size={18} strokeWidth={2} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                TOPSIS Leaderboard
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Multi-Criteria Evacuation Staging
              </div>
            </div>
          </div>

          <button
            className={`btn-action ${weightsOpen ? 'btn-action--primary' : ''}`}
            onClick={() => setWeightsOpen(!weightsOpen)}
          >
            <Sliders size={13} strokeWidth={2} />
            <span>{weightsOpen ? 'Close' : 'Weights'}</span>
          </button>
        </div>
      </div>

      {/* Dynamic Weight Sliders Drawer */}
      {weightsOpen && (
        <div className="panel__section" style={{ background: 'var(--bg-subtle)' }}>
          <div className="panel__row panel__row--between" style={{ marginBottom: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Decision Criteria Weights
            </span>
            <button
              onClick={handleResetWeights}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent-blue)',
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
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{slider.label}:</span>
                  <span
                    style={{
                      background: 'var(--accent-amber-subtle)',
                      color: 'var(--accent-amber)',
                      border: '1px solid var(--border-color)',
                      padding: '1px 6px',
                      borderRadius: 'var(--radius-pill)',
                      fontWeight: 700,
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
                  style={{ width: '100%', height: 6, marginTop: 4, accentColor: 'var(--accent-blue)' }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ranked List */}
      <div className="panel__list" style={{ padding: '12px', gap: 8 }}>
        {prioritizationResults.map((item) => {
          const hab = habitations.find((h) => h.id === item.habitationId);
          const site = relocationSites.find((s) => s.id === item.nearestRelocationSite);

          const rankBadgeBg =
            item.rank === 1
              ? 'var(--accent-rose-subtle)'
              : item.rank === 2
              ? 'var(--accent-amber-subtle)'
              : 'var(--bg-subtle)';
          const rankBadgeColor =
            item.rank === 1
              ? 'var(--accent-rose)'
              : item.rank === 2
              ? 'var(--accent-amber)'
              : 'var(--text-secondary)';

          return (
            <div
              key={item.habitationId}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                boxShadow: 'var(--shadow-xs)',
                borderRadius: 'var(--radius-md)',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                transition: 'all 0.15s ease',
              }}
            >
              {/* Card Header */}
              <div className="panel__row panel__row--between">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '2px 7px',
                      background: rankBadgeBg,
                      color: rankBadgeColor,
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    #{item.rank}
                  </span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                      {item.name}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {item.district} &bull; Pop: {item.population.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>TOPSIS</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                    {item.score.toFixed(3)}
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div style={{ width: '100%', height: 6, background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-pill)', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${Math.min(item.score * 100, 100)}%`,
                    height: '100%',
                    background: item.score >= 0.7 ? 'var(--accent-rose)' : item.score >= 0.4 ? 'var(--accent-amber)' : 'var(--accent-emerald)',
                  }}
                />
              </div>

              {/* Factor reasoning */}
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                <strong>Factors:</strong> {item.reason}
              </div>

              {/* Action Button */}
              {site && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '6px 10px',
                    marginTop: 2,
                  }}
                >
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    Haven: <strong style={{ color: 'var(--text-primary)' }}>{site.name}</strong> ({site.distanceFromAffected} km)
                  </div>
                  <button
                    onClick={() => {
                      selectHabitation(item.habitationId);
                      if (hab) flyToHabitation(hab.location.lng, hab.location.lat);
                    }}
                    className="btn-action"
                    style={{ padding: '3px 8px', fontSize: 10 }}
                  >
                    <span>View</span>
                    <ArrowRight size={11} />
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
