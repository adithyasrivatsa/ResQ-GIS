import {
  Monitor,
  BarChart3,
  Home,
  ArrowRightLeft,
  AlertTriangle,
  FileText,
  Layers,
  Droplets,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import type { NavSection } from '../../types';

interface NavItemDef {
  id: NavSection;
  label: string;
  icon: typeof Monitor;
  bg: string;
}

const NAV_ITEMS: NavItemDef[] = [
  { id: 'map', label: 'RADAR', icon: Monitor, bg: '#38bdf8' },
  { id: 'analysis', label: 'TOPSIS', icon: BarChart3, bg: '#ff9f1c' },
  { id: 'habitations', label: 'SECTOR', icon: Home, bg: '#fde047' },
  { id: 'relocation', label: 'HAVENS', icon: ArrowRightLeft, bg: '#a78bfa' },
  { id: 'rivers', label: 'RIVERS', icon: Droplets, bg: '#06b6d4' },
  { id: 'alerts', label: 'ALERTS', icon: AlertTriangle, bg: '#ff2a85' },
  { id: 'reports', label: 'REPORT', icon: FileText, bg: '#cbd5e1' },
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
              style={{
                backgroundColor: isActive ? 'var(--retro-purple)' : item.bg,
                color: isActive ? '#ffffff' : '#000000',
              }}
              onClick={() => setActiveNav(item.id)}
              title={item.label}
            >
              <div className="left-nav__icon-box">
                <Icon size={20} strokeWidth={2.5} />
              </div>
              <span className="left-nav__label" style={{ color: isActive ? '#fff' : '#000' }}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Retro Layers Button & Avatar Badge */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, width: '100%' }}>
        <button
          className={`left-nav__item ${activeNav === 'map' ? 'left-nav__item--active' : ''}`}
          style={{ backgroundColor: '#4ade80' }}
          onClick={() => setActiveNav('map')}
          title="MAP LAYERS"
        >
          <Layers size={18} strokeWidth={2.5} color="#000" />
          <span className="left-nav__label" style={{ color: '#000' }}>LAYERS</span>
        </button>

        {/* Retro Dispatcher Avatar */}
        <div className="left-nav__avatar" title="Dispatcher // AI Agent Active">
          🤖
        </div>
      </div>
    </nav>
  );
}
