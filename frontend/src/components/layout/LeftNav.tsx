import { useState } from 'react';
import {
  LayoutDashboard,
  Radio,
  Layers,
  Home,
  Navigation,
  Building,
  AlertTriangle,
  FileText,
  Database,
  Settings,
  FolderKanban,
  Scan,
  Printer,
  Share2,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  Check,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import type { NavSection } from '../../types';

interface NavItemDef {
  id: string;
  label: string;
  icon: typeof LayoutDashboard;
  targetPanel?: NavSection;
}

const NAV_ITEMS: NavItemDef[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, targetPanel: 'analysis' },
  { id: 'map', label: 'Live Situation', icon: Radio, targetPanel: 'map' },
  { id: 'workspaces', label: 'Workspaces', icon: FolderKanban, targetPanel: 'workspaces' },
  { id: 'surveillance', label: 'Surveillance & AOI', icon: Scan, targetPanel: 'surveillance' },
  { id: 'habitations', label: 'Habitations', icon: Home, targetPanel: 'habitations' },
  { id: 'relocation', label: 'Safe Havens', icon: Navigation, targetPanel: 'relocation' },
  { id: 'infrastructure', label: 'Infrastructure', icon: Building, targetPanel: 'rivers' },
  { id: 'hazard_layers', label: 'Hazard Layers', icon: Layers, targetPanel: 'layers' },
  { id: 'alerts', label: 'Alerts Feed', icon: AlertTriangle, targetPanel: 'alerts' },
  { id: 'reports', label: 'Reports', icon: FileText, targetPanel: 'reports' },
  { id: 'datasources', label: 'Data Sources', icon: Database, targetPanel: 'datasources' },
  { id: 'settings', label: 'Settings', icon: Settings, targetPanel: 'settings' },
];

export default function LeftNav() {
  const { activeNav, setActiveNav, isLeftNavCollapsed, toggleLeftNav } = useAppStore();

  const [copiedLink, setCopiedLink] = useState(false);

  const handleNavClick = (item: NavItemDef) => {
    if (item.targetPanel) {
      setActiveNav(item.targetPanel);
    }
  };

  const handleShareSector = () => {
    try {
      navigator.clipboard?.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch (e) {
      console.warn('Clipboard write failed:', e);
    }
  };

  return (
    <aside
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        width: isLeftNavCollapsed ? 58 : 190,
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
        padding: '10px 6px',
        flexShrink: 0,
        gap: 10,
        transition: 'width 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
      }}
    >
      {/* Top Header & Fold Toggle Button */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: isLeftNavCollapsed ? 'center' : 'space-between',
            padding: '2px 6px 8px 6px',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          {!isLeftNavCollapsed && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.6px',
              }}
            >
              Operations
            </span>
          )}
          <button
            onClick={toggleLeftNav}
            className="btn-action"
            style={{
              padding: '4px',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-muted)',
              border: 'none',
              background: 'transparent',
              boxShadow: 'none',
            }}
            title={isLeftNavCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isLeftNavCollapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          </button>
        </div>

        {/* Navigation Menu Stack */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              (item.id === 'dashboard' && activeNav === 'analysis') ||
              (item.id === 'map' && activeNav === 'map') ||
              (item.id === 'workspaces' && activeNav === 'workspaces') ||
              (item.id === 'surveillance' && activeNav === 'surveillance') ||
              (item.id === 'hazard_layers' && activeNav === 'layers') ||
              (item.id === 'habitations' && activeNav === 'habitations') ||
              (item.id === 'relocation' && activeNav === 'relocation') ||
              (item.id === 'infrastructure' && activeNav === 'rivers') ||
              (item.id === 'alerts' && activeNav === 'alerts') ||
              (item.id === 'reports' && activeNav === 'reports') ||
              (item.id === 'datasources' && activeNav === 'datasources') ||
              (item.id === 'settings' && activeNav === 'settings');

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  width: '100%',
                  padding: isLeftNavCollapsed ? '8px 0' : '7px 10px',
                  justifyContent: isLeftNavCollapsed ? 'center' : 'flex-start',
                  background: isActive ? 'var(--accent-blue-subtle)' : 'transparent',
                  border: '1px solid',
                  borderColor: isActive ? 'rgba(59, 130, 246, 0.25)' : 'transparent',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.12s ease',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'var(--bg-subtle)';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'transparent';
                }}
                title={isLeftNavCollapsed ? item.label : undefined}
              >
                {isActive && (
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: '20%',
                      bottom: '20%',
                      width: 3,
                      background: 'var(--accent-blue)',
                      borderRadius: '0 2px 2px 0',
                    }}
                  />
                )}
                <Icon
                  size={16}
                  color={isActive ? 'var(--accent-blue)' : 'var(--text-secondary)'}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                {!isLeftNavCollapsed && (
                  <span
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: 12,
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? 'var(--accent-blue)' : 'var(--text-primary)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Actions Container */}
      {!isLeftNavCollapsed ? (
        <div
          style={{
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
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
              borderBottom: '1px solid var(--border-color)',
            }}
          >
            Quick Actions
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, padding: 4 }}>
            <button
              onClick={() => setActiveNav('reports')}
              className="btn-action"
              style={{
                width: '100%',
                justifyContent: 'flex-start',
                padding: '5px 8px',
                fontSize: 11,
                border: 'none',
                background: 'transparent',
                boxShadow: 'none',
              }}
            >
              <FileSpreadsheet size={13} color="var(--accent-indigo)" />
              <span>Generate Brief</span>
            </button>

            <button
              onClick={() => window.print()}
              className="btn-action"
              style={{
                width: '100%',
                justifyContent: 'flex-start',
                padding: '5px 8px',
                fontSize: 11,
                border: 'none',
                background: 'transparent',
                boxShadow: 'none',
              }}
            >
              <Printer size={13} color="var(--accent-emerald)" />
              <span>Print Briefing</span>
            </button>

            <button
              onClick={handleShareSector}
              className="btn-action"
              style={{
                width: '100%',
                justifyContent: 'flex-start',
                padding: '5px 8px',
                fontSize: 11,
                border: 'none',
                background: copiedLink ? 'var(--accent-emerald-subtle)' : 'transparent',
                color: copiedLink ? 'var(--accent-emerald)' : 'inherit',
                boxShadow: 'none',
                transition: 'all 0.15s ease',
              }}
            >
              {copiedLink ? <Check size={13} color="var(--accent-emerald)" /> : <Share2 size={13} color="var(--accent-blue)" />}
              <span>{copiedLink ? 'Link Copied!' : 'Share Sector'}</span>
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <button
            onClick={() => setActiveNav('reports')}
            className="btn-action"
            style={{ padding: '7px', borderRadius: 'var(--radius-sm)' }}
            title="Generate Brief"
          >
            <FileSpreadsheet size={14} color="var(--accent-indigo)" />
          </button>
          <button
            onClick={() => window.print()}
            className="btn-action"
            style={{ padding: '7px', borderRadius: 'var(--radius-sm)' }}
            title="Print Briefing"
          >
            <Printer size={14} color="var(--accent-emerald)" />
          </button>
        </div>
      )}
    </aside>
  );
}
