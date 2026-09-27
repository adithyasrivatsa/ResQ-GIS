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
  Printer,
  Download,
  Share2,
  FileSpreadsheet,
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
  { id: 'hazard_layers', label: 'Hazard Layers', icon: Layers, targetPanel: 'map' },
  { id: 'habitations', label: 'Habitations', icon: Home, targetPanel: 'habitations' },
  { id: 'relocation', label: 'Relocation Planning', icon: Navigation, targetPanel: 'relocation' },
  { id: 'infrastructure', label: 'Infrastructure', icon: Building, targetPanel: 'rivers' },
  { id: 'alerts', label: 'Alerts & Advisories', icon: AlertTriangle, targetPanel: 'alerts' },
  { id: 'reports', label: 'Reports', icon: FileText, targetPanel: 'reports' },
  { id: 'datasources', label: 'Data Sources', icon: Database, targetPanel: 'rivers' },
  { id: 'settings', label: 'Settings', icon: Settings, targetPanel: 'analysis' },
];

export default function LeftNav() {
  const { activeNav, setActiveNav } = useAppStore();

  const handleNavClick = (item: NavItemDef) => {
    if (item.targetPanel) {
      setActiveNav(item.targetPanel);
    }
  };

  return (
    <aside
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        width: 190,
        background: '#fde047',
        border: '2.5px solid #000000',
        boxShadow: '3px 3px 0px #000000',
        borderRadius: 12,
        padding: '10px 8px',
        flexShrink: 0,
        gap: 12,
      }}
    >
      {/* Navigation Menu Stack */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            (item.id === 'dashboard' && activeNav === 'analysis') ||
            (item.id === 'map' && activeNav === 'map') ||
            (item.id === 'habitations' && activeNav === 'habitations') ||
            (item.id === 'relocation' && activeNav === 'relocation') ||
            (item.id === 'alerts' && activeNav === 'alerts') ||
            (item.id === 'reports' && activeNav === 'reports');

          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                width: '100%',
                padding: '7px 10px',
                background: isActive ? '#38bdf8' : 'transparent',
                border: isActive ? '2px solid #000000' : '2px solid transparent',
                boxShadow: isActive ? '2px 2px 0px #000000' : 'none',
                borderRadius: 8,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.1s ease',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = '#ffffff';
                  e.currentTarget.style.borderColor = '#000000';
                  e.currentTarget.style.boxShadow = '1.5px 1.5px 0px #000000';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.borderColor = 'transparent';
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
            >
              <Icon size={16} strokeWidth={2.5} color="#000000" />
              <span
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 12,
                  fontWeight: isActive ? 900 : 800,
                  color: '#000000',
                  letterSpacing: '-0.2px',
                  whiteSpace: 'nowrap',
                }}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Quick Actions Container */}
      <div
        style={{
          background: '#ffffff',
          border: '2px solid #000000',
          boxShadow: '2.5px 2.5px 0px #000000',
          borderRadius: 8,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            background: '#f472b6',
            color: '#000000',
            fontFamily: 'var(--font-sans)',
            fontSize: 11,
            fontWeight: 900,
            textTransform: 'uppercase',
            padding: '6px 10px',
            borderBottom: '2px solid #000000',
          }}
        >
          Quick Actions
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, padding: 8 }}>
          <button
            onClick={() => setActiveNav('reports')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              width: '100%',
              padding: '6px 8px',
              background: '#ffffff',
              border: '1.5px solid #000000',
              boxShadow: '1.5px 1.5px 0px #000000',
              borderRadius: 6,
              fontFamily: 'var(--font-sans)',
              fontSize: 11,
              fontWeight: 800,
              color: '#000000',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.1s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#fde047')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#ffffff')}
          >
            <FileSpreadsheet size={13} strokeWidth={2.5} />
            <span>Generate Report</span>
          </button>

          <button
            onClick={() => window.print()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              width: '100%',
              padding: '6px 8px',
              background: '#ffffff',
              border: '1.5px solid #000000',
              boxShadow: '1.5px 1.5px 0px #000000',
              borderRadius: 6,
              fontFamily: 'var(--font-sans)',
              fontSize: 11,
              fontWeight: 800,
              color: '#000000',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.1s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#fde047')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#ffffff')}
          >
            <Download size={13} strokeWidth={2.5} />
            <span>Export Map</span>
          </button>

          <button
            onClick={() => window.print()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              width: '100%',
              padding: '6px 8px',
              background: '#ffffff',
              border: '1.5px solid #000000',
              boxShadow: '1.5px 1.5px 0px #000000',
              borderRadius: 6,
              fontFamily: 'var(--font-sans)',
              fontSize: 11,
              fontWeight: 800,
              color: '#000000',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.1s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#fde047')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#ffffff')}
          >
            <Printer size={13} strokeWidth={2.5} />
            <span>Print Briefing</span>
          </button>

          <button
            onClick={() => {
              navigator.clipboard?.writeText(window.location.href);
              alert('Operational View link copied to clipboard!');
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              width: '100%',
              padding: '6px 8px',
              background: '#ffffff',
              border: '1.5px solid #000000',
              boxShadow: '1.5px 1.5px 0px #000000',
              borderRadius: 6,
              fontFamily: 'var(--font-sans)',
              fontSize: 11,
              fontWeight: 800,
              color: '#000000',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.1s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#fde047')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#ffffff')}
          >
            <Share2 size={13} strokeWidth={2.5} />
            <span>Share View</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
