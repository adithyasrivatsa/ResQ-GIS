import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import { useAppStore } from '../../store/useAppStore';

type BasemapType = 'osm' | 'satellite' | 'dark' | 'topo';

const BASEMAP_URLS: Record<BasemapType, { url: string; attribution: string; maxZoom?: number }> = {
  osm: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    maxZoom: 18,
  },
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap &copy; CARTO',
    maxZoom: 19,
  },
  topo: {
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: 'Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap (CC-BY-SA)',
    maxZoom: 17,
  },
};

const DEFAULT_CENTER: [number, number] = [30.45, 79.35];
const DEFAULT_ZOOM = 9;

export default function Map2D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const layersGroupRef = useRef<L.FeatureGroup | null>(null);
  const pathwayGroupRef = useRef<L.FeatureGroup | null>(null);

  const [activeBasemap, setActiveBasemap] = useState<BasemapType>('satellite');

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
    selectedSiteId,
    selectedRiverId,
    selectHabitation,
    selectSite,
    selectRiver,
    selectHazard,
    getSelectedHabitation,
    getLayerVisibilityMap,
    mapMode,
    setMapMode,
    selectedDistrict,
    selectedState,
  } = useAppStore();

  // Switch basemap tile layer
  const switchBasemap = useCallback((type: BasemapType) => {
    if (!mapRef.current) return;
    setActiveBasemap(type);
    if (tileLayerRef.current) {
      mapRef.current.removeLayer(tileLayerRef.current);
    }
    const def = BASEMAP_URLS[type];
    tileLayerRef.current = L.tileLayer(def.url, {
      attribution: def.attribution,
      maxZoom: def.maxZoom || 18,
    }).addTo(mapRef.current);
  }, []);

  // Initialize Leaflet map instance once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: false,
    });

    L.control.zoom({ position: 'topright' }).addTo(map);

    const initialDef = BASEMAP_URLS[activeBasemap];
    tileLayerRef.current = L.tileLayer(initialDef.url, {
      attribution: initialDef.attribution,
      maxZoom: initialDef.maxZoom || 18,
    }).addTo(map);

    layersGroupRef.current = L.featureGroup().addTo(map);
    pathwayGroupRef.current = L.featureGroup().addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // When mapMode is '2d', invalidate size to ensure tiles render immediately
  useEffect(() => {
    if (mapMode === '2d' && mapRef.current) {
      setTimeout(() => {
        mapRef.current?.invalidateSize();
      }, 50);
    }
  }, [mapMode]);

  // Center on selected items
  useEffect(() => {
    if (!mapRef.current) return;
    if (selectedHabitationId) {
      const hab = habitations.find((h) => h.id === selectedHabitationId);
      if (hab && hab.location) {
        mapRef.current.flyTo([hab.location.lat, hab.location.lng], 13, { duration: 1.2 });
      }
    } else if (selectedSiteId) {
      const site = relocationSites.find((s) => s.id === selectedSiteId);
      if (site && site.location) {
        mapRef.current.flyTo([site.location.lat, site.location.lng], 13, { duration: 1.2 });
      }
    } else if (selectedRiverId) {
      const river = riverStations.find((r) => r.id === selectedRiverId);
      if (river && river.location) {
        mapRef.current.flyTo([river.location.lat, river.location.lng], 13, { duration: 1.2 });
      }
    }
  }, [selectedHabitationId, selectedSiteId, selectedRiverId, habitations, relocationSites, riverStations]);

  // Center when administrative scope changes (district or state)
  useEffect(() => {
    if (!mapRef.current || selectedHabitationId || selectedSiteId || selectedRiverId) return;
    const distMap: Record<string, [number, number]> = {
      chamoli: [30.55, 79.55],
      rudraprayag: [30.45, 79.05],
      kinnaur: [31.65, 78.35],
      kullu: [31.95, 77.10],
      mangan: [27.50, 88.52],
      wayanad: [11.68, 76.13],
      idukki: [9.85, 76.97],
      'dima hasao': [25.40, 93.02],
      ganjam: [19.40, 84.85],
    };
    const stateMap: Record<string, [number, number]> = {
      uttarakhand: [30.4, 79.3],
      'himachal pradesh': [31.8, 77.2],
      sikkim: [27.5, 88.5],
      kerala: [10.5, 76.3],
      assam: [26.2, 92.8],
      odisha: [20.3, 85.0],
    };
    if (selectedDistrict) {
      const coords = distMap[selectedDistrict.toLowerCase().trim()];
      if (coords) {
        mapRef.current.flyTo(coords, 10, { duration: 1.2 });
        return;
      }
    }
    if (selectedState) {
      const sCoords = stateMap[selectedState.toLowerCase().trim()];
      if (sCoords) {
        mapRef.current.flyTo(sCoords, 8, { duration: 1.2 });
      }
    }
  }, [selectedDistrict, selectedState, selectedHabitationId, selectedSiteId, selectedRiverId]);



  // Render all GIS layers
  useEffect(() => {
    const group = layersGroupRef.current;
    if (!group) return;
    group.clearLayers();

    const layerVis = getLayerVisibilityMap();

    // 1. Hazard Polygons
    if (hazardLayers.length > 0) {
      hazardLayers.forEach((hz) => {
        const isVisible = layerVis[hz.type] ?? layerVis[hz.id] ?? true;
        if (!isVisible || !hz.geometry) return;

        const colorMap: Record<string, string> = {
          landslide: '#dc2626',
          flood: '#0284c7',
          glof: '#8b5cf6',
          earthquake: '#ea580c',
        };
        const color = colorMap[hz.type.toLowerCase()] || '#ea580c';

        try {
          const geoJsonLayer = L.geoJSON(hz.geometry, {
            style: {
              color,
              weight: 2,
              opacity: 0.85,
              fillColor: color,
              fillOpacity: 0.28,
            },
          });
          geoJsonLayer.bindTooltip(`<b>${hz.name.toUpperCase()}</b><br>${hz.description || ''}`, {
            sticky: true,
            className: 'retro-leaflet-tooltip',
          });
          geoJsonLayer.on('click', () => selectHazard(hz.id));
          group.addLayer(geoJsonLayer);
        } catch {
          // ignore malformed geometry
        }
      });
    }

    // 2. OSM Road Corridors
    if (layerVis['roads'] ?? true) {
      roads.forEach((road) => {
        if (!road.geometry) return;
        try {
          const roadLayer = L.geoJSON(road.geometry, {
            style: {
              color: road.isEvacuationRoute ? '#06b6d4' : '#f59e0b',
              weight: 3.5,
              opacity: 0.85,
              dashArray: road.isEvacuationRoute ? '6, 6' : undefined,
            },
          });
          roadLayer.bindTooltip(`<b>EVAC ROUTE: ${road.name}</b><br>Type: ${road.highwayType} | Status: ${road.passabilityStatus}`, {
            sticky: true,
            className: 'retro-leaflet-tooltip',
          });
          group.addLayer(roadLayer);
        } catch {
          // ignore
        }
      });
    }

    // 3. Disaster Alerts
    if (layerVis['alerts'] ?? true) {
      alerts.forEach((alert) => {
        if (!alert.geometry) return;
        try {
          const color = alert.severity === 'red' ? '#dc2626' : alert.severity === 'orange' ? '#ea580c' : '#eab308';
          const alertLayer = L.geoJSON(alert.geometry, {
            style: {
              color,
              weight: 2.5,
              opacity: 0.9,
              fillColor: color,
              fillOpacity: 0.35,
              dashArray: '4, 4',
            },
          });
          alertLayer.bindPopup(`
            <div style="font-family:'Space Mono',monospace;font-size:11px;padding:4px;">
              <div style="font-family:'Silkscreen';font-weight:700;color:${color}">⚠️ ${alert.eventType}</div>
              <div style="font-size:10px;color:#475569;margin-top:2px;">${alert.area} (${alert.source})</div>
              <div style="margin-top:4px;font-size:10px;">${alert.description}</div>
            </div>
          `);
          group.addLayer(alertLayer);
        } catch {
          // ignore
        }
      });
    }

    // 4. CWC River Monitoring Stations
    if (layerVis['rivers'] ?? true) {
      riverStations.forEach((river) => {
        const isSelected = selectedRiverId === river.id;
        const statusColor =
          river.status === 'danger' ? '#dc2626' : river.status === 'warning' ? '#ea580c' : '#0284c7';

        const icon = L.divIcon({
          className: 'retro-marker-station',
          html: `
            <div style="
              width: ${isSelected ? '26px' : '20px'};
              height: ${isSelected ? '26px' : '20px'};
              background: ${statusColor};
              border: 2px solid #000;
              box-shadow: ${isSelected ? '0 0 10px #06b6d4, 2px 2px 0px #000' : '2px 2px 0px #000'};
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #fff;
              font-family: 'Silkscreen';
              font-size: 8px;
              cursor: pointer;
            ">
              💧
            </div>
          `,
          iconSize: [isSelected ? 26 : 20, isSelected ? 26 : 20],
          iconAnchor: [isSelected ? 13 : 10, isSelected ? 13 : 10],
        });

        const marker = L.marker([river.location.lat, river.location.lng], { icon });
        marker.bindTooltip(`<b>${river.name}</b><br>Stage: ${river.waterLevel ?? '—'}m (Warn: ${river.warningLevel}m)`, {
          className: 'retro-leaflet-tooltip',
        });
        marker.on('click', () => selectRiver(river.id));
        group.addLayer(marker);
      });
    }

    // 5. IDRN Emergency Shelters & Infrastructure
    if (layerVis['emergency-resources'] ?? true) {
      emergencyResources.forEach((res) => {
        const icon = L.divIcon({
          className: 'retro-marker-idrn',
          html: `
            <div style="
              width: 18px;
              height: 18px;
              background: #10b981;
              border: 2px solid #000;
              box-shadow: 2px 2px 0px #000;
              border-radius: 4px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #fff;
              font-size: 10px;
              cursor: pointer;
            ">
              ⛑️
            </div>
          `,
          iconSize: [18, 18],
          iconAnchor: [9, 9],
        });

        const marker = L.marker([res.location.lat, res.location.lng], { icon });
        marker.bindTooltip(`<b>IDRN: ${res.name}</b><br>Type: ${res.resourceType} | Cap: ${res.capacity}`, {
          className: 'retro-leaflet-tooltip',
        });
        group.addLayer(marker);
      });
    }

    // 6. Safe Haven Relocation Sites
    if (layerVis['relocation-sites'] ?? true) {
      relocationSites.forEach((site) => {
        const isSelected = selectedSiteId === site.id;
        const icon = L.divIcon({
          className: 'retro-marker-site',
          html: `
            <div style="
              min-width: ${isSelected ? '32px' : '26px'};
              height: ${isSelected ? '32px' : '26px'};
              background: #2563eb;
              border: 2.5px solid #000000;
              box-shadow: ${isSelected ? '0 0 12px #38bdf8, 3px 3px 0px #000000' : '2px 2px 0px #000000'};
              border-radius: 6px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #ffffff;
              font-family: 'Silkscreen';
              font-size: ${isSelected ? '12px' : '10px'};
              cursor: pointer;
              transform: ${isSelected ? 'scale(1.15)' : 'none'};
              transition: transform 0.15s;
            ">
              🏰
            </div>
          `,
          iconSize: [isSelected ? 32 : 26, isSelected ? 32 : 26],
          iconAnchor: [isSelected ? 16 : 13, isSelected ? 16 : 13],
        });

        const marker = L.marker([site.location.lat, site.location.lng], { icon, zIndexOffset: 200 });
        marker.bindTooltip(
          `<b>SAFE HAVEN: ${site.name.toUpperCase()}</b><br>Capacity: ${site.capacity.toLocaleString()} | Suitability: ${site.suitabilityScore.toFixed(2)}`,
          { className: 'retro-leaflet-tooltip' }
        );
        marker.on('click', () => selectSite(site.id));
        group.addLayer(marker);
      });
    }

    // 7. At-Risk Habitations
    if (layerVis['habitations'] ?? true) {
      habitations.forEach((hab) => {
        const isSelected = selectedHabitationId === hab.id;
        const riskColor =
          hab.riskScore >= 0.75
            ? '#dc2626'
            : hab.riskScore >= 0.65
            ? '#ea580c'
            : hab.riskScore >= 0.5
            ? '#eab308'
            : '#10b981';

        const icon = L.divIcon({
          className: 'retro-marker-hab',
          html: `
            <div style="
              width: ${isSelected ? '30px' : '22px'};
              height: ${isSelected ? '30px' : '22px'};
              background: ${riskColor};
              border: 2px solid #000000;
              box-shadow: ${isSelected ? '0 0 12px #ff2a85, 3px 3px 0px #000000' : '2px 2px 0px #000000'};
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #ffffff;
              font-family: 'Space Mono';
              font-weight: 800;
              font-size: ${isSelected ? '10px' : '8px'};
              cursor: pointer;
              transform: ${isSelected ? 'scale(1.2)' : 'none'};
              transition: transform 0.15s;
            ">
              ${(hab.riskScore * 100).toFixed(0)}
            </div>
          `,
          iconSize: [isSelected ? 30 : 22, isSelected ? 30 : 22],
          iconAnchor: [isSelected ? 15 : 11, isSelected ? 15 : 11],
        });

        const marker = L.marker([hab.location.lat, hab.location.lng], { icon, zIndexOffset: isSelected ? 500 : 300 });
        marker.bindTooltip(
          `<b>${hab.name.toUpperCase()} (${hab.district})</b><br>Risk: ${hab.riskScore.toFixed(2)} (${hab.riskLevel})<br>Pop: ${hab.population.toLocaleString()}`,
          { className: 'retro-leaflet-tooltip' }
        );
        marker.on('click', () => selectHabitation(hab.id));
        group.addLayer(marker);
      });
    }
  }, [
    habitations,
    relocationSites,
    riverStations,
    hazardLayers,
    alerts,
    roads,
    emergencyResources,
    selectedHabitationId,
    selectedSiteId,
    selectedRiverId,
    layers,
    getLayerVisibilityMap,
    selectHabitation,
    selectSite,
    selectRiver,
    selectHazard,
  ]);

  // Render relocation pathway corridor when a habitation is selected
  useEffect(() => {
    const pGroup = pathwayGroupRef.current;
    if (!pGroup) return;
    pGroup.clearLayers();

    if (!selectedHabitationId) return;
    const hab = getSelectedHabitation();
    if (!hab || !hab.nearestRelocationSite) return;

    const site = relocationSites.find((s) => s.id === hab.nearestRelocationSite);
    if (!site || !hab.location || !site.location) return;

    const start: [number, number] = [hab.location.lat, hab.location.lng];
    const end: [number, number] = [site.location.lat, site.location.lng];

    // Background glow line
    const glowLine = L.polyline([start, end], {
      color: '#f59e0b',
      weight: 6,
      opacity: 0.45,
    });
    // Dashed primary corridor line
    const mainLine = L.polyline([start, end], {
      color: '#06b6d4',
      weight: 3.5,
      dashArray: '8, 8',
      opacity: 0.95,
    });

    mainLine.bindTooltip(
      `<b>RELOCATION CORRIDOR</b><br>From: ${hab.name}<br>To Safe Haven: ${site.name}`,
      { sticky: true, className: 'retro-leaflet-tooltip' }
    );

    pGroup.addLayer(glowLine);
    pGroup.addLayer(mainLine);
  }, [selectedHabitationId, habitations, relocationSites, getSelectedHabitation]);

  const recenterMap = () => {
    if (mapRef.current) {
      mapRef.current.flyTo(DEFAULT_CENTER, DEFAULT_ZOOM, { duration: 1.2 });
    }
  };

  return (
    <div className="retro-window" style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', position: 'relative' }}>
      {/* Titlebar with prominent 2D Map / 3D Globe Tabs */}
      <div className="retro-titlebar retro-titlebar--orange" style={{ borderBottom: '3px solid #000' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>🗺️ RADAR_TACTICAL_2D.EXE</span>
          <span
            style={{
              fontFamily: 'Space Mono',
              fontSize: 9,
              fontWeight: 800,
              background: '#000000',
              color: '#38bdf8',
              padding: '1px 6px',
              borderRadius: 3,
            }}
          >
            LEAFLET 2D VECTOR ENGINE
          </span>
        </div>

        {/* View Mode Switcher Tabs + Basemap & Camera Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Spatial Mode Switcher Tabs */}
          <div style={{ display: 'flex', background: '#000000', border: '2px solid #000', borderRadius: 5, padding: 2, gap: 2 }}>
            <button
              onClick={() => setMapMode('2d')}
              style={{
                fontFamily: 'Silkscreen',
                fontSize: 9,
                fontWeight: 700,
                padding: '2px 8px',
                border: 'none',
                background: mapMode === '2d' ? '#38bdf8' : 'transparent',
                color: mapMode === '2d' ? '#000000' : '#ffffff',
                borderRadius: 3,
                cursor: 'pointer',
              }}
              title="Switch to High-Performance 2D Vector Slippy Map"
            >
              🗺️ 2D MAP
            </button>
            <button
              onClick={() => setMapMode('3d')}
              style={{
                fontFamily: 'Silkscreen',
                fontSize: 9,
                fontWeight: 700,
                padding: '2px 8px',
                border: 'none',
                background: mapMode === '3d' ? '#a78bfa' : 'transparent',
                color: mapMode === '3d' ? '#000000' : '#ffffff',
                borderRadius: 3,
                cursor: 'pointer',
              }}
              title="Switch to 3D CesiumJS Elevation Terrain Globe"
            >
              🌐 3D GLOBE
            </button>
          </div>

          {/* Quick Basemap Switcher */}
          <div style={{ display: 'flex', background: '#ffffff', border: '1.5px solid #000', borderRadius: 4, padding: 1, gap: 2 }}>
            <button
              onClick={() => switchBasemap('satellite')}
              style={{
                fontFamily: 'Silkscreen',
                fontSize: 8,
                padding: '1px 5px',
                border: 'none',
                background: activeBasemap === 'satellite' ? '#ea580c' : 'transparent',
                color: activeBasemap === 'satellite' ? '#fff' : '#000',
                borderRadius: 2,
                cursor: 'pointer',
              }}
              title="High-Resolution Satellite Imagery"
            >
              SAT
            </button>
            <button
              onClick={() => switchBasemap('osm')}
              style={{
                fontFamily: 'Silkscreen',
                fontSize: 8,
                padding: '1px 5px',
                border: 'none',
                background: activeBasemap === 'osm' ? '#ea580c' : 'transparent',
                color: activeBasemap === 'osm' ? '#fff' : '#000',
                borderRadius: 2,
                cursor: 'pointer',
              }}
              title="OpenStreetMap Standard Vector Base"
            >
              OSM
            </button>
            <button
              onClick={() => switchBasemap('dark')}
              style={{
                fontFamily: 'Silkscreen',
                fontSize: 8,
                padding: '1px 5px',
                border: 'none',
                background: activeBasemap === 'dark' ? '#ea580c' : 'transparent',
                color: activeBasemap === 'dark' ? '#fff' : '#000',
                borderRadius: 2,
                cursor: 'pointer',
              }}
              title="CartoDB Dark Matter GIS"
            >
              DARK
            </button>
            <button
              onClick={() => switchBasemap('topo')}
              style={{
                fontFamily: 'Silkscreen',
                fontSize: 8,
                padding: '1px 5px',
                border: 'none',
                background: activeBasemap === 'topo' ? '#ea580c' : 'transparent',
                color: activeBasemap === 'topo' ? '#fff' : '#000',
                borderRadius: 2,
                cursor: 'pointer',
              }}
              title="Topographic Relief & Elevation Contours"
            >
              TOPO
            </button>
          </div>

          {/* Recenter & Window Buttons */}
          <div className="retro-win-controls" style={{ marginLeft: 4 }}>
            <button
              className="retro-win-btn"
              title="Recenter Camera to Uttarakhand (Chamoli / Rudraprayag)"
              onClick={recenterMap}
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

      {/* Leaflet Map Div */}
      <div ref={containerRef} style={{ flex: 1, width: '100%', height: '100%', position: 'relative', zIndex: 1 }} />
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
          zIndex: 500,
          pointerEvents: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#dc2626' }} />
          <span>At-Risk Village</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#2563eb' }} />
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
          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#0284c7' }} />
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
