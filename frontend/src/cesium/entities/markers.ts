/**
 * ResQ-GIS Cesium Map Overlays & Entity Management
 * Renders Habitations, Relocation Sites, Evacuation Corridors,
 * Hazard Polygon Zones (Landslide, Flood, GLOF), River Stations, and Disaster Alerts.
 */
import * as Cesium from 'cesium';
import { getViewer } from '../viewer';
import type { Habitation, RelocationSite, RiverStation, HazardLayerItem, DisasterAlert, OSMRoadFeature, EmergencyResource } from '../../types';

const RISK_COLORS: Record<string, Cesium.Color> = {
  CRITICAL: Cesium.Color.fromCssColorString('#dc2626'),
  HIGH: Cesium.Color.fromCssColorString('#ea580c'),
  MODERATE: Cesium.Color.fromCssColorString('#ca8a04'),
  LOW: Cesium.Color.fromCssColorString('#16a34a'),
  MINIMAL: Cesium.Color.fromCssColorString('#6b7280'),
};

const HAZARD_FILL_COLORS: Record<string, Cesium.Color> = {
  landslide: Cesium.Color.fromCssColorString('#ea580c').withAlpha(0.38),
  flood: Cesium.Color.fromCssColorString('#0284c7').withAlpha(0.38),
  glof: Cesium.Color.fromCssColorString('#dc2626').withAlpha(0.42),
  earthquake: Cesium.Color.fromCssColorString('#9333ea').withAlpha(0.35),
  avalanche: Cesium.Color.fromCssColorString('#06b6d4').withAlpha(0.35),
};

const HAZARD_OUTLINE_COLORS: Record<string, Cesium.Color> = {
  landslide: Cesium.Color.fromCssColorString('#9a3412'),
  flood: Cesium.Color.fromCssColorString('#075985'),
  glof: Cesium.Color.fromCssColorString('#7f1d1d'),
  earthquake: Cesium.Color.fromCssColorString('#581c87'),
  avalanche: Cesium.Color.fromCssColorString('#0e7490'),
};

export function renderHabitations(habitations: Habitation[], visible: boolean = true) {
  const viewer = getViewer();
  if (!viewer) return;

  // Remove existing habitation entities
  const toRemove = viewer.entities.values.filter((e) => e.id?.startsWith('hab-'));
  toRemove.forEach((e) => viewer.entities.remove(e));

  if (!visible) return;

  habitations.forEach((hab) => {
    const color = RISK_COLORS[hab.riskLevel] || RISK_COLORS.MINIMAL;
    const size = hab.riskScore >= 0.7 ? 14 : hab.riskScore >= 0.5 ? 10 : 8;

    viewer.entities.add({
      id: hab.id,
      name: hab.name,
      position: Cesium.Cartesian3.fromDegrees(
        hab.location.lng,
        hab.location.lat,
        hab.location.elevation || 0
      ),
      point: {
        pixelSize: size,
        color: color,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
      label: {
        text: hab.name,
        font: '500 12px Inter, -apple-system, sans-serif',
        fillColor: Cesium.Color.WHITE,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 3,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -18),
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
        scaleByDistance: new Cesium.NearFarScalar(1000, 1, 80000, 0.4),
      },
      properties: {
        type: 'habitation',
        id: hab.id,
        name: hab.name,
        riskLevel: hab.riskLevel,
        riskScore: hab.riskScore,
        population: hab.population,
      },
    });
  });
}

export function renderRelocationSites(sites: RelocationSite[], visible: boolean = true) {
  const viewer = getViewer();
  if (!viewer) return;

  const toRemove = viewer.entities.values.filter((e) => e.id?.startsWith('site-'));
  toRemove.forEach((e) => viewer.entities.remove(e));

  if (!visible) return;

  sites.forEach((site) => {
    viewer.entities.add({
      id: site.id,
      name: site.name,
      position: Cesium.Cartesian3.fromDegrees(
        site.location.lng,
        site.location.lat,
        site.location.elevation || 0
      ),
      point: {
        pixelSize: 12,
        color: Cesium.Color.fromCssColorString('#3b82f6'),
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 2,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
      label: {
        text: `⬢ ${site.name}`,
        font: '600 11px Inter, -apple-system, sans-serif',
        fillColor: Cesium.Color.fromCssColorString('#93c5fd'),
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 3,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -16),
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
        scaleByDistance: new Cesium.NearFarScalar(1000, 1, 80000, 0.4),
      },
      properties: {
        type: 'relocation-site',
        id: site.id,
        name: site.name,
        capacity: site.capacity,
        suitability: site.suitability,
      },
    });
  });
}

