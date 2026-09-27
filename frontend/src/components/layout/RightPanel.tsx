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
    if (selectedHabitationId) return 'HABITATION_PROFILE.SYS';
    if (selectedSiteId) return 'SAFE_HAVEN_SPECS.SYS';
    if (selectedRiverId) return 'RIVER_GAUGE_TELEMETRY.SYS';
    switch (activeNav) {
      case 'map':
        return 'MAP_LAYERS.SYS';
      case 'habitations':
        return 'RISK_OVERVIEW.SYS';
      case 'relocation':
        return 'SAFE_HAVENS_LIST.SYS';
      case 'alerts':
        return 'EMERGENCY_ALERTS.SYS';
      case 'analysis':
        return 'TOPSIS_LEADERBOARD.SYS';
      case 'reports':
        return 'OPERATIONAL_REPORT.SYS';
      case 'rivers':
        return 'HYDROLOGICAL_GAUGES.SYS';
      default:
        return 'INTELLIGENCE_DECK.SYS';
    }
  };

  const renderContent = () => {
    if (selectedHabitationId) return <HabitationPanel />;
    if (selectedSiteId) return <RelocationPanel />;
    if (selectedRiverId) return <RiversPanel />;

    switch (activeNav) {
      case 'map':
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
      {/* Retro Window Purple Titlebar */}
      <div className="retro-titlebar retro-titlebar--purple">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>💬 {getWindowTitle()}</span>
        </div>
        <div className="retro-win-controls">
          <button className="retro-win-btn">_</button>
          <button className="retro-win-btn">□</button>
          <button
            className="retro-win-btn retro-win-btn--close"
            onClick={handleClose}
            title="Dismiss Selection"
          >
            ✕
          </button>
        </div>
      </div>

      {renderContent()}
    </aside>
  );
}
