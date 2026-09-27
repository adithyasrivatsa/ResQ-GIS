import { useState } from 'react';
import { FolderKanban, Plus } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { flyToDistrict } from '../../cesium/camera';

export default function WorkspacesPanel() {
  const {
    workspaces,
    activeWorkspaceId,
    setActiveWorkspaceId,
    addWorkspace,
    setSelectedDistrict,
  } = useAppStore();

  const [createOpen, setCreateOpen] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [folderDistrict, setFolderDistrict] = useState('Chamoli');
  const [folderDesc, setFolderDesc] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderName.trim()) return;

    const newWs = {
      id: `ws-${Date.now()}`,
      name: folderName.trim(),
      district: folderDistrict,
      description: folderDesc.trim() || 'Active regional disaster management folder',
      color: '#3b82f6',
      habitationsCount: 5,
      safeSitesCount: 2,
      priority: 'HIGH' as const,
      surveillanceZones: [],
      createdAt: new Date().toISOString().slice(0, 10),
    };

    addWorkspace(newWs);
    setActiveWorkspaceId(newWs.id);
    setSelectedDistrict(folderDistrict);
    flyToDistrict(folderDistrict);
    setFolderName('');
    setFolderDesc('');
    setCreateOpen(false);
  };

  return (
    <div className="panel">
      {/* Header */}
      <div className="panel__section" style={{ background: 'var(--bg-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 'var(--radius-md)',
                background: 'var(--accent-indigo-subtle)',
                color: 'var(--accent-indigo)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FolderKanban size={18} strokeWidth={2.5} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>
                Workspaces & Folders
              </div>
              <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)' }}>
                Regional Operations Allocation ({workspaces.length} Folders)
              </div>
            </div>
          </div>

          <button
            onClick={() => setCreateOpen(!createOpen)}
            className="btn-action btn-action--primary"
            style={{ padding: '5px 10px', fontSize: 11 }}
          >
            <Plus size={13} />
            <span>New Folder</span>
          </button>
        </div>
      </div>

      {/* Create Folder Drawer */}
      {createOpen && (
        <form
          onSubmit={handleCreate}
          style={{
            padding: '12px 14px',
            background: 'var(--bg-subtle)',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)' }}>
            NEW WORKSPACE ALLOCATION
          </div>
          <input
            type="text"
            placeholder="Folder name (e.g. Kedarnath Valley Corridor)"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            required
            style={{
              padding: '6px 10px',
              fontFamily: 'var(--font-sans)',
              fontSize: 11,
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              outline: 'none',
            }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <select
              value={folderDistrict}
              onChange={(e) => setFolderDistrict(e.target.value)}
              style={{
                flex: 1,
                padding: '6px 8px',
                fontFamily: 'var(--font-sans)',
                fontSize: 11,
                background: 'var(--bg-surface)',
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
            <button
              type="submit"
              className="btn-action btn-action--emerald"
              style={{ padding: '6px 14px' }}
            >
              Save Folder
            </button>
          </div>
        </form>
      )}

      {/* Folders List */}
      <div className="panel__list" style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {workspaces.map((ws) => {
          const isSelected = ws.id === activeWorkspaceId;
          return (
            <div
              key={ws.id}
              onClick={() => {
                setActiveWorkspaceId(ws.id);
                setSelectedDistrict(ws.district);
                flyToDistrict(ws.district);
              }}
              style={{
                background: isSelected ? 'var(--accent-blue-subtle)' : 'var(--bg-surface)',
                border: '1px solid',
                borderColor: isSelected ? 'var(--accent-blue)' : 'var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: isSelected ? 'var(--shadow-sm)' : 'var(--shadow-xs)',
                padding: '12px 14px',
                cursor: 'pointer',
                transition: 'all 0.12s ease',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 16 }}>📁</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                      {ws.name}
                    </div>
                    <div style={{ fontSize: 10, fontWeight: 500, color: 'var(--text-muted)' }}>
                      District: {ws.district} &bull; Created {ws.createdAt}
                    </div>
                  </div>
                </div>

                <span
                  className="risk-badge"
                  style={{
                    background: ws.priority === 'CRITICAL' ? 'var(--accent-rose-subtle)' : 'var(--accent-amber-subtle)',
                    color: ws.priority === 'CRITICAL' ? 'var(--accent-rose)' : 'var(--accent-amber)',
                    borderColor: ws.priority === 'CRITICAL' ? 'rgba(244, 63, 94, 0.3)' : 'rgba(245, 158, 11, 0.3)',
                  }}
                >
                  {ws.priority}
                </span>
              </div>

              <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                {ws.description}
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderTop: '1px solid var(--border-color)',
                  paddingTop: 8,
                  fontSize: 10,
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                }}
              >
                <div style={{ display: 'flex', gap: 12 }}>
                  <span>🏠 {ws.habitationsCount} Habitations</span>
                  <span>🏕️ {ws.safeSitesCount} Safe Grounds</span>
                  <span>🎯 {ws.surveillanceZones?.length || 0} Surveillance AOIs</span>
                </div>
                {isSelected ? (
                  <span style={{ color: 'var(--accent-blue)', fontWeight: 700 }}>ACTIVE WORKSPACE</span>
                ) : (
                  <span style={{ color: 'var(--text-muted)' }}>Click to activate &rarr;</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
