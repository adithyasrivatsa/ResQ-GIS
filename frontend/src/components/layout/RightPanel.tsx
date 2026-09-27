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
      {/* Clean Minimal Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderBottom: '1px solid #e2e8f0',
          background: '#ffffff',
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
          {getWindowTitle()}
        </div>
        <button
          onClick={handleClose}
          style={{
            width: 26,
            height: 26,
            borderRadius: 6,
            border: '1px solid #e2e8f0',
            background: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#64748b',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#f1f5f9';
            e.currentTarget.style.color = '#0f172a';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#ffffff';
            e.currentTarget.style.color = '#64748b';
          }}
          title="Dismiss View"
        >
          <X size={14} />
        </button>
      </div>

      {renderContent()}
    </aside>
  );
}
