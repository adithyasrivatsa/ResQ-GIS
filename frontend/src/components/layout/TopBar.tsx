import { useState, useRef, useEffect } from 'react';
import {
  FolderKanban,
  ChevronDown,
  Plus,
  Radio,
  Sun,
  Moon,
  Layers,
  Globe,
  Check,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { flyToDistrict } from '../../cesium/camera';

export default function TopBar() {
  const {
    theme,
    toggleTheme,
    mapMode,
    setMapMode,
    backendConnected,
    alerts,
    workspaces,
    activeWorkspaceId,
    setActiveWorkspaceId,
    addWorkspace,
    isSurveillanceActive,
    toggleSurveillance,
    selectedDistrict,
    setSelectedDistrict,
    selectedBlock,
    setSelectedBlock,
    selectedHazardType,
    setSelectedHazardType,
    setActiveNav,
  } = useAppStore();

  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
  const [newWorkspaceModalOpen, setNewWorkspaceModalOpen] = useState(false);
  const [newWsName, setNewWsName] = useState('');
  const [newWsDistrict, setNewWsDistrict] = useState('Chamoli');
  const [newWsDescription, setNewWsDescription] = useState('');
  const workspaceDropdownRef = useRef<HTMLDivElement>(null);

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];
  const topAlert = alerts[0];

  // Close workspace dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        workspaceDropdownRef.current &&
        !workspaceDropdownRef.current.contains(event.target as Node)
      ) {
        setWorkspaceMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCreateWorkspace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWsName.trim()) return;

    const newWs = {
      id: `ws-${Date.now()}`,
      name: newWsName.trim(),
      district: newWsDistrict,
      description: newWsDescription.trim() || 'Custom operational monitoring sector',
      color: '#3b82f6',
      habitationsCount: 5,
      safeSitesCount: 2,
      priority: 'HIGH' as const,
      surveillanceZones: [],
      createdAt: new Date().toISOString().slice(0, 10),
    };

    addWorkspace(newWs);
    setActiveWorkspaceId(newWs.id);
    setSelectedDistrict(newWsDistrict);
    flyToDistrict(newWsDistrict);
    setNewWsName('');
    setNewWsDescription('');
    setNewWorkspaceModalOpen(false);
    setWorkspaceMenuOpen(false);
  };

  const handleDistrictChange = (dist: string) => {
    setSelectedDistrict(dist);
    flyToDistrict(dist);
  };

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 52,
        padding: '0 12px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
        gap: 12,
        flexShrink: 0,
        zIndex: 50,
      }}
    >
      {/* 1. Brand Logo + Version + Workspace Dropdown */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #2563eb, #4f46e5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: 16,
              boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)',
            }}
          >
            ▲
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 15,
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.3px',
                }}
              >
                ResQ-GIS
              </span>
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  padding: '1px 5px',
                  borderRadius: 'var(--radius-pill)',
                  background: 'var(--accent-blue-subtle)',
                  color: 'var(--accent-blue)',
                  letterSpacing: '0.2px',
                }}
              >
                PRO
              </span>
            </div>
          </div>
        </div>

        {/* Vertical Divider */}
        <div style={{ width: 1, height: 24, background: 'var(--border-color)' }} />

        {/* Workspace Folder Dropdown */}
        <div ref={workspaceDropdownRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setWorkspaceMenuOpen(!workspaceMenuOpen)}
            className="btn-action"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              padding: '5px 10px',
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--text-primary)',
            }}
          >
            <FolderKanban size={14} color="var(--accent-indigo)" />
            <span style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {activeWorkspace?.name || 'Workspace'}
            </span>
            <ChevronDown size={13} color="var(--text-muted)" />
          </button>

          {/* Dropdown Menu */}
          {workspaceMenuOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                left: 0,
                width: 280,
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-lg)',
                padding: '6px',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                zIndex: 100,
              }}
            >
              <div
                style={{
                  padding: '6px 8px',
                  fontSize: 10,
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Regional Workspaces & Folders
              </div>

              {workspaces.map((ws) => {
                const isSelected = ws.id === activeWorkspaceId;
                return (
                  <button
                    key={ws.id}
                    onClick={() => {
                      setActiveWorkspaceId(ws.id);
                      setWorkspaceMenuOpen(false);
                      flyToDistrict(ws.district);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      background: isSelected ? 'var(--accent-blue-subtle)' : 'transparent',
                      border: '1px solid',
                      borderColor: isSelected ? 'var(--accent-blue)' : 'transparent',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 0.12s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.background = 'var(--bg-hover)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 14 }}>📁</span>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
                          {ws.name}
                        </div>
                        <div style={{ fontSize: 10, fontWeight: 500, color: 'var(--text-muted)' }}>
                          {ws.district} &bull; {ws.habitationsCount} sectors
                        </div>
                      </div>
                    </div>
                    {isSelected && <Check size={14} color="var(--accent-blue)" strokeWidth={2.5} />}
                  </button>
                );
              })}

              <div style={{ height: 1, background: 'var(--border-color)', margin: '4px 0' }} />

              <button
                onClick={() => {
                  setNewWorkspaceModalOpen(true);
                  setWorkspaceMenuOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 10px',
                  background: 'var(--bg-subtle)',
                  border: '1px dashed var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--accent-blue)',
                  cursor: 'pointer',
                }}
              >
                <Plus size={14} />
                <span>Create New Workspace Folder</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. Unified Filter Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'nowrap' }}>
        {/* District Select */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>District</span>
          <select
            value={selectedDistrict}
            onChange={(e) => handleDistrictChange(e.target.value)}
            style={{
              padding: '4px 8px',
              fontFamily: 'var(--font-sans)',
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--text-primary)',
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="Chamoli">Chamoli</option>
            <option value="Rudraprayag">Rudraprayag</option>
            <option value="Pithoragarh">Pithoragarh</option>
            <option value="Uttarkashi">Uttarkashi</option>
          </select>
        </div>

        {/* Block Select */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>Block</span>
          <select
            value={selectedBlock ?? 'all'}
            onChange={(e) => setSelectedBlock(e.target.value === 'all' ? null : e.target.value)}
            style={{
              padding: '4px 8px',
              fontFamily: 'var(--font-sans)',
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--text-primary)',
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="all">All Blocks</option>
            <option value="Joshimath">Joshimath</option>
            <option value="Dasholi">Dasholi</option>
            <option value="Ghat">Ghat</option>
            <option value="Ukhimath">Ukhimath</option>
          </select>
        </div>

        {/* Hazard Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>Hazard</span>
          <select
            value={selectedHazardType ?? 'all'}
            onChange={(e) => setSelectedHazardType(e.target.value === 'all' ? null : (e.target.value as any))}
            style={{
              padding: '4px 8px',
              fontFamily: 'var(--font-sans)',
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--text-primary)',
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="all">All Hazards</option>
            <option value="landslide">Landslide</option>
            <option value="flood">Riverine Flood</option>
            <option value="glof">GLOF</option>
            <option value="earthquake">Seismic Risk</option>
          </select>
        </div>

        {/* Live Alert Ticker Pill */}
        {topAlert && (
          <button
            onClick={() => setActiveNav('alerts')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: topAlert.severity === 'red' ? 'var(--accent-rose-subtle)' : 'var(--accent-amber-subtle)',
              border: `1px solid ${topAlert.severity === 'red' ? 'rgba(244, 63, 94, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
              padding: '3px 10px',
              borderRadius: 'var(--radius-pill)',
              cursor: 'pointer',
              marginLeft: 4,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: topAlert.severity === 'red' ? 'var(--accent-rose)' : 'var(--accent-amber)',
                boxShadow: `0 0 6px ${topAlert.severity === 'red' ? 'var(--accent-rose)' : 'var(--accent-amber)'}`,
              }}
            />
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: topAlert.severity === 'red' ? 'var(--accent-rose)' : 'var(--accent-amber)',
                whiteSpace: 'nowrap',
              }}
            >
              {topAlert.eventType || 'Active Warning'}: {topAlert.area ? topAlert.area.split(',')[0] : 'Regional'}
            </span>
          </button>
        )}
      </div>

      {/* 3. Action Tools: Surveillance, Map Mode, Telemetry & Theme */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Surveillance Mode Toggle Button */}
        <button
          onClick={() => {
            toggleSurveillance();
            if (!isSurveillanceActive) {
              setActiveNav('surveillance');
            }
          }}
          className="btn-action"
          style={{
            background: isSurveillanceActive ? 'var(--accent-rose)' : 'var(--bg-surface)',
            color: isSurveillanceActive ? '#ffffff' : 'var(--text-primary)',
            borderColor: isSurveillanceActive ? 'var(--accent-rose)' : 'var(--border-color)',
            boxShadow: isSurveillanceActive ? '0 0 10px rgba(244, 63, 94, 0.3)' : 'var(--shadow-xs)',
          }}
          title="Toggle Surveillance AOI Tool"
        >
          <Radio size={13} className={isSurveillanceActive ? 'pulse' : ''} />
          <span>{isSurveillanceActive ? 'Monitoring Zone Active' : 'Mark Surveillance'}</span>
        </button>

        {/* 2D / 3D Map Switcher */}
        <div
          style={{
            display: 'flex',
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: 2,
          }}
        >
          <button
            onClick={() => setMapMode('2d')}
            style={{
              padding: '3px 8px',
              fontSize: 11,
              fontWeight: 700,
              background: mapMode === '2d' ? 'var(--bg-surface)' : 'transparent',
              color: mapMode === '2d' ? 'var(--accent-blue)' : 'var(--text-muted)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              boxShadow: mapMode === '2d' ? 'var(--shadow-xs)' : 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Layers size={12} />
            <span>2D GIS</span>
          </button>
          <button
            onClick={() => setMapMode('3d')}
            style={{
              padding: '3px 8px',
              fontSize: 11,
              fontWeight: 700,
              background: mapMode === '3d' ? 'var(--bg-surface)' : 'transparent',
              color: mapMode === '3d' ? 'var(--accent-blue)' : 'var(--text-muted)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              boxShadow: mapMode === '3d' ? 'var(--shadow-xs)' : 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Globe size={12} />
            <span>3D Cesium</span>
          </button>
        </div>

        {/* Telemetry Status Pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: '4px 8px',
            background: backendConnected ? 'var(--accent-emerald-subtle)' : 'var(--accent-amber-subtle)',
            border: `1px solid ${backendConnected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
            borderRadius: 'var(--radius-pill)',
            fontSize: 10,
            fontWeight: 700,
            color: backendConnected ? 'var(--accent-emerald)' : 'var(--accent-amber)',
          }}
          title={backendConnected ? 'FastAPI & Live Government Ingestion active' : 'Offline simulation'}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: backendConnected ? 'var(--accent-emerald)' : 'var(--accent-amber)',
            }}
          />
          <span>{backendConnected ? 'Live Synced' : 'Demo Mode'}</span>
        </div>

        {/* Dark/Light Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="btn-action"
          style={{ padding: '6px 8px' }}
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
        >
          {theme === 'light' ? <Moon size={14} /> : <Sun size={14} color="#fde047" />}
        </button>
      </div>

      {/* New Workspace Creation Modal */}
      {newWorkspaceModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--shadow-lg)',
              padding: 20,
              width: 380,
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FolderKanban size={18} color="var(--accent-blue)" />
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>
                Create Operational Workspace
              </div>
            </div>

            <form onSubmit={handleCreateWorkspace} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  Workspace / Sector Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Joshimath Rapid Surveillance"
                  value={newWsName}
                  onChange={(e) => setNewWsName(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    fontFamily: 'var(--font-sans)',
                    fontSize: 12,
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  Assigned Administrative District
                </label>
                <select
                  value={newWsDistrict}
                  onChange={(e) => setNewWsDistrict(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    fontFamily: 'var(--font-sans)',
                    fontSize: 12,
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                  }}
                >
                  <option value="Chamoli">Chamoli</option>
                  <option value="Rudraprayag">Rudraprayag</option>
                  <option value="Pithoragarh">Pithoragarh</option>
                  <option value="Uttarkashi">Uttarkashi</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  Mission Objective & Description
                </label>
                <textarea
                  placeholder="Describe focus: subsidence tracking, flash flood, evacuation corridors..."
                  value={newWsDescription}
                  onChange={(e) => setNewWsDescription(e.target.value)}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    fontFamily: 'var(--font-sans)',
                    fontSize: 12,
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    resize: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
                <button
                  type="button"
                  onClick={() => setNewWorkspaceModalOpen(false)}
                  className="btn-action"
                  style={{ padding: '7px 14px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-action btn-action--primary"
                  style={{ padding: '7px 16px' }}
                >
                  Create Folder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
