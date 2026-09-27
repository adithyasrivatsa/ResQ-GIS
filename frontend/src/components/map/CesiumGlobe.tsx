import { useEffect, useRef, useState } from 'react';
import { initViewer, destroyViewer, switchViewerImagery, switchViewerTerrain } from '../../cesium/viewer';
import { flyToUttarakhand } from '../../cesium/camera';
import {
  renderHabitations,
  renderRelocationSites,
  renderRelocationPathway,
  clearRelocationPathway,
  renderHazardLayers,
  renderRiverStations,
  renderDisasterAlerts,
  renderRoads,
  renderEmergencyResources,
} from '../../cesium/entities/markers';
import { setupClickHandler } from '../../cesium/interaction/clickHandler';
import { useAppStore } from '../../store/useAppStore';
import type { ImageryType } from '../../cesium/providers/cesium-config';

export default function CesiumGlobe() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeImagery, setActiveImagery] = useState<ImageryType>('sentinel2');
  const [terrainActive, setTerrainActive] = useState<boolean>(true);

  const {
    habitations,
    relocationSites,
    riverStations,
    hazardLayers,
    alerts,
    roads,
    emergencyResources,
    layers,
    selectedHabitationId,
    selectHabitation,
    selectSite,
    selectRiver,
    selectHazard,
    getSelectedHabitation,
    getLayerVisibilityMap,
  } = useAppStore();

  // Initialize Cesium Viewer once
  useEffect(() => {
    if (!containerRef.current) return;

    initViewer(containerRef.current);

    // Fly to Uttarakhand on load
    flyToUttarakhand();

    // Setup interactive click handling for all spatial entity types
    const handler = setupClickHandler({
      onHabitationClick: (id) => selectHabitation(id),
      onSiteClick: (id) => selectSite(id),
      onRiverClick: (id) => selectRiver(id),
      onHazardClick: (id) => selectHazard(id),
    });

    return () => {
      if (handler) handler.destroy();
      destroyViewer();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-render GIS layers and overlays when store data or layer visibility toggles
  useEffect(() => {
    const layerVis = getLayerVisibilityMap();

    renderHabitations(habitations, layerVis['habitations'] ?? true);
    renderRelocationSites(relocationSites, layerVis['relocation-sites'] ?? true);
    renderHazardLayers(hazardLayers, layerVis);
    renderRiverStations(riverStations, layerVis['rivers'] ?? true);
    renderDisasterAlerts(alerts, layerVis['alerts'] ?? true);
    renderRoads(roads, layerVis['roads'] ?? true);
    renderEmergencyResources(emergencyResources, layerVis['emergency-resources'] ?? true);
  }, [habitations, relocationSites, riverStations, hazardLayers, alerts, roads, emergencyResources, layers, getLayerVisibilityMap]);

  // Render relocation pathway corridor when a habitation is selected
  useEffect(() => {
    if (selectedHabitationId) {
      const hab = getSelectedHabitation();
      if (hab && hab.nearestRelocationSite) {
        const site = relocationSites.find((s) => s.id === hab.nearestRelocationSite);
        if (site) {
          renderRelocationPathway(hab, site);
          return;
        }
      }
    }
    clearRelocationPathway();
  }, [selectedHabitationId, habitations, relocationSites, getSelectedHabitation]);

  const handleImagerySwitch = (type: ImageryType) => {
    setActiveImagery(type);
    switchViewerImagery(type);
  };

  const handleTerrainToggle = () => {
    const next = !terrainActive;
    setTerrainActive(next);
    switchViewerTerrain(next ? 'ion' : 'ellipsoid');
  };

  return (
    <div className="retro-window" style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', position: 'relative' }}>
      <div className="retro-titlebar retro-titlebar--orange" style={{ borderBottom: '3px solid #000' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>🛰️ RADAR_TERRAIN_3D.EXE</span>
          <span
            style={{
              fontFamily: 'Space Mono',
              fontSize: 9,
              fontWeight: 800,
              background: '#000000',
              color: '#22c55e',
              padding: '1px 6px',
              borderRadius: 3,
            }}
          >
            CESIUMJS 3D OPERATIONAL ENGINE
          </span>
        </div>

        {/* Quick Basemap & Camera Controls in Window Titlebar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ display: 'flex', background: '#ffffff', border: '1.5px solid #000', borderRadius: 4, padding: 1, gap: 2 }}>
            <button
              onClick={() => handleImagerySwitch('sentinel2')}
              style={{
                fontFamily: 'Silkscreen',
                fontSize: 8,
                padding: '1px 5px',
                border: 'none',
                background: activeImagery === 'sentinel2' ? '#ea580c' : 'transparent',
                color: activeImagery === 'sentinel2' ? '#fff' : '#000',
                borderRadius: 2,
                cursor: 'pointer',
              }}
              title="Sentinel-2 Satellite Imagery"
            >
              SAT
            </button>
            <button
              onClick={() => handleImagerySwitch('osm')}
              style={{
                fontFamily: 'Silkscreen',
                fontSize: 8,
                padding: '1px 5px',
                border: 'none',
                background: activeImagery === 'osm' ? '#ea580c' : 'transparent',
                color: activeImagery === 'osm' ? '#fff' : '#000',
                borderRadius: 2,
                cursor: 'pointer',
              }}
              title="OpenStreetMap Cartography"
            >
              OSM
            </button>
            <button
              onClick={() => handleImagerySwitch('carto-dark')}
              style={{
                fontFamily: 'Silkscreen',
                fontSize: 8,
                padding: '1px 5px',
                border: 'none',
                background: activeImagery === 'carto-dark' ? '#ea580c' : 'transparent',
                color: activeImagery === 'carto-dark' ? '#fff' : '#000',
                borderRadius: 2,
                cursor: 'pointer',
              }}
              title="CartoDB Dark Matter GIS"
            >
              DARK
            </button>
            <button
              onClick={() => handleImagerySwitch('topo')}
              style={{
                fontFamily: 'Silkscreen',
                fontSize: 8,
                padding: '1px 5px',
                border: 'none',
                background: activeImagery === 'topo' ? '#ea580c' : 'transparent',
                color: activeImagery === 'topo' ? '#fff' : '#000',
                borderRadius: 2,
                cursor: 'pointer',
              }}
              title="Topographic Relief & Elevation Contours"
            >
              TOPO
            </button>
          </div>

          <button
            onClick={handleTerrainToggle}
            style={{
              fontFamily: 'Silkscreen',
              fontSize: 8,
              padding: '2px 6px',
              border: '1.5px solid #000',
              background: terrainActive ? '#22c55e' : '#e2e8f0',
              color: '#000',
              borderRadius: 4,
              cursor: 'pointer',
            }}
            title="Toggle 3D Elevation Terrain Mesh"
          >
            {terrainActive ? '⛰️ 3D DEM ON' : '🌐 2D FLAT'}
          </button>

          <div className="retro-win-controls" style={{ marginLeft: 4 }}>
            <button
              className="retro-win-btn"
              title="Recenter Camera to Uttarakhand (Chamoli / Rudraprayag)"
              onClick={() => flyToUttarakhand()}
              style={{ background: '#fef08a' }}
            >
              ⌖
            </button>
            <button className="retro-win-btn">_</button>
            <button className="retro-win-btn">□</button>
            <button className="retro-win-btn retro-win-btn--close">✕</button>
          </div>
        </div>
      </div>

      <div ref={containerRef} className="cesium-container" style={{ flex: 1, position: 'relative' }} />
      <div className="map-scanlines" />

      {/* Floating HUD Legend for GIS Layers */}
      <div
        style={{
          position: 'absolute',
          bottom: 12,
          left: 12,
          background: 'rgba(9, 9, 11, 0.90)',
          border: '2px solid #000000',
          boxShadow: '3px 3px 0px #000000',
          borderRadius: 6,
          padding: '6px 10px',
          color: '#ffffff',
          fontFamily: 'Space Mono',
          fontSize: 9,
          display: 'flex',
          gap: 12,
          alignItems: 'center',
          zIndex: 50,
          pointerEvents: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#dc2626' }} />
          <span>At-Risk Village</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#3b82f6' }} />
          <span>Safe Haven</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ display: 'inline-block', width: 12, height: 3, background: '#06b6d4', borderRadius: 1 }} />
          <span>OSM Road Corridor</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: '#10b981' }} />
          <span>IDRN Infrastructure</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#06b6d4' }} />
          <span>CWC Gauge</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ display: 'inline-block', width: 10, height: 6, background: 'rgba(234, 88, 12, 0.7)', border: '1px solid #c2410c' }} />
          <span>Hazard Polygon</span>
        </div>
      </div>
    </div>
  );
}
