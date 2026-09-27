import { useEffect } from 'react';
import TopBar from '../components/layout/TopBar';
import LeftNav from '../components/layout/LeftNav';
import RightPanel from '../components/layout/RightPanel';
import BottomBar from '../components/layout/BottomBar';
import CesiumGlobe from '../components/map/CesiumGlobe';
import { useAppStore } from '../store/useAppStore';

export default function App() {
  const { loadData } = useAppStore();

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="app">
      <TopBar />
      <div className="app__body">
        <LeftNav />
        <main className="app__map">
          <CesiumGlobe />
        </main>
        <RightPanel />
      </div>
      <BottomBar />
    </div>
  );
}
