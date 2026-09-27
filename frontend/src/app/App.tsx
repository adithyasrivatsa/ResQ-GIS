import { useEffect } from 'react';
import TopBar from '../components/layout/TopBar';
import LeftNav from '../components/layout/LeftNav';
import RightPanel from '../components/layout/RightPanel';
import BottomBar from '../components/layout/BottomBar';
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
      <TopBar />
      <div className="app__body">
        <LeftNav />
        <main className="app__map" style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
          <div style={{ display: mapMode === '2d' ? 'flex' : 'none', width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}>
            <Map2D />
          </div>
          <div style={{ display: mapMode === '3d' ? 'flex' : 'none', width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}>
            <CesiumGlobe />
          </div>
        </main>
        <RightPanel />
      </div>
      <BottomBar />
    </div>
  );
}
