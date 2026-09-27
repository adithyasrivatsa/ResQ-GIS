import { X } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import HabitationPanel from '../panels/HabitationPanel';
import RelocationPanel from '../panels/RelocationPanel';
import LayerPanel from '../panels/LayerPanel';
import AlertsPanel from '../panels/AlertsPanel';
import RiskOverviewPanel from '../panels/RiskOverviewPanel';
import AnalysisPanel from '../panels/AnalysisPanel';
import ReportsPanel from '../panels/ReportsPanel';
import RiversPanel from '../panels/RiversPanel';

export default function RightPanel() {
  const {
    activeNav,
    selectedHabitationId,
    selectedSiteId,
    selectedRiverId,
    selectHabitation,
    selectSite,
    selectRiver,
    selectHazard,
  } = useAppStore();

  const getWindowTitle = () => {
    if (selectedHabitationId) return 'Village Assessment';
    if (selectedSiteId) return 'Safe Haven Profile';
    if (selectedRiverId) return 'River Gauge Telemetry';
    switch (activeNav) {
      case 'map':
      case 'globe':
        return 'Map Layer Stack';
      case 'habitations':
        return 'Risk Overview';
      case 'relocation':
        return 'Safe Haven Directory';
      case 'alerts':
        return 'Emergency Alerts';
      case 'analysis':
        return 'TOPSIS Prioritization';
      case 'reports':
        return 'Operational Risk Report';
      case 'rivers':
        return 'Hydrological Gauges';
      default:
        return 'Operational Intelligence';
    }
  };

  const renderContent = () => {
    if (selectedHabitationId) return <HabitationPanel />;
    if (selectedSiteId) return <RelocationPanel />;
    if (selectedRiverId) return <RiversPanel />;

    switch (activeNav) {
      case 'map':
      case 'globe':
        return <LayerPanel />;
      case 'habitations':
        return <RiskOverviewPanel />;
      case 'relocation':
        return <RelocationPanel showList />;
      case 'alerts':
        return <AlertsPanel />;
      case 'analysis':
        return <AnalysisPanel />;
      case 'reports':
        return <ReportsPanel />;
      case 'rivers':
        return <RiversPanel />;
      default:
        return <RiskOverviewPanel />;
    }
  };

  const handleClose = () => {
    if (selectedHabitationId) selectHabitation(null);
    else if (selectedSiteId) selectSite(null);
    else if (selectedRiverId) selectRiver(null);
    selectHazard(null);
  };

  return (
    <aside className="right-panel">
      {/* Neobrutalist Window Titlebar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          borderBottom: '2.5px solid #000000',
          background: 'var(--nb-mint)',
          userSelect: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Retro Window Dots */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#000000' }} />
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#000000' }} />
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#000000' }} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 900, color: '#000000', textTransform: 'uppercase', letterSpacing: '-0.3px' }}>
            {getWindowTitle()}
          </span>
        </div>
        <button
          onClick={handleClose}
          style={{
            width: 26,
            height: 26,
            borderRadius: 6,
            border: '2px solid #000000',
            boxShadow: '2px 2px 0px #000000',
            background: 'var(--nb-pink)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.1s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translate(-1px, -1px)';
            e.currentTarget.style.boxShadow = '3px 3px 0px #000000';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.boxShadow = '2px 2px 0px #000000';
          }}
          title="Dismiss Panel"
        >
          <X size={14} strokeWidth={3} />
        </button>
      </div>

      {renderContent()}
    </aside>
  );
}
