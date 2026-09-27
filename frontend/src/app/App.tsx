import { useEffect } from 'react';
import TopBar from '../components/layout/TopBar';
import LeftNav from '../components/layout/LeftNav';
import FilterBar from '../components/layout/FilterBar';
import BottomDataTable from '../components/layout/BottomDataTable';
import RightOperationsPanel from '../components/layout/RightOperationsPanel';
import CesiumGlobe from '../components/map/CesiumGlobe';
import Map2D from '../components/map/Map2D';
import { useAppStore } from '../store/useAppStore';

export default function App() {
  const { loadData, mapMode } = useAppStore();

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="app">
      {/* 4-Card Neobrutalist Header Bar */}
      <TopBar />

      {/* Main 3-Column Tactical Workstation Layout */}
      <div className="app__body">
        {/* Left Navigation Bar with Quick Actions */}
        <LeftNav />

        {/* Center Column: Filter Bar + Interactive Map + Bottom Data Table */}
        <main className="app__center">
          <FilterBar />

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

          <BottomDataTable />
        </main>

        {/* Right Operations Panel (Situation KPIs, Live Feeds, Risk Donut, Recent Alerts) */}
        <RightOperationsPanel />
      </div>
    </div>
  );
}