export function renderRelocationPathway(hab: Habitation, site: RelocationSite) {
  const viewer = getViewer();
  if (!viewer) return;

  clearRelocationPathway();

  viewer.entities.add({
    id: `pathway-line-${hab.id}-${site.id}`,
    name: `Relocation Corridor: ${hab.name} to ${site.name}`,
    polyline: {
      positions: Cesium.Cartesian3.fromDegreesArray([
        hab.location.lng,
        hab.location.lat,
        site.location.lng,
        site.location.lat,
      ]),
      width: 4,
      material: new Cesium.PolylineDashMaterialProperty({
        color: Cesium.Color.fromCssColorString('#38bdf8'),
        gapColor: Cesium.Color.fromCssColorString('#0369a1'),
        dashLength: 20.0,
      }),
      clampToGround: true,
    },
  });

  const midLng = (hab.location.lng + site.location.lng) / 2;
  const midLat = (hab.location.lat + site.location.lat) / 2;

  viewer.entities.add({
    id: `pathway-label-${hab.id}-${site.id}`,
    position: Cesium.Cartesian3.fromDegrees(midLng, midLat, 0),
    label: {
      text: `➔ CORRIDOR: ${hab.name} to ${site.name} (${site.distanceFromAffected} km)`,
      font: '600 11px Inter, -apple-system, sans-serif',
      fillColor: Cesium.Color.fromCssColorString('#38bdf8'),
      outlineColor: Cesium.Color.BLACK,
      outlineWidth: 3,
      style: Cesium.LabelStyle.FILL_AND_OUTLINE,
      backgroundColor: Cesium.Color.fromCssColorString('#09090b'),
      showBackground: true,
      backgroundPadding: new Cesium.Cartesian2(6, 4),
      verticalOrigin: Cesium.VerticalOrigin.CENTER,
      heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
    },
  });
}

export function clearRelocationPathway() {
  const viewer = getViewer();
  if (!viewer) return;

  const toRemove = viewer.entities.values.filter((e) => e.id?.startsWith('pathway-'));
  toRemove.forEach((e) => viewer.entities.remove(e));
}

/**
 * Renders Multi-Hazard Polygons (Landslide, Flood Inundation, GLOF Corridors)
 */
export function renderHazardLayers(
  hazards: HazardLayerItem[],
  layerVisibility: Record<string, boolean>
) {
  const viewer = getViewer();
  if (!viewer) return;

  // Clear previous hazard entities
  const toRemove = viewer.entities.values.filter((e) => e.id?.startsWith('hazard-poly-') || e.id?.startsWith('hazard-label-'));
  toRemove.forEach((e) => viewer.entities.remove(e));

  hazards.forEach((hazard) => {
    const hazType = hazard.type.toLowerCase();
    // Check layer visibility (by type or specific ID)
    const isVisible = layerVisibility[hazType] ?? layerVisibility[hazard.id] ?? true;
    if (!isVisible) return;

    const geom = hazard.geometry;
    if (!geom || geom.type !== 'Polygon' || !geom.coordinates || !geom.coordinates[0]) return;

    const ring = geom.coordinates[0]; // [[lng, lat], ...]
    const flatCoords: number[] = [];
    let sumLng = 0;
    let sumLat = 0;

    ring.forEach(([lng, lat]: [number, number]) => {
      flatCoords.push(lng, lat);
      sumLng += lng;
      sumLat += lat;
    });

    const centerLng = sumLng / ring.length;
    const centerLat = sumLat / ring.length;

    const fillColor = HAZARD_FILL_COLORS[hazType] || Cesium.Color.fromCssColorString('#ef4444').withAlpha(0.38);
    const outlineColor = HAZARD_OUTLINE_COLORS[hazType] || Cesium.Color.fromCssColorString('#991b1b');

    // Add polygon entity clamped to terrain
    viewer.entities.add({
      id: `hazard-poly-${hazard.id}`,
      name: hazard.name,
      polygon: {
        hierarchy: Cesium.Cartesian3.fromDegreesArray(flatCoords),
        material: fillColor,
        outline: true,
        outlineColor: outlineColor,
        outlineWidth: 2,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
      },
      properties: {
        type: 'hazard-layer',
        id: hazard.id,
        name: hazard.name,
        hazardType: hazard.type,
        severity: hazard.severity,
        source: hazard.source,
        description: hazard.description,
      },
    });

    // Add centroid label badge
    const badgeText = `⚠️ ${hazard.name.toUpperCase()}`;
    viewer.entities.add({
      id: `hazard-label-${hazard.id}`,
      position: Cesium.Cartesian3.fromDegrees(centerLng, centerLat, 0),
      label: {
        text: badgeText,
        font: '600 10px Inter, -apple-system, sans-serif',
        fillColor: Cesium.Color.WHITE,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 3,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        backgroundColor: outlineColor.withAlpha(0.85),
        showBackground: true,
        backgroundPadding: new Cesium.Cartesian2(5, 3),
        verticalOrigin: Cesium.VerticalOrigin.CENTER,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
        scaleByDistance: new Cesium.NearFarScalar(5000, 1, 150000, 0.4),
      },
      properties: {
        type: 'hazard-layer',
        id: hazard.id,
      },
    });
  });
}

