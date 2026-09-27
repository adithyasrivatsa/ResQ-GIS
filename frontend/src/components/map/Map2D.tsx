import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import L from 'leaflet';
import {
  Search,
  Maximize2,
  Plus,
  Minus,
  Crosshair,
  Layers,
  Ruler,
  X,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

type BasemapType = 'osm' | 'satellite' | 'dark' | 'topo';

const BASEMAP_URLS: Record<BasemapType, { url: string; attribution: string; maxZoom?: number; labelUrl?: string }> = {
  osm: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    maxZoom: 18,
    labelUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
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
  const labelLayerRef = useRef<L.TileLayer | null>(null);
  const layersGroupRef = useRef<L.FeatureGroup | null>(null);
  const pathwayGroupRef = useRef<L.FeatureGroup | null>(null);

  const [activeBasemap, setActiveBasemap] = useState<BasemapType>('satellite');
  const [showLabels] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [basemapMenuOpen, setBasemapMenuOpen] = useState(false);
  const [measuringMode, setMeasuringMode] = useState(false);

  // Local layer visibility toggles matching the tactical LAYERS card
  const [layerVisibility, setLayerVisibility] = useState<Record<string, boolean>>({
    landslide: true,
    flood: true,
    rainfall: true,
    rivers: true,
    habitations: true,
    relocation_sites: true,
    roads: true,
    district_boundaries: false,
    block_boundaries: false,
  });

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
    toggleLayer,
  } = useAppStore();

  const toggleLocalLayer = (key: string) => {
    setLayerVisibility((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      toggleLayer(key);
      return updated;
    });
  };

  // Search results for floating search bar
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return habitations
      .filter((h) => h.name.toLowerCase().includes(q) || (h.block && h.block.toLowerCase().includes(q)))
      .slice(0, 8);
  }, [habitations, searchQuery]);

  const handleSelectHabitation = (h: typeof habitations[0]) => {
    if (mapRef.current && h.location) {
      mapRef.current.flyTo([h.location.lat, h.location.lng], 13, { duration: 1.2 });
    }
    selectHabitation(h.id);
    setSearchQuery(h.name);
    setSearchFocused(false);
  };

  const handleSearchSubmit = () => {
    if (!searchQuery.trim()) return;
    const coordParts = searchQuery.split(',').map((p) => parseFloat(p.trim()));
    if (coordParts.length === 2 && !isNaN(coordParts[0]) && !isNaN(coordParts[1])) {
      if (mapRef.current) {
        mapRef.current.flyTo([coordParts[0], coordParts[1]], 13, { duration: 1.2 });
      }
      setSearchFocused(false);
      return;
    }
    if (searchResults.length > 0) {
      handleSelectHabitation(searchResults[0]);
    }
  };

  // Switch basemap tile layer
  const switchBasemap = useCallback((type: BasemapType) => {
    if (!mapRef.current) return;
    setActiveBasemap(type);
    if (tileLayerRef.current) {
      mapRef.current.removeLayer(tileLayerRef.current);
      tileLayerRef.current = null;
    }
    if (labelLayerRef.current) {
      mapRef.current.removeLayer(labelLayerRef.current);
      labelLayerRef.current = null;
    }
    const def = BASEMAP_URLS[type];
    tileLayerRef.current = L.tileLayer(def.url, {
      attribution: def.attribution,
      maxZoom: def.maxZoom || 18,
    }).addTo(mapRef.current);

    if (def.labelUrl && showLabels) {
      labelLayerRef.current = L.tileLayer(def.labelUrl, {
        maxZoom: def.maxZoom || 18,
        pane: 'overlayPane',
      }).addTo(mapRef.current);
    }
  }, [showLabels]);

  // Synchronize reference label layer when showLabels or activeBasemap changes
  useEffect(() => {
    if (!mapRef.current) return;
    const def = BASEMAP_URLS[activeBasemap];
    if (showLabels && def.labelUrl && !labelLayerRef.current) {
      labelLayerRef.current = L.tileLayer(def.labelUrl, {
        maxZoom: def.maxZoom || 18,
        pane: 'overlayPane',
      }).addTo(mapRef.current);
    } else if (!showLabels && labelLayerRef.current) {
      mapRef.current.removeLayer(labelLayerRef.current);
      labelLayerRef.current = null;
    }
  }, [showLabels, activeBasemap]);

  // Initialize Leaflet map instance once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: false,
    });

    const initialDef = BASEMAP_URLS[activeBasemap];
    tileLayerRef.current = L.tileLayer(initialDef.url, {
      attribution: initialDef.attribution,
      maxZoom: initialDef.maxZoom || 18,
    }).addTo(map);

    if (initialDef.labelUrl && showLabels) {
      labelLayerRef.current = L.tileLayer(initialDef.labelUrl, {
        maxZoom: initialDef.maxZoom || 18,
        pane: 'overlayPane',
      }).addTo(map);
    }

    layersGroupRef.current = L.featureGroup().addTo(map);
    pathwayGroupRef.current = L.featureGroup().addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      labelLayerRef.current = null;
      tileLayerRef.current = null;
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
            <div style="font-family:-apple-system,BlinkMacSystemFont,'Inter',sans-serif;font-size:11px;padding:4px;">
              <div style="font-weight:700;color:${color}">⚠️ ${alert.eventType}</div>
              <div style="font-size:10px;color:#475569;margin-top:2px;">${alert.area} (${alert.source})</div>
              <div style="margin-top:4px;font-size:10px;line-height:1.4;">${alert.description}</div>
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
          river.status === 'danger' ? '#ff2a85' : river.status === 'warning' ? '#fb923c' : '#38bdf8';
        const circleSize = isSelected ? 26 : 20;

        const icon = L.divIcon({
          className: 'retro-marker-station',
          html: `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: flex-start; width: 140px; pointer-events: auto; user-select: none;">
              <div style="
                width: ${circleSize}px;
                height: ${circleSize}px;
                background: ${statusColor};
                border: 2px solid #000000;
                box-shadow: ${isSelected ? '0 0 0 2px #fde047, 3px 3px 0px #000000' : '2px 2px 0px #000000'};
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #000000;
                font-size: ${isSelected ? '11px' : '9px'};
                font-weight: 900;
                cursor: pointer;
              ">
                💧
              </div>
              ${
                showLabels
                  ? `<div style="
                      margin-top: 2px;
                      background: #ffffff;
                      color: #000000;
                      font-size: 10px;
                      font-weight: 800;
                      font-family: var(--font-sans);
                      padding: 1px 7px;
                      border-radius: 6px;
                      border: 1.5px solid #000000;
                      box-shadow: 2px 2px 0px #000000;
                      white-space: nowrap;
                      letter-spacing: -0.01em;
                      line-height: 1.35;
                      pointer-events: none;
                    ">
                      ${river.name}
                    </div>`
                  : ''
              }
            </div>
          `,
          iconSize: [140, showLabels ? 42 : circleSize],
          iconAnchor: [70, circleSize / 2],
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
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: flex-start; width: 140px; pointer-events: auto; user-select: none;">
              <div style="
                width: 20px;
                height: 20px;
                background: #a3e635;
                border: 2px solid #000000;
                box-shadow: 2px 2px 0px #000000;
                border-radius: 4px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #000000;
                font-size: 11px;
                cursor: pointer;
              ">
                ⛑️
              </div>
              ${
                showLabels
                  ? `<div style="
                      margin-top: 2px;
                      background: #ffffff;
                      color: #000000;
                      font-size: 10px;
                      font-weight: 800;
                      font-family: var(--font-sans);
                      padding: 1px 7px;
                      border-radius: 6px;
                      border: 1.5px solid #000000;
                      box-shadow: 2px 2px 0px #000000;
                      white-space: nowrap;
                      letter-spacing: -0.01em;
                      line-height: 1.35;
                      pointer-events: none;
                    ">
                      ${res.name}
                    </div>`
                  : ''
              }
            </div>
          `,
          iconSize: [140, showLabels ? 40 : 20],
          iconAnchor: [70, 10],
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
        const boxSize = isSelected ? 30 : 24;
        const icon = L.divIcon({
          className: 'retro-marker-site',
          html: `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: flex-start; width: 140px; pointer-events: auto; user-select: none;">
              <div style="
                width: ${boxSize}px;
                height: ${boxSize}px;
                background: var(--nb-mint);
                border: 2px solid #000000;
                box-shadow: ${isSelected ? '0 0 0 2px #fde047, 3px 3px 0px #000000' : '2px 2px 0px #000000'};
                border-radius: 6px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #000000;
                font-size: ${isSelected ? '13px' : '11px'};
                cursor: pointer;
                transition: transform 0.1s ease;
              ">
                🏰
              </div>
              ${
                showLabels
                  ? `<div style="
                      margin-top: 3px;
                      background: var(--nb-mint);
                      color: #000000;
                      font-size: 10px;
                      font-weight: 800;
                      font-family: var(--font-sans);
                      padding: 1px 7px;
                      border-radius: 6px;
                      border: 1.5px solid #000000;
                      box-shadow: 2px 2px 0px #000000;
                      white-space: nowrap;
                      letter-spacing: -0.01em;
                      line-height: 1.35;
                      pointer-events: none;
                    ">
                      ${site.name}
                    </div>`
                  : ''
              }
            </div>
          `,
          iconSize: [140, showLabels ? 48 : boxSize],
          iconAnchor: [70, boxSize / 2],
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
            ? '#ff2a85'
            : hab.riskScore >= 0.65
            ? '#fb923c'
            : hab.riskScore >= 0.5
            ? '#fde047'
            : '#a3e635';

        const circleSize = isSelected ? 30 : 24;
        const icon = L.divIcon({
          className: 'retro-marker-hab',
          html: `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: flex-start; width: 140px; pointer-events: auto; user-select: none;">
              <div style="
                width: ${circleSize}px;
                height: ${circleSize}px;
                background: ${riskColor};
                border: 2px solid #000000;
                box-shadow: ${isSelected ? '0 0 0 2px #000000, 3px 3px 0px #000000' : '2px 2px 0px #000000'};
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: ${hab.riskScore >= 0.75 ? '#ffffff' : '#000000'};
                font-family: var(--font-sans);
                font-weight: 900;
                font-size: ${isSelected ? '11px' : '10px'};
                cursor: pointer;
                transition: transform 0.1s ease;
              ">
                ${(hab.riskScore * 100).toFixed(0)}
              </div>
              ${
                showLabels
                  ? `<div style="
                      margin-top: 3px;
                      background: #ffffff;
                      color: #000000;
                      font-size: 11px;
                      font-weight: 800;
                      font-family: var(--font-sans);
                      padding: 1px 7px;
                      border-radius: 6px;
                      border: 2px solid #000000;
                      box-shadow: 2px 2px 0px #000000;
                      white-space: nowrap;
                      letter-spacing: -0.01em;
                      line-height: 1.35;
                      pointer-events: none;
                    ">
                      ${hab.name}
                    </div>`
                  : ''
              }
            </div>
          `,
          iconSize: [140, showLabels ? 48 : circleSize],
          iconAnchor: [70, circleSize / 2],
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
    layerVisibility,
    showLabels,
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
  const toolBtnStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    background: '#ffffff',
    border: '2px solid #000000',
    borderRadius: 8,
    boxShadow: '2px 2px 0px #000000',
    cursor: 'pointer',
    fontSize: 16,
    fontWeight: 900,
    color: '#000000',
    transition: 'all 0.1s ease',
  };

  const layerRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    cursor: 'pointer',
    fontSize: 10,
    fontWeight: 700,
    color: '#000000',
    userSelect: 'none',
  };

  const checkboxStyle: React.CSSProperties = {
    accentColor: '#0284c7',
    cursor: 'pointer',
    width: 13,
    height: 13,
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        position: 'relative',
        background: '#0f172a',
        overflow: 'hidden',
      }}
    >
      {/* 1. Underlying Leaflet Map Canvas */}
      <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 1 }} />

      {/* 2. Top-Left Floating Badge: GIS MAP VIEW + 2D/3D Mode Switcher */}
      <div
        style={{
          position: 'absolute',
          top: 10,
          left: 10,
          zIndex: 500,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            background: '#38bdf8',
            border: '2.5px solid #000000',
            boxShadow: '2.5px 2.5px 0px #000000',
            borderRadius: 8,
            padding: '5px 10px',
            color: '#000000',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 12,
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '-0.2px',
            }}
          >
            GIS MAP VIEW
          </span>
          <button
            onClick={() => {
              if (containerRef.current) {
                if (!document.fullscreenElement) {
                  containerRef.current.parentElement?.requestFullscreen?.();
                } else {
                  document.exitFullscreen?.();
                }
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#000000',
              color: '#ffffff',
              border: 'none',
              borderRadius: 4,
              width: 20,
              height: 20,
              cursor: 'pointer',
            }}
            title="Toggle Fullscreen"
          >
            <Maximize2 size={12} strokeWidth={2.5} />
          </button>
        </div>

        {/* 2D / 3D Switcher Pill */}
        <div
          style={{
            display: 'flex',
            background: '#ffffff',
            border: '2px solid #000000',
            boxShadow: '2px 2px 0px #000000',
            borderRadius: 8,
            padding: 2,
          }}
        >
          <button
            onClick={() => setMapMode('2d')}
            style={{
              padding: '3px 8px',
              fontSize: 10,
              fontWeight: 900,
              background: mapMode === '2d' ? '#2dd4bf' : 'transparent',
              border: mapMode === '2d' ? '1.5px solid #000000' : '1.5px solid transparent',
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            2D
          </button>
          <button
            onClick={() => setMapMode('3d')}
            style={{
              padding: '3px 8px',
              fontSize: 10,
              fontWeight: 900,
              background: mapMode === '3d' ? '#2dd4bf' : 'transparent',
              border: mapMode === '3d' ? '1.5px solid #000000' : '1.5px solid transparent',
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            3D
          </button>
        </div>
      </div>

      {/* 3. Top-Center Floating Search Bar */}
      <div
        style={{
          position: 'absolute',
          top: 10,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 500,
          width: 360,
          maxWidth: '85%',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: '#ffffff',
            border: '2.5px solid #000000',
            boxShadow: '3px 3px 0px #000000',
            borderRadius: 8,
            padding: '5px 12px',
          }}
        >
          <Search size={15} strokeWidth={2.5} color="#000000" />
          <input
            type="text"
            placeholder="Search village, location, or coordinates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSearchSubmit();
            }}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontFamily: 'var(--font-sans)',
              fontSize: 11,
              fontWeight: 700,
              color: '#000000',
              background: 'transparent',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSearchFocused(false);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: 0,
              }}
            >
              <X size={13} strokeWidth={3} color="#000000" />
            </button>
          )}
        </div>

        {/* Search Results Autocomplete Dropdown */}
        {searchFocused && searchResults.length > 0 && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 4px)',
              left: 0,
              right: 0,
              background: '#ffffff',
              border: '2px solid #000000',
              boxShadow: '3px 3px 0px #000000',
              borderRadius: 8,
              maxHeight: 220,
              overflowY: 'auto',
              zIndex: 600,
            }}
          >
            {searchResults.map((h) => (
              <div
                key={h.id}
                onClick={() => handleSelectHabitation(h)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 10px',
                  borderBottom: '1px solid #e5e7eb',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#fef08a')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#ffffff')}
              >
                <div>
                  <div style={{ fontWeight: 800, fontSize: 11, color: '#000000' }}>{h.name}</div>
                  <div style={{ fontSize: 9, color: '#6b7280' }}>
                    {h.block || 'Chamoli'} • Pop: {h.population.toLocaleString()}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 800,
                    padding: '1px 6px',
                    borderRadius: 4,
                    border: '1px solid #000000',
                    background: h.riskScore >= 0.7 ? '#ef4444' : h.riskScore >= 0.5 ? '#fde047' : '#86efac',
                    color: h.riskScore >= 0.7 ? '#ffffff' : '#000000',
                  }}
                >
                  {h.riskLevel}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Left Vertical Tool Stack */}
      <div
        style={{
          position: 'absolute',
          top: 54,
          left: 10,
          zIndex: 500,
          display: 'flex',
          flexDirection: 'column',
          gap: 5,
        }}
      >
        {/* Zoom In */}
        <button
          onClick={() => mapRef.current?.zoomIn()}
          style={toolBtnStyle}
          title="Zoom In (+)"
          onMouseEnter={(e) => (e.currentTarget.style.background = '#fde047')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#ffffff')}
        >
          <Plus size={16} strokeWidth={3} />
        </button>

        {/* Zoom Out */}
        <button
          onClick={() => mapRef.current?.zoomOut()}
          style={toolBtnStyle}
          title="Zoom Out (−)"
          onMouseEnter={(e) => (e.currentTarget.style.background = '#fde047')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#ffffff')}
        >
          <Minus size={16} strokeWidth={3} />
        </button>

        {/* Recenter */}
        <button
          onClick={recenterMap}
          style={toolBtnStyle}
          title="Recenter to Chamoli"
          onMouseEnter={(e) => (e.currentTarget.style.background = '#fde047')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#ffffff')}
        >
          <Crosshair size={16} strokeWidth={2.5} />
        </button>

        {/* Basemap Switcher */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setBasemapMenuOpen((prev) => !prev)}
            style={{
              ...toolBtnStyle,
              background: basemapMenuOpen ? '#fde047' : '#ffffff',
            }}
            title="Switch Basemap (Satellite / OSM / Topo / Dark)"
          >
            <Layers size={16} strokeWidth={2.5} />
          </button>

          {/* Basemap Flyout */}
          {basemapMenuOpen && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 'calc(100% + 6px)',
                display: 'flex',
                flexDirection: 'column',
                background: '#ffffff',
                border: '2px solid #000000',
                boxShadow: '3px 3px 0px #000000',
                borderRadius: 8,
                padding: 4,
                gap: 4,
                zIndex: 700,
                width: 100,
              }}
            >
              {(['satellite', 'osm', 'topo', 'dark'] as BasemapType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    switchBasemap(t);
                    setBasemapMenuOpen(false);
                  }}
                  style={{
                    padding: '4px 8px',
                    fontSize: 10,
                    fontWeight: 800,
                    textAlign: 'left',
                    background: activeBasemap === t ? '#38bdf8' : 'transparent',
                    border: activeBasemap === t ? '1.5px solid #000000' : '1.5px solid transparent',
                    borderRadius: 4,
                    cursor: 'pointer',
                    textTransform: 'uppercase',
                  }}
                >
                  {t === 'satellite' ? 'Satellite' : t === 'osm' ? 'Vector OSM' : t === 'topo' ? 'Topo' : 'Dark'}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Measure Tool */}
        <button
          onClick={() => setMeasuringMode((prev) => !prev)}
          style={{
            ...toolBtnStyle,
            background: measuringMode ? '#ff2a85' : '#ffffff',
            color: measuringMode ? '#ffffff' : '#000000',
          }}
          title="Measure Tool"
        >
          <Ruler size={16} strokeWidth={2.5} />
        </button>
      </div>

      {/* 5. Top-Right Floating LAYERS Card */}
      <div
        style={{
          position: 'absolute',
          top: 10,
          right: 10,
          zIndex: 500,
          width: 200,
          background: '#ffffff',
          border: '2.5px solid #000000',
          boxShadow: '3px 3px 0px #000000',
          borderRadius: 10,
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#7dd3fc',
            padding: '5px 10px',
            borderBottom: '2px solid #000000',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 11,
              fontWeight: 900,
              color: '#000000',
              textTransform: 'uppercase',
              letterSpacing: '0.4px',
            }}
          >
            LAYERS
          </span>
          <span
            style={{
              fontSize: 8,
              fontWeight: 800,
              background: '#000000',
              color: '#ffffff',
              padding: '1px 5px',
              borderRadius: 3,
            }}
          >
            GIS
          </span>
        </div>

        {/* Checkbox Rows */}
        <div style={{ display: 'flex', flexDirection: 'column', padding: '6px 8px', gap: 4 }}>
          {/* 1. Landslide Susceptibility */}
          <label style={layerRowStyle}>
            <input
              type="checkbox"
              checked={Boolean(layerVisibility['landslide'])}
              onChange={() => toggleLocalLayer('landslide')}
              style={checkboxStyle}
            />
            <span style={{ display: 'inline-block', width: 9, height: 9, background: '#ef4444', border: '1px solid #000000', borderRadius: 2 }} />
            <span>Landslide Susceptibility</span>
          </label>

          {/* 2. Flood Inundation */}
          <label style={layerRowStyle}>
            <input
              type="checkbox"
              checked={Boolean(layerVisibility['flood'])}
              onChange={() => toggleLocalLayer('flood')}
              style={checkboxStyle}
            />
            <span style={{ display: 'inline-block', width: 9, height: 9, background: '#3b82f6', border: '1px solid #000000', borderRadius: 2 }} />
            <span>Flood Inundation (Forecast)</span>
          </label>

          {/* 3. Rainfall (IMD) */}
          <label style={layerRowStyle}>
            <input
              type="checkbox"
              checked={Boolean(layerVisibility['rainfall'])}
              onChange={() => toggleLocalLayer('rainfall')}
              style={checkboxStyle}
            />
            <span style={{ display: 'inline-block', width: 9, height: 9, background: '#f97316', border: '1px solid #000000', borderRadius: 2 }} />
            <span>Rainfall (IMD)</span>
          </label>

          {/* 4. River Gauge (CWC) */}
          <label style={layerRowStyle}>
            <input
              type="checkbox"
              checked={Boolean(layerVisibility['rivers'])}
              onChange={() => toggleLocalLayer('rivers')}
              style={checkboxStyle}
            />
            <span style={{ display: 'inline-block', width: 9, height: 9, borderRadius: '50%', background: '#0284c7', border: '1px solid #000000' }} />
            <span>River Gauge (CWC)</span>
          </label>

          {/* 5. Habitations */}
          <label style={layerRowStyle}>
            <input
              type="checkbox"
              checked={Boolean(layerVisibility['habitations'])}
              onChange={() => toggleLocalLayer('habitations')}
              style={checkboxStyle}
            />
            <span style={{ fontSize: 10 }}>🏠</span>
            <span>Habitations</span>
          </label>

          {/* 6. Relocation Sites */}
          <label style={layerRowStyle}>
            <input
              type="checkbox"
              checked={Boolean(layerVisibility['relocation_sites'])}
              onChange={() => toggleLocalLayer('relocation_sites')}
              style={checkboxStyle}
            />
            <span style={{ fontSize: 10 }}>🛖</span>
            <span>Relocation Sites</span>
          </label>

          {/* 7. Road Network (OSM) */}
          <label style={layerRowStyle}>
            <input
              type="checkbox"
              checked={Boolean(layerVisibility['roads'])}
              onChange={() => toggleLocalLayer('roads')}
              style={checkboxStyle}
            />
            <span style={{ display: 'inline-block', width: 11, height: 3, background: '#0ea5e9', border: '1px solid #000000' }} />
            <span>Road Network (OSM)</span>
          </label>

          {/* 8. District Boundary */}
          <label style={layerRowStyle}>
            <input
              type="checkbox"
              checked={Boolean(layerVisibility['district_boundaries'])}
              onChange={() => toggleLocalLayer('district_boundaries')}
              style={checkboxStyle}
            />
            <span style={{ display: 'inline-block', width: 9, height: 9, border: '1px dashed #000000', borderRadius: 2 }} />
            <span>District Boundary</span>
          </label>

          {/* 9. Block Boundary */}
          <label style={layerRowStyle}>
            <input
              type="checkbox"
              checked={Boolean(layerVisibility['block_boundaries'])}
              onChange={() => toggleLocalLayer('block_boundaries')}
              style={checkboxStyle}
            />
            <span style={{ display: 'inline-block', width: 9, height: 9, border: '1px dashed #6b7280', borderRadius: 2 }} />
            <span>Block Boundary</span>
          </label>
        </div>
      </div>

      {/* 6. Bottom-Left Scale Bar */}
      <div
        style={{
          position: 'absolute',
          bottom: 12,
          left: 12,
          zIndex: 500,
          display: 'flex',
          flexDirection: 'column',
          background: 'rgba(0, 0, 0, 0.78)',
          border: '1.5px solid #000000',
          borderRadius: 4,
          padding: '3px 8px',
          color: '#ffffff',
          fontSize: 9,
          fontFamily: 'var(--font-mono)',
          fontWeight: 700,
          pointerEvents: 'none',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', width: 120 }}>
          <span>0</span>
          <span>5</span>
          <span>10</span>
          <span>20 km</span>
        </div>
        <div
          style={{
            display: 'flex',
            width: 120,
            height: 4,
            border: '1px solid #ffffff',
            marginTop: 2,
          }}
        >
          <div style={{ flex: 1, background: '#ffffff' }} />
          <div style={{ flex: 1, background: '#000000' }} />
          <div style={{ flex: 1, background: '#ffffff' }} />
          <div style={{ flex: 1, background: '#000000' }} />
        </div>
      </div>

      {/* 7. Bottom-Right Uttarakhand Inset Locator Mini-Map */}
      <div
        style={{
          position: 'absolute',
          bottom: 12,
          right: 12,
          zIndex: 500,
          width: 125,
          background: '#1e293b',
          border: '2px solid #000000',
          boxShadow: '3px 3px 0px #000000',
          borderRadius: 8,
          padding: '4px 6px',
          color: '#ffffff',
        }}
      >
        <div
          style={{
            fontSize: 8,
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '0.4px',
            color: '#fde047',
            textAlign: 'center',
            borderBottom: '1px solid #334155',
            paddingBottom: 2,
            marginBottom: 3,
          }}
        >
          UTTARAKHAND
        </div>
        <div style={{ position: 'relative', width: '100%', height: 55, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="100%" height="100%" viewBox="0 0 120 70">
            {/* State outline */}
            <polygon
              points="20,15 45,8 85,12 110,35 95,65 50,60 25,48 15,30"
              fill="#334155"
              stroke="#94a3b8"
              strokeWidth="1.5"
            />
            {/* Chamoli district highlighted in red/pink */}
            <polygon
              points="55,18 78,20 85,38 65,45 52,32"
              fill="#ef4444"
              stroke="#000000"
              strokeWidth="1"
            />
            {/* District center marker */}
            <circle cx="68" cy="28" r="2.5" fill="#fde047" stroke="#000000" strokeWidth="0.8" />

            {/* India locator inset in corner */}
            <rect x="86" y="42" width="28" height="24" fill="#0f172a" stroke="#64748b" strokeWidth="0.8" rx="2" />
            <polygon points="94,45 106,45 108,55 100,63 94,54" fill="#475569" stroke="#94a3b8" strokeWidth="0.5" />
            <circle cx="98" cy="48" r="1.5" fill="#ef4444" />
          </svg>
        </div>
      </div>
    </div>
  );
}
