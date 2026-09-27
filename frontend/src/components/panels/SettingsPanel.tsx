import { useState } from 'react';
import { Settings, Sliders, Bell, RefreshCw, Check, Monitor, Database } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export default function SettingsPanel() {
  const {
    mapMode,
    setMapMode,
    loadAllData,
    setSelectedDistrict,
    setSelectedHazardType,
    terrainExaggeration,
    setTerrainExaggeration,
    autoRefreshInterval,
    setAutoRefreshInterval,
  } = useAppStore();

  const [soundAlerts, setSoundAlerts] = useState(true);
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSave = () => {
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const handleReset = () => {
    setSelectedDistrict('Chamoli');
    setSelectedHazardType(null);
    setTerrainExaggeration(1.5);
    setAutoRefreshInterval(300);
    loadAllData();
    handleSave();
  };

  return (
    <div className="panel">
      {/* Header Banner */}
      <div className="panel__section" style={{ background: 'var(--bg-subtle)' }}>
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
            <Settings size={18} strokeWidth={2} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
              System Preferences
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Operational Controls & Ingestion Settings
            </div>
          </div>
        </div>
      </div>

      <div className="panel__list" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Map Projection Setting */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-xs)',
            borderRadius: 'var(--radius-md)',
            padding: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Monitor size={15} color="var(--accent-blue)" strokeWidth={2} />
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Map Visualization Mode</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setMapMode('2d')}
              style={{
                flex: 1,
                padding: '8px',
                background: mapMode === '2d' ? 'var(--accent-blue)' : 'var(--bg-subtle)',
                color: mapMode === '2d' ? '#ffffff' : 'var(--text-secondary)',
                border: mapMode === '2d' ? '1px solid var(--accent-blue)' : '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 600,
                fontSize: 11,
                cursor: 'pointer',
                transition: 'all 0.12s ease',
              }}
            >
              2D High-Speed GIS
            </button>
            <button
              onClick={() => setMapMode('3d')}
              style={{
                flex: 1,
                padding: '8px',
                background: mapMode === '3d' ? 'var(--accent-blue)' : 'var(--bg-subtle)',
                color: mapMode === '3d' ? '#ffffff' : 'var(--text-secondary)',
                border: mapMode === '3d' ? '1px solid var(--accent-blue)' : '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 600,
                fontSize: 11,
                cursor: 'pointer',
                transition: 'all 0.12s ease',
              }}
            >
              3D Cesium Himalayan Globe
            </button>
          </div>
        </div>

        {/* 3D Vertical Exaggeration Slider */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-xs)',
            borderRadius: 'var(--radius-md)',
            padding: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sliders size={15} color="var(--accent-indigo)" strokeWidth={2} />
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>3D Relief Exaggeration</span>
            </div>
            <span
              style={{
                background: 'var(--accent-amber-subtle)',
                color: 'var(--accent-amber)',
                border: '1px solid var(--border-color)',
                padding: '2px 8px',
                borderRadius: 'var(--radius-pill)',
                fontWeight: 700,
                fontSize: 11,
              }}
            >
              {terrainExaggeration}x
            </span>
          </div>
          <input
            type="range"
            min="1.0"
            max="3.0"
            step="0.25"
            value={terrainExaggeration}
            onChange={(e) => setTerrainExaggeration(parseFloat(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--accent-blue)' }}
          />
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
            Enhances steep Himalayan gorges and valleys for visual hazard identification.
          </div>
        </div>

        {/* Telemetry Polling Frequency */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-xs)',
            borderRadius: 'var(--radius-md)',
            padding: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Database size={15} color="var(--accent-cyan)" strokeWidth={2} />
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Live Polling Frequency</span>
          </div>
          <select
            value={String(autoRefreshInterval)}
            onChange={(e) => setAutoRefreshInterval(parseInt(e.target.value, 10))}
            style={{
              width: '100%',
              padding: '6px 10px',
              fontFamily: 'var(--font-sans)',
              fontSize: 11,
              fontWeight: 500,
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-subtle)',
              color: 'var(--text-primary)',
            }}
          >
            <option value="60">Every 1 Minute (High Density)</option>
            <option value="300">Every 5 Minutes (Standard SACHET Interval)</option>
            <option value="900">Every 15 Minutes (Low Bandwidth)</option>
            <option value="0">Manual Polling Only</option>
          </select>
        </div>

        {/* Notification Sound */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-xs)',
            borderRadius: 'var(--radius-md)',
            padding: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Bell size={15} color="var(--accent-rose)" strokeWidth={2} />
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Critical Alert Sound</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Audio chime when RED alert is received</div>
            </div>
          </div>
          <input
            type="checkbox"
            checked={soundAlerts}
            onChange={(e) => setSoundAlerts(e.target.checked)}
            style={{ width: 16, height: 16, accentColor: 'var(--accent-blue)', cursor: 'pointer' }}
          />
        </div>

        {/* Actions Row */}
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <button
            onClick={handleSave}
            className="btn-action btn-action--primary"
            style={{ flex: 1, padding: '8px' }}
          >
            <Check size={14} strokeWidth={2} />
            <span>{savedNotice ? 'Saved!' : 'Apply Preferences'}</span>
          </button>

          <button
            onClick={handleReset}
            className="btn-action"
            style={{ padding: '8px 12px' }}
          >
            <RefreshCw size={13} strokeWidth={2} />
            <span>Reset Defaults</span>
          </button>
        </div>
      </div>
    </div>
  );
}