/**
 * Renders CWC River Gauging Stations along Alaknanda / Mandakini
 */
export function renderRiverStations(stations: RiverStation[], visible: boolean = true) {
  const viewer = getViewer();
  if (!viewer) return;

  const toRemove = viewer.entities.values.filter((e) => e.id?.startsWith('river-station-'));
  toRemove.forEach((e) => viewer.entities.remove(e));

  if (!visible) return;

  stations.forEach((st) => {
    const isDanger = st.status === 'danger' || (st.waterLevel && st.dangerLevel && st.waterLevel >= st.dangerLevel);
    const isWarning = st.status === 'warning' || (st.waterLevel && st.warningLevel && st.waterLevel >= st.warningLevel);

    const color = isDanger
      ? Cesium.Color.fromCssColorString('#ef4444')
      : isWarning
      ? Cesium.Color.fromCssColorString('#f59e0b')
      : Cesium.Color.fromCssColorString('#06b6d4');

    const statusBadge = isDanger ? '🚨 DANGER' : isWarning ? '⚠️ WARNING' : 'NORMAL';
    const levelText = st.waterLevel ? `${st.waterLevel.toFixed(1)}m` : 'N/A';

    viewer.entities.add({
      id: `river-station-${st.id}`,
      name: `CWC: ${st.name}`,
      position: Cesium.Cartesian3.fromDegrees(
        st.longitude,
        st.latitude,
        st.elevation || 0
      ),
      point: {
        pixelSize: 11,
        color: color,
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 2,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
      label: {
        text: `🌊 ${st.name} [${levelText} | ${statusBadge}]`,
        font: '600 10px Inter, -apple-system, sans-serif',
        fillColor: Cesium.Color.fromCssColorString('#a5f3fc'),
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 3,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -14),
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
        scaleByDistance: new Cesium.NearFarScalar(2000, 1, 100000, 0.4),
      },
      properties: {
        type: 'river-station',
        id: st.id,
        name: st.name,
        river: st.river,
        waterLevel: st.waterLevel,
        warningLevel: st.warningLevel,
        dangerLevel: st.dangerLevel,
        status: st.status,
      },
    });
  });
}

/**
 * Renders Active Disaster Alert Pins / Beacons
 */
export function renderDisasterAlerts(alerts: DisasterAlert[], visible: boolean = true) {
  const viewer = getViewer();
  if (!viewer) return;

  const toRemove = viewer.entities.values.filter((e) => e.id?.startsWith('alert-pin-'));
  toRemove.forEach((e) => viewer.entities.remove(e));

  if (!visible) return;

  alerts.forEach((alert) => {
    let lat: number | null = null;
    let lng: number | null = null;

    if (alert.geometry && alert.geometry.type === 'Point' && alert.geometry.coordinates) {
      [lng, lat] = alert.geometry.coordinates;
    } else {
      // Default to general district coordinates if specific point missing
      const area = (alert.area || (alert as any).region || '').toLowerCase();
      if (area.includes('joshimath')) {
        lng = 79.566;
        lat = 30.555;
      } else if (area.includes('alaknanda')) {
        lng = 79.558;
        lat = 30.545;
      } else if (area.includes('chamoli') || area.includes('rudraprayag')) {
        lng = 79.35;
        lat = 30.41;
      }
    }

    if (lat === null || lng === null) return;

    const isCritical = alert.severity === 'red';
    const color = isCritical
      ? Cesium.Color.fromCssColorString('#f43f5e')
      : Cesium.Color.fromCssColorString('#f97316');

    viewer.entities.add({
      id: `alert-pin-${alert.id}`,
      name: `Alert: ${alert.eventType}`,
      position: Cesium.Cartesian3.fromDegrees(lng, lat, 0),
      point: {
        pixelSize: 13,
        color: color,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
      label: {
        text: `⚡ ALERT: ${alert.eventType.toUpperCase()}`,
        font: '600 10px Inter, -apple-system, sans-serif',
        fillColor: Cesium.Color.fromCssColorString('#fecdd3'),
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 3,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -16),
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
        scaleByDistance: new Cesium.NearFarScalar(2000, 1, 120000, 0.4),
      },
      properties: {
        type: 'disaster-alert',
        id: alert.id,
        eventType: alert.eventType,
        description: alert.description,
        source: alert.source,
      },
    });
  });
}

