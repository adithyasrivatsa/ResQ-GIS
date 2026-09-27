import { useEffect } from 'react';
import TopBar from '../components/layout/TopBar';
import LeftNav from '../components/layout/LeftNav';
import BottomDataTable from '../components/layout/BottomDataTable';
import RightOperationsPanel from '../components/layout/RightOperationsPanel';
import CesiumGlobe from '../components/map/CesiumGlobe';
import Map2D from '../components/map/Map2D';
import { useAppStore } from '../store/useAppStore';

export default function App() {
  const { loadData, mapMode, theme, autoRefreshInterval } = useAppStore();

  useEffect(() => {
    loadData();
    // Initialize theme attribute on root element
    document.documentElement.setAttribute('data-theme', theme);
  }, [loadData, theme]);

  // Periodic background telemetry refresh
  useEffect(() => {
    if (autoRefreshInterval <= 0) return;
    const timer = setInterval(() => {
      loadData();
    }, autoRefreshInterval * 1000);
    return () => clearInterval(timer);
  }, [autoRefreshInterval, loadData]);

  return (
    <div className="app">
      {/* Sleek Unified Command Header */}
      <TopBar />

      {/* Main Tactical Workstation Layout */}
      <div className="app__body">
        {/* Bendable Left Navigation Sidebar */}
        <LeftNav />

        {/* Center Column: Interactive GIS Map & Foldable Bottom Data Table */}
        <main className="app__center">
          <div className="app__map-wrapper">
            <div
              style={{
                display: mapMode === '2d' ? 'flex' : 'none',
                width: '100%',
                height: '100%',
                position: 'absolute',
                top: 0,
                left: 0,
              }}
            >
              <Map2D />
            </div>
            <div
              style={{
                display: mapMode === '3d' ? 'flex' : 'none',
                width: '100%',
                height: '100%',
                position: 'absolute',
                top: 0,
                left: 0,
              }}
            >
              <CesiumGlobe />
            </div>
          </div>

          {/* Bendable High-Density Bottom Data Table */}
          <BottomDataTable />
        </main>

        {/* Bendable Right Operations Desk */}
        <RightOperationsPanel />
      </div>
    </div>
  );
}
