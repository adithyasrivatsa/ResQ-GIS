import { Eye, EyeOff, Layers } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

const CATEGORY_LABELS: Record<string, string> = {
  base: 'Base Terrain & Maps',
  hazard: 'Hazard Overlays (ISRO / GSI)',
  infrastructure: 'Transport & Evacuation Corridors',
  operational: 'Operational Zones',
};

export default function LayerPanel() {
  const { layers, toggleLayer } = useAppStore();
  const categories = [...new Set(layers.map((l) => l.category || 'hazard'))];

  return (
    <div className="panel">
      {/* Header */}
      <div className="panel__section" style={{ background: 'var(--bg-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              background: 'var(--accent-blue-subtle)',
              border: '1px solid var(--accent-blue)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-blue)',
            }}
          >
            <Layers size={18} strokeWidth={2} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
              GIS Layer Stack
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Geographic spatial data overlays
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '14px 16px', overflowY: 'auto' }}>
        {categories.map((cat) => (
          <div key={cat} style={{ marginBottom: 16 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: 'var(--text-muted)',
                marginBottom: 8,
                letterSpacing: '0.4px',
                textTransform: 'uppercase',
              }}
            >
              {CATEGORY_LABELS[cat] || (cat ? cat.toUpperCase() : 'OVERLAYS')}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {layers
                .filter((l) => (l.category || 'hazard') === cat)
                .map((layer) => (
                  <button
                    key={layer.id}
                    onClick={() => toggleLayer(layer.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: layer.visible ? 'var(--accent-blue-subtle)' : 'var(--bg-surface)',
                      border: layer.visible ? '1px solid var(--accent-blue)' : '1px solid var(--border-color)',
                      boxShadow: 'var(--shadow-xs)',
                      borderRadius: 'var(--radius-md)',
                      padding: '8px 12px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div
                        style={{
                          width: 24,
                          height: 24,
                          background: layer.visible ? 'var(--accent-blue)' : 'var(--bg-subtle)',
                          border: '1px solid var(--border-color)',
                          color: layer.visible ? '#ffffff' : 'var(--text-muted)',
                          borderRadius: 'var(--radius-xs)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {layer.visible ? <Eye size={13} strokeWidth={2} /> : <EyeOff size={13} strokeWidth={2} />}
                      </div>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: layer.visible ? 'var(--accent-blue)' : 'var(--text-primary)',
                        }}
                      >
                        {layer.name}
                      </span>
                    </div>

                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        background: layer.visible ? 'var(--accent-emerald-subtle)' : 'var(--bg-subtle)',
                        color: layer.visible ? 'var(--accent-emerald)' : 'var(--text-muted)',
                        border: '1px solid var(--border-color)',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-pill)',
                        textTransform: 'uppercase',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {layer.visible ? 'Active' : 'Hidden'}
                    </span>
                  </button>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