/**
 * Renders OpenStreetMap Evacuation Corridors & Road Lifelines
 */
export function renderRoads(roads: OSMRoadFeature[], visible: boolean = true) {
  const viewer = getViewer();
  if (!viewer) return;

  const toRemove = viewer.entities.values.filter((e) => e.id?.startsWith('road-line-') || e.id?.startsWith('road-label-'));
  toRemove.forEach((e) => viewer.entities.remove(e));

  if (!visible) return;

  roads.forEach((road) => {
    const coords = road.geometry?.coordinates;
    if (!coords || !Array.isArray(coords) || coords.length < 2) return;

    const flatCoords: number[] = [];
    coords.forEach(([lng, lat]: [number, number]) => {
      flatCoords.push(lng, lat);
    });

    const isCompromised = road.passabilityStatus === 'compromised';
    const lineColor = isCompromised
      ? Cesium.Color.fromCssColorString('#f59e0b')
      : Cesium.Color.fromCssColorString('#06b6d4');

    viewer.entities.add({
      id: `road-line-${road.id}`,
      name: road.name,
      polyline: {
        positions: Cesium.Cartesian3.fromDegreesArray(flatCoords),
        width: 3.5,
        material: new Cesium.PolylineGlowMaterialProperty({
          glowPower: 0.2,
          color: lineColor,
        }),
        clampToGround: true,
      },
      properties: {
        type: 'osm-road',
        id: road.id,
        name: road.name,
        highwayType: road.highwayType,
        passability: road.passabilityStatus,
      },
    });

    const midIdx = Math.floor(coords.length / 2);
    const midPoint = coords[midIdx];
    if (midPoint) {
      viewer.entities.add({
        id: `road-label-${road.id}`,
        position: Cesium.Cartesian3.fromDegrees(midPoint[0], midPoint[1], 0),
        label: {
          text: `🛣️ ${road.name} [${road.passabilityStatus.toUpperCase()}]`,
          font: '600 9px Inter, -apple-system, sans-serif',
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: Cesium.VerticalOrigin.CENTER,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          scaleByDistance: new Cesium.NearFarScalar(1000, 1, 60000, 0.4),
        },
      });
    }
  });
}

/**
 * Renders IDRN / DEOC Emergency Response Infrastructure (Shelters, Helipads, Depots, Hospitals)
 */
export function renderEmergencyResources(resources: EmergencyResource[], visible: boolean = true) {
  const viewer = getViewer();
  if (!viewer) return;

  const toRemove = viewer.entities.values.filter((e) => e.id?.startsWith('idrn-res-'));
  toRemove.forEach((e) => viewer.entities.remove(e));

  if (!visible) return;

  const ICONS: Record<string, string> = {
    shelter: '⛺',
    helipad: '🚁',
    equipment_depot: '🚜',
    medical_post: '🏥',
    relief_camp: '🏕️',
    staging_area: '📦',
  };

  resources.forEach((res) => {
    const icon = ICONS[res.resourceType] || '📍';
    const color = res.resourceType === 'shelter'
      ? Cesium.Color.fromCssColorString('#10b981')
      : res.resourceType === 'helipad'
      ? Cesium.Color.fromCssColorString('#8b5cf6')
      : res.resourceType === 'medical_post'
      ? Cesium.Color.fromCssColorString('#ef4444')
      : Cesium.Color.fromCssColorString('#f59e0b');

    viewer.entities.add({
      id: `idrn-res-${res.id}`,
      name: `IDRN: ${res.name}`,
      position: Cesium.Cartesian3.fromDegrees(
        res.location.lng,
        res.location.lat,
        res.location.elevation || 0
      ),
      point: {
        pixelSize: 11,
        color: color,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
      label: {
        text: `${icon} ${res.name} (Cap: ${res.capacity})`,
        font: '600 10px Inter, -apple-system, sans-serif',
        fillColor: Cesium.Color.WHITE,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 3,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -14),
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
        scaleByDistance: new Cesium.NearFarScalar(2000, 1, 80000, 0.4),
      },
      properties: {
        type: 'emergency-resource',
        id: res.id,
        name: res.name,
        resourceType: res.resourceType,
        capacity: res.capacity,
        equipment: res.equipment,
        contactPerson: res.contactPerson,
        contactPhone: res.contactPhone,
      },
    });
  });
}

