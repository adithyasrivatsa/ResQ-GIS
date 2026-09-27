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
      <div className="panel__section" style={{ background: '#f0fdf4', paddingBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Layers size={18} color="#166534" />
          <div>
            <div style={{ fontFamily: 'Silkscreen', fontSize: 13, fontWeight: 700, color: '#166534' }}>
              GIS LAYER STACK
            </div>
            <div style={{ fontFamily: 'Space Mono', fontSize: 9, color: '#64748b' }}>
              TOGGLE ACTIVE GEOGRAPHIC OVERLAYS
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '10px 14px' }}>
        {categories.map((cat) => (
          <div key={cat} style={{ marginBottom: 14 }}>
            <div
              style={{
                fontFamily: 'Silkscreen',
                fontSize: 9,
                fontWeight: 700,
                color: '#475569',
                marginBottom: 6,
                letterSpacing: 0.5,
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
                      background: layer.visible ? 'var(--retro-purple-soft)' : '#ffffff',
                      border: '2px solid #000000',
                      boxShadow: layer.visible ? '3px 3px 0px #000000' : '2px 2px 0px #000000',
                      borderRadius: 6,
                      padding: '8px 10px',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {layer.visible ? (
                        <div
                          style={{
                            width: 20,
                            height: 20,
                            background: 'var(--retro-purple)',
                            color: '#fff',
                            borderRadius: 4,
                            border: '1px solid #000',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Eye size={12} />
                        </div>
                      ) : (
                        <div
                          style={{
                            width: 20,
                            height: 20,
                            background: '#e2e8f0',
                            color: '#64748b',
                            borderRadius: 4,
                            border: '1px solid #000',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <EyeOff size={12} />
                        </div>
                      )}
                      <span
                        style={{
                          fontFamily: 'Space Mono',
                          fontSize: 10,
                          fontWeight: 700,
                          color: layer.visible ? '#000' : '#64748b',
                        }}
                      >
                        {layer.name}
                      </span>
                    </div>

                    <span
                      style={{
                        fontFamily: 'Silkscreen',
                        fontSize: 8,
                        background: layer.visible ? 'var(--retro-green)' : '#cbd5e1',
                        color: layer.visible ? '#000' : '#475569',
                        padding: '1px 5px',
                        border: '1px solid #000',
                        borderRadius: 3,
                      }}
                    >
                      {layer.visible ? 'ON' : 'OFF'}
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
