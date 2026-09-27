import { useEffect, useRef, useState } from 'react';
import { Plus, Minus, Globe as GlobeIcon } from 'lucide-react';
import { initViewer, destroyViewer, switchViewerImagery, switchViewerTerrain, getViewer, setTerrainExaggeration } from '../../cesium/viewer';
import { flyToUttarakhand, zoomIn, zoomOut, flyToFullGlobe } from '../../cesium/camera';
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
    mapMode,
    setMapMode,
    terrainExaggeration,
  } = useAppStore();


  // Initialize Cesium Viewer once
  useEffect(() => {
    if (!containerRef.current) return;

    initViewer(containerRef.current);

    // Apply initial terrain exaggeration
    setTerrainExaggeration(terrainExaggeration);

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

  // Dynamically update terrain relief exaggeration when changed in Settings
  useEffect(() => {
    setTerrainExaggeration(terrainExaggeration);
  }, [terrainExaggeration]);

  // When mapMode is '3d', ensure Cesium viewer recalculates its canvas dimensions
  useEffect(() => {
    if (mapMode === '3d') {
      setTimeout(() => {
        const v = getViewer();
        if (v && !v.isDestroyed()) {
          v.resize();
        }
      }, 50);
    }
  }, [mapMode]);

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
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', position: 'relative', background: '#ffffff', borderRadius: 16, overflow: 'hidden' }}>
      {/* Neobrutalist Navigation Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          background: '#ffffff',
          borderBottom: '2.5px solid #000000',
          zIndex: 10,
        }}
      >
        {/* Left: Window identity & Engine badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 900, color: '#000000', textTransform: 'uppercase', letterSpacing: '-0.3px' }}>
            3D Elevation Globe
          </span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 800,
              background: 'var(--nb-yellow)',
              color: '#000000',
              padding: '2px 8px',
              borderRadius: 4,
              border: '1.5px solid #000000',
              boxShadow: '1.5px 1.5px 0px #000000',
              textTransform: 'uppercase',
            }}
          >
            Cesium 3D Engine
          </span>
        </div>

        {/* Center / Right: Neobrutalist Mode Switcher, Imagery & Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Spatial Mode Switcher Tabs */}
          <div
            style={{
              display: 'flex',
              background: '#ffffff',
              border: '2px solid #000000',
              boxShadow: '2px 2px 0px #000000',
              borderRadius: 8,
              padding: 2,
              gap: 2,
            }}
          >
            <button
              onClick={() => setMapMode('2d')}
              style={{
                fontSize: 11,
                fontWeight: 800,
                padding: '4px 12px',
                border: mapMode === '2d' ? '1.5px solid #000000' : '1.5px solid transparent',
                background: mapMode === '2d' ? 'var(--nb-mint)' : 'transparent',
                color: '#000000',
                boxShadow: mapMode === '2d' ? '1px 1px 0px #000000' : 'none',
                borderRadius: 6,
                cursor: 'pointer',
                transition: 'all 0.1s ease',
              }}
              title="Switch to 2D Vector Slippy Map"
            >
              🗺️ 2D Map
            </button>
            <button
              onClick={() => setMapMode('3d')}
              style={{
                fontSize: 11,
                fontWeight: 800,
                padding: '4px 12px',
                border: mapMode === '3d' ? '1.5px solid #000000' : '1.5px solid transparent',
                background: mapMode === '3d' ? 'var(--nb-mint)' : 'transparent',
                color: '#000000',
                boxShadow: mapMode === '3d' ? '1px 1px 0px #000000' : 'none',
                borderRadius: 6,
                cursor: 'pointer',
                transition: 'all 0.1s ease',
              }}
              title="Switch to 3D Cesium Elevation Globe"
            >
              🌐 3D Globe
            </button>
          </div>

          {/* Quick Imagery Switcher */}
          <div
            style={{
              display: 'flex',
              background: '#ffffff',
              border: '2px solid #000000',
              boxShadow: '2px 2px 0px #000000',
              borderRadius: 8,
              padding: 2,
              gap: 2,
            }}
          >
            {[
              { id: 'sentinel2', label: 'Sat' },
              { id: 'osm', label: 'OSM' },
              { id: 'carto-dark', label: 'Dark' },
              { id: 'topo', label: 'Topo' },
            ].map((img) => (
              <button
                key={img.id}
                onClick={() => handleImagerySwitch(img.id as ImageryType)}
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  padding: '3px 8px',
                  border: activeImagery === img.id ? '1.5px solid #000000' : '1.5px solid transparent',
                  background: activeImagery === img.id ? 'var(--nb-pink)' : 'transparent',
                  color: activeImagery === img.id ? '#ffffff' : '#000000',
                  boxShadow: activeImagery === img.id ? '1px 1px 0px #000000' : 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  transition: 'all 0.1s ease',
                }}
                title={`Switch to ${img.label} base imagery`}
              >
                {img.label}
              </button>
            ))}
          </div>

          {/* Terrain Toggle Pill */}
          <button
            onClick={handleTerrainToggle}
            style={{
              fontSize: 11,
              fontWeight: 800,
              padding: '5px 10px',
              border: '2px solid #000000',
              background: terrainActive ? 'var(--nb-mint)' : '#ffffff',
              color: '#000000',
              borderRadius: 8,
              boxShadow: '2px 2px 0px #000000',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              transition: 'all 0.1s ease',
            }}
            title="Toggle 3D Elevation Terrain Mesh"
          >
            <span>⛰️</span>
            <span>{terrainActive ? 'DEM ON' : 'FLAT 2D'}</span>
          </button>

          {/* Recenter Button */}
          <button
            onClick={() => flyToUttarakhand()}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 30,
              height: 30,
              background: '#ffffff',
              border: '2px solid #000000',
              borderRadius: 8,
              boxShadow: '2px 2px 0px #000000',
              cursor: 'pointer',
              fontSize: 15,
              fontWeight: 900,
              color: '#000000',
              transition: 'all 0.1s ease',
            }}
            title="Recenter Camera to Uttarakhand (Chamoli / Rudraprayag)"
          >
            ⌖
          </button>
        </div>
      </div>

      <div ref={containerRef} className="cesium-container" style={{ flex: 1, position: 'relative' }} />

      {/* Floating Neobrutalist Camera & Zoom Controls on 3D Globe */}
      <div
        style={{
          position: 'absolute',
          top: 60,
          right: 14,
          zIndex: 40,
          display: 'flex',
          flexDirection: 'column',
          background: '#ffffff',
          borderRadius: 8,
          border: '2.5px solid #000000',
          boxShadow: '4px 4px 0px #000000',
          overflow: 'hidden',
        }}
      >
        <button
          onClick={() => zoomIn(0.4)}
          style={{
            width: 34,
            height: 34,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#ffffff',
            border: 'none',
            borderBottom: '2px solid #000000',
            cursor: 'pointer',
            color: '#000000',
            transition: 'background 0.1s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--nb-yellow)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#ffffff')}
          title="Zoom In (+)"
        >
          <Plus size={18} strokeWidth={2.5} />
        </button>

        <button
          onClick={() => zoomOut(0.5)}
          style={{
            width: 34,
            height: 34,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#ffffff',
            border: 'none',
            borderBottom: '2px solid #000000',
            cursor: 'pointer',
            color: '#000000',
            transition: 'background 0.1s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--nb-yellow)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#ffffff')}
          title="Zoom Out (-)"
        >
          <Minus size={18} strokeWidth={2.5} />
        </button>

        <button
          onClick={() => flyToFullGlobe()}
          style={{
            width: 34,
            height: 34,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#ffffff',
            border: 'none',
            borderBottom: '2px solid #000000',
            cursor: 'pointer',
            color: '#000000',
            transition: 'background 0.1s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--nb-yellow)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#ffffff')}
          title="Full Planetary View (View Earth from Space)"
        >
          <GlobeIcon size={17} strokeWidth={2.5} />
        </button>

        <button
          onClick={() => flyToUttarakhand()}
          style={{
            width: 34,
            height: 34,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#ffffff',
            border: 'none',
            cursor: 'pointer',
            color: '#000000',
            fontSize: 16,
            fontWeight: 900,
            transition: 'background 0.1s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--nb-yellow)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#ffffff')}
          title="Recenter Camera to Uttarakhand (Chamoli / Rudraprayag)"
        >
          ⌖
        </button>
      </div>

      {/* Floating Neobrutalist HUD Legend for GIS Layers */}
      <div
        style={{
          position: 'absolute',
          bottom: 14,
          left: 14,
          background: '#ffffff',
          border: '2.5px solid #000000',
          boxShadow: '4px 4px 0px #000000',
          borderRadius: 10,
          padding: '8px 14px',
          color: '#000000',
          fontSize: 11,
          fontWeight: 800,
          display: 'flex',
          gap: 14,
          alignItems: 'center',
          zIndex: 50,
          pointerEvents: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ display: 'inline-block', width: 9, height: 9, borderRadius: '50%', background: 'var(--nb-pink)', border: '1px solid #000000' }} />
          <span>At-Risk Village</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ display: 'inline-block', width: 9, height: 9, borderRadius: '50%', background: 'var(--nb-mint)', border: '1px solid #000000' }} />
          <span>Safe Haven</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ display: 'inline-block', width: 14, height: 4, background: '#0284c7', border: '1px solid #000000' }} />
          <span>Road Corridor</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ display: 'inline-block', width: 9, height: 9, borderRadius: 2, background: 'var(--nb-lime)', border: '1px solid #000000' }} />
          <span>IDRN Infrastructure</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ display: 'inline-block', width: 9, height: 9, borderRadius: '50%', background: 'var(--nb-cyan)', border: '1px solid #000000' }} />
          <span>CWC Gauge</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ display: 'inline-block', width: 12, height: 8, background: 'var(--nb-orange)', border: '1.5px solid #000000', borderRadius: 2 }} />
          <span>Hazard Polygon</span>
        </div>
      </div>
    </div>
  );
}
