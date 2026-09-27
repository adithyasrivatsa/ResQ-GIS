import { Eye, EyeOff, Layers } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

const CATEGORY_LABELS: Record<string, string> = {
  base: 'BASE TERRAIN & MAPS',
  hazard: 'HAZARD OVERLAYS (ISRO/GSI)',
  infrastructure: 'TRANSPORT & EVAC CORRIDORS',
  operational: 'OPERATIONAL ZONES',
};

export default function LayerPanel() {
  const { layers, toggleLayer } = useAppStore();
  const categories = [...new Set(layers.map((l) => l.category || 'hazard'))];

  return (
    <div className="panel">
      {/* Header */}
      <div className="panel__section" style={{ background: 'var(--nb-canvas-subtle)', padding: '14px 16px', borderBottom: '2.5px solid #000000' }}>
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
            <Layers size={18} strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 900, color: '#000000', textTransform: 'uppercase' }}>
              GIS Layer Stack
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#525252' }}>
              Toggle Active Geographic Overlays
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '14px 16px' }}>
        {categories.map((cat) => (
          <div key={cat} style={{ marginBottom: 16 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 900,
                color: '#000000',
                marginBottom: 8,
                letterSpacing: '0.2px',
                textTransform: 'uppercase',
              }}
            >
              {CATEGORY_LABELS[cat] || (cat ? cat.toUpperCase() : 'OVERLAYS')}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
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
                      background: layer.visible ? 'var(--nb-mint-light)' : '#ffffff',
                      border: '2px solid #000000',
                      boxShadow: layer.visible ? '3px 3px 0px #000000' : '2px 2px 0px #000000',
                      borderRadius: 8,
                      padding: '9px 12px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.1s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!layer.visible) e.currentTarget.style.background = 'var(--nb-canvas-subtle)';
                    }}
                    onMouseLeave={(e) => {
                      if (!layer.visible) e.currentTarget.style.background = '#ffffff';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div
                        style={{
                          width: 26,
                          height: 26,
                          background: layer.visible ? 'var(--nb-mint)' : '#f4f4f5',
                          border: '1.5px solid #000000',
                          color: '#000000',
                          borderRadius: 6,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.1s ease',
                        }}
                      >
                        {layer.visible ? <Eye size={14} strokeWidth={2.5} /> : <EyeOff size={14} strokeWidth={2.5} />}
                      </div>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 800,
                          color: '#000000',
                        }}
                      >
                        {layer.name}
                      </span>
                    </div>

                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 800,
                        background: layer.visible ? 'var(--nb-yellow)' : '#f4f4f5',
                        color: '#000000',
                        border: '1.5px solid #000000',
                        boxShadow: '1px 1px 0px #000000',
                        padding: '2px 8px',
                        borderRadius: 6,
                        textTransform: 'uppercase',
                        transition: 'all 0.1s ease',
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
