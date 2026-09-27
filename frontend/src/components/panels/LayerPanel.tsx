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
      <div className="panel__section" style={{ background: '#f8fafc', padding: '14px 16px', borderBottom: '1px solid #e2e8f0' }}>
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
            <Layers size={16} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
              GIS Layer Stack
            </div>
            <div style={{ fontSize: 11, color: '#64748b' }}>
              Toggle Active Geographic Overlays
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '12px 16px' }}>
        {categories.map((cat) => (
          <div key={cat} style={{ marginBottom: 16 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: '#64748b',
                marginBottom: 8,
                letterSpacing: '0.4px',
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
                      background: layer.visible ? '#f0f9ff' : '#ffffff',
                      border: `1px solid ${layer.visible ? '#bae6fd' : '#e2e8f0'}`,
                      boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                      borderRadius: 8,
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
                          background: layer.visible ? '#0284c7' : '#f1f5f9',
                          color: layer.visible ? '#ffffff' : '#94a3b8',
                          borderRadius: 6,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {layer.visible ? <Eye size={13} /> : <EyeOff size={13} />}
                      </div>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: layer.visible ? 600 : 500,
                          color: layer.visible ? '#0f172a' : '#64748b',
                        }}
                      >
                        {layer.name}
                      </span>
                    </div>

                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        background: layer.visible ? '#e0f2fe' : '#f1f5f9',
                        color: layer.visible ? '#0369a1' : '#64748b',
                        padding: '2px 8px',
                        borderRadius: 12,
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
