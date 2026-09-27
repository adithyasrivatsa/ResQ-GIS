import { useEffect, useRef, useState } from 'react';
import { Plus, Minus, Globe as GlobeIcon } from 'lucide-react';
import { initViewer, destroyViewer, switchViewerImagery, switchViewerTerrain, getViewer } from '../../cesium/viewer';
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
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', position: 'relative', background: '#ffffff', borderRadius: 14, overflow: 'hidden' }}>
      {/* Apple-style Navigation Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 14px',
          background: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          zIndex: 10,
        }}
      >
        {/* Left: Window identity & Engine badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', letterSpacing: '-0.2px' }}>
            3D Elevation Globe
          </span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 500,
              background: '#f1f5f9',
              color: '#475569',
              padding: '2px 8px',
              borderRadius: 6,
              border: '1px solid #e2e8f0',
            }}
          >
            Cesium 3D Engine
          </span>
        </div>

        {/* Center / Right: Apple Segmented Mode Switcher, Imagery & Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Spatial Mode Switcher Tabs */}
          <div
            style={{
              display: 'flex',
              background: '#f1f5f9',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              padding: 2,
              gap: 2,
            }}
          >
            <button
              onClick={() => setMapMode('2d')}
              style={{
                fontSize: 11,
                fontWeight: mapMode === '2d' ? 600 : 500,
                padding: '4px 12px',
                border: 'none',
                background: mapMode === '2d' ? '#ffffff' : 'transparent',
                color: mapMode === '2d' ? '#0f172a' : '#64748b',
                boxShadow: mapMode === '2d' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                borderRadius: 6,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              title="Switch to 2D Vector Slippy Map"
            >
              🗺️ 2D Map
            </button>
            <button
              onClick={() => setMapMode('3d')}
              style={{
                fontSize: 11,
                fontWeight: mapMode === '3d' ? 600 : 500,
                padding: '4px 12px',
                border: 'none',
                background: mapMode === '3d' ? '#ffffff' : 'transparent',
                color: mapMode === '3d' ? '#0f172a' : '#64748b',
                boxShadow: mapMode === '3d' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                borderRadius: 6,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
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
              background: '#f1f5f9',
              border: '1px solid #e2e8f0',
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
                  fontWeight: activeImagery === img.id ? 600 : 500,
                  padding: '3px 8px',
                  border: 'none',
                  background: activeImagery === img.id ? '#ffffff' : 'transparent',
                  color: activeImagery === img.id ? '#0f172a' : '#64748b',
                  boxShadow: activeImagery === img.id ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  transition: 'all 0.15s ease',
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
              fontSize: 10,
              fontWeight: 600,
              padding: '4px 9px',
              border: '1px solid',
              borderColor: terrainActive ? '#bbf7d0' : '#e2e8f0',
              background: terrainActive ? '#f0fdf4' : '#ffffff',
              color: terrainActive ? '#15803d' : '#64748b',
              borderRadius: 8,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              transition: 'all 0.15s ease',
            }}
            title="Toggle 3D Elevation Terrain Mesh"
          >
            <span>⛰️</span>
            <span>{terrainActive ? '3D DEM On' : 'Flat 2D'}</span>
          </button>

          {/* Recenter Button */}
          <button
            onClick={() => flyToUttarakhand()}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 28,
              height: 28,
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
              cursor: 'pointer',
              fontSize: 14,
              color: '#334155',
              transition: 'all 0.15s ease',
            }}
            title="Recenter Camera to Uttarakhand (Chamoli / Rudraprayag)"
          >
            ⌖
          </button>
        </div>
      </div>

      <div ref={containerRef} className="cesium-container" style={{ flex: 1, position: 'relative' }} />

      {/* Floating Apple Camera & Zoom Controls on 3D Globe */}
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
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          overflow: 'hidden',
        }}
      >
        <button
          onClick={() => zoomIn(0.4)}
          style={{
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#ffffff',
            border: 'none',
            borderBottom: '1px solid #f1f5f9',
            cursor: 'pointer',
            color: '#0f172a',
            transition: 'background 0.15s',
          }}
          title="Zoom In (+)"
        >
          <Plus size={16} />
        </button>

        <button
          onClick={() => zoomOut(0.5)}
          style={{
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#ffffff',
            border: 'none',
            borderBottom: '1px solid #f1f5f9',
            cursor: 'pointer',
            color: '#0f172a',
            transition: 'background 0.15s',
          }}
          title="Zoom Out (-)"
        >
          <Minus size={16} />
        </button>

        <button
          onClick={() => flyToFullGlobe()}
          style={{
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#ffffff',
            border: 'none',
            borderBottom: '1px solid #f1f5f9',
            cursor: 'pointer',
            color: '#0284c7',
            transition: 'background 0.15s',
          }}
          title="Full Planetary View (View Earth from Space)"
        >
          <GlobeIcon size={15} />
        </button>

        <button
          onClick={() => flyToUttarakhand()}
          style={{
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#ffffff',
            border: 'none',
            cursor: 'pointer',
            color: '#334155',
            fontSize: 14,
            fontWeight: 600,
            transition: 'background 0.15s',
          }}
          title="Recenter Camera to Uttarakhand (Chamoli / Rudraprayag)"
        >
          ⌖
        </button>
      </div>

      {/* Floating HUD Legend for GIS Layers */}
      <div
        style={{
          position: 'absolute',
          bottom: 14,
          left: 14,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(8px)',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
          borderRadius: 8,
          padding: '6px 12px',
          color: '#0f172a',
          fontSize: 11,
          fontWeight: 500,
          display: 'flex',
          gap: 14,
          alignItems: 'center',
          zIndex: 50,
          pointerEvents: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} />
          <span>At-Risk Village</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#2563eb' }} />
          <span>Safe Haven</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ display: 'inline-block', width: 12, height: 3, background: '#0284c7', borderRadius: 1 }} />
          <span>Road Corridor</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: '#10b981' }} />
          <span>IDRN Infrastructure</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#0284c7' }} />
          <span>CWC Gauge</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ display: 'inline-block', width: 10, height: 6, background: 'rgba(234, 88, 12, 0.3)', border: '1px solid #ea580c', borderRadius: 1 }} />
          <span>Hazard Polygon</span>
        </div>
      </div>
    </div>
  );
}
