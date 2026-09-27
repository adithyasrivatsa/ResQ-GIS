import {
  Map,
  Globe,
  BarChart3,
  Home,
  ArrowRightLeft,
  AlertTriangle,
  FileText,
  Layers,
  Droplets,
  ShieldCheck,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import type { NavSection } from '../../types';

interface NavItemDef {
  id: NavSection;
  label: string;
  icon: typeof Map;
}

const NAV_ITEMS: NavItemDef[] = [
  { id: 'map', label: '2D Map', icon: Map },
  { id: 'globe', label: '3D Globe', icon: Globe },
  { id: 'analysis', label: 'Priority', icon: BarChart3 },
  { id: 'habitations', label: 'Villages', icon: Home },
  { id: 'relocation', label: 'Havens', icon: ArrowRightLeft },
  { id: 'rivers', label: 'Rivers', icon: Droplets },
  { id: 'alerts', label: 'Alerts', icon: AlertTriangle },
  { id: 'reports', label: 'Reports', icon: FileText },
];

export default function LeftNav() {
  const { activeNav, setActiveNav } = useAppStore();

  return (
    <nav className="left-nav">
      <div className="left-nav__items">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeNav === item.id;
          return (
            <button
              key={item.id}
              className={`left-nav__item ${isActive ? 'left-nav__item--active' : ''}`}
              onClick={() => setActiveNav(item.id)}
              title={item.label}
            >
              <div className="left-nav__icon-box">
                <Icon size={19} strokeWidth={isActive ? 2.3 : 1.9} />
              </div>
              <span className="left-nav__label">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Layer Stack Button & Live Guard Badge */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, width: '100%' }}>
        <button
          className={`left-nav__item ${activeNav === 'map' || activeNav === 'globe' ? 'left-nav__item--active' : ''}`}
          onClick={() => setActiveNav(activeNav === 'globe' ? 'globe' : 'map')}
          title="GIS Layer Overlays"
        >
          <Layers size={18} strokeWidth={2} />
          <span className="left-nav__label">Layers</span>
        </button>

        {/* System Active Status Badge */}
        <div
          className="left-nav__avatar"
          title="ResQ Intelligence Engine Active"
          style={{
            position: 'relative',
          }}
        >
          <ShieldCheck size={18} color="#0f172a" />
          <span
            style={{
              position: 'absolute',
              top: 6,
              right: 6,
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: '#10b981',
              boxShadow: '0 0 4px #10b981',
            }}
          />
        </div>
      </div>
    </nav>
  );
}
