/**
 * ResQ-GIS API Client
 * Communicates with the FastAPI backend.
 * Automatically normalizes backend snake_case responses to camelCase for the frontend.
 */
import type {
  Habitation,
  RelocationSite,
  DisasterAlert,
  WeatherForecast,
  WeatherReport,
  RiverStation,
  HazardLayerItem,
  MapLayer,
  PrioritizationItem,
  DistrictRiskReport,
  SystemStatus,
  EmergencyResource,
  OSMRoadFeature,
  AdministrativeHierarchyResponse,
  TerrainElevationPoint,
  SystemProvidersStatusResponse,
  DynamicHazardAssessment,
  MLStatusResponse,
} from '../types';
import { DEFAULT_LAYERS } from '../data/layers';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const resp = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  if (!resp.ok) {
    throw new Error(`API error: ${resp.status} ${resp.statusText}`);
  }
  return resp.json();
}

// Normalizers
function normalizeHabitation(h: any): Habitation {
  return {
    id: h.id,
    name: h.name,
    district: h.district,
    state: h.state,
    region: h.region || 'Western Himalayas',
    block: h.block,
    lgdCode: h.lgd_code || h.lgdCode,
    location: h.location,
    population: h.population,
    households: h.households,
    riskScore: h.risk_score ?? h.riskScore ?? 0,
    riskLevel: h.risk_level ?? h.riskLevel ?? 'LOW',
    hazardExposure: (h.hazard_exposure ?? h.hazardExposure ?? []).map((haz: any) => ({
      type: haz.type,
      level: haz.level,
      score: haz.score,
      contributors: haz.contributors || [],
    })),
    vulnerabilityIndex: {
      overall: h.vulnerability_index?.overall ?? h.vulnerabilityIndex?.overall ?? 0,
      level: h.vulnerability_index?.level ?? h.vulnerabilityIndex?.level ?? 'LOW',
      exposure: h.vulnerability_index?.exposure ?? h.vulnerabilityIndex?.exposure ?? 0,
      sensitivity: h.vulnerability_index?.sensitivity ?? h.vulnerabilityIndex?.sensitivity ?? 0,
      adaptiveCapacity:
        h.vulnerability_index?.adaptive_capacity ??
        h.vulnerability_index?.adaptiveCapacity ??
        h.vulnerabilityIndex?.adaptiveCapacity ??
        0,
    },
    recommendedAction: h.recommended_action ?? h.recommendedAction ?? '',
    nearestRelocationSite: h.nearest_relocation_site ?? h.nearestRelocationSite,
  };
}

function normalizeSite(s: any): RelocationSite {
  return {
    id: s.id,
    name: s.name,
    location: s.location,
    district: s.district,
    state: s.state || 'Uttarakhand',
    region: s.region || 'Western Himalayas',
    block: s.block,
    lgdCode: s.lgd_code || s.lgdCode,
    suitability: s.suitability,
    suitabilityScore: s.suitability_score ?? s.suitabilityScore ?? 0,
    capacity: s.capacity,
    distanceFromAffected: s.distance_from_affected ?? s.distanceFromAffected ?? 0,
    constraints: s.constraints || [],
    slopeGrade: s.slope_grade ?? s.slopeGrade ?? '',
    hasRoadAccess: s.has_road_access ?? s.hasRoadAccess ?? false,
    hasWaterAccess: s.has_water_access ?? s.hasWaterAccess ?? false,
    nearInfrastructure: s.near_infrastructure ?? s.nearInfrastructure ?? false,
  };
}

function normalizeRoad(r: any): OSMRoadFeature {
  return {
    id: r.id,
    name: r.name,
    highwayType: r.highway_type || r.highwayType || 'primary',
    surface: r.surface || 'asphalt',
    lanes: r.lanes ?? 2,
    isEvacuationRoute: r.is_evacuation_route ?? r.isEvacuationRoute ?? true,
    passabilityStatus: r.passability_status || r.passabilityStatus || 'clear',
    distanceKm: r.distance_km ?? r.distanceKm,
    geometry: r.geometry,
    provenance: r.provenance || 'STATIC',
  };
}

function normalizeEmergencyResource(er: any): EmergencyResource {
  return {
    id: er.id,
    name: er.name,
    resourceType: er.resource_type || er.resourceType || 'shelter',
    district: er.district,
    state: er.state || 'Uttarakhand',
    region: er.region || 'Western Himalayas',
    block: er.block,
    latitude: er.latitude ?? er.location?.lat ?? 0,
    longitude: er.longitude ?? er.location?.lng ?? 0,
    elevation: er.elevation ?? er.location?.elevation,
    location: er.location || { lat: er.latitude, lng: er.longitude, elevation: er.elevation },
    capacity: er.capacity || 0,
    equipment: er.equipment || [],
    contactPerson: er.contact_person || er.contactPerson,
    contactPhone: er.contact_phone || er.contactPhone,
    status: er.status || 'operational',
    provenance: er.provenance || 'STATIC',
  };
}

function normalizeAlert(a: any): DisasterAlert {
  return {
    id: a.id || String(Math.random()),
    source: a.source || 'SYSTEM',
    eventType: a.event_type ?? a.eventType ?? a.type ?? 'Alert',
    severity: a.severity ?? 'yellow',
    area: a.area ?? a.region ?? 'Chamoli Sector',
    description: a.description ?? '',
    issuedAt: a.issued_at ?? a.issuedAt ?? new Date().toISOString(),
    expiresAt: a.expires_at ?? a.expiresAt,
    geometry: a.geometry,
    provenance: a.provenance ?? 'DEMO',
  };
}

function normalizeWeather(w: any): WeatherForecast {
  return {
    date: w.date,
    dayLabel: w.day_label ?? w.dayLabel ?? '',
    condition: w.condition,
    maxTemp: w.max_temp ?? w.maxTemp ?? 0,
    minTemp: w.min_temp ?? w.minTemp ?? 0,
    rainfall: w.rainfall ?? 0,
    warning: w.warning,
  };
}

function normalizeRiverStation(r: any): RiverStation {
  const meas = r.current_measurement || {};
  return {
    id: r.id,
    name: r.name,
    river: r.river,
    district: r.district,
    latitude: r.latitude ?? r.location?.lat ?? 0,
    longitude: r.longitude ?? r.location?.lng ?? 0,
    elevation: r.elevation ?? r.location?.elevation,
    location: {
      lat: r.latitude ?? r.location?.lat ?? 0,
      lng: r.longitude ?? r.location?.lng ?? 0,
      elevation: r.elevation ?? r.location?.elevation,
    },
    warningLevel: r.warning_level ?? r.warningLevel ?? 0,
    dangerLevel: r.danger_level ?? r.dangerLevel ?? 0,
    waterLevel: r.water_level ?? meas.water_level ?? r.waterLevel,
    status: r.status ?? meas.status ?? 'normal',
    flowDischargeCumecs: r.flow_discharge_cumecs ?? meas.flow_discharge_cumecs,
    lastObserved: meas.timestamp ?? r.last_observed,
  };
}

function normalizeHazardLayer(h: any): HazardLayerItem {
  return {
    id: h.id,
    name: h.name,
    type: h.type,
    source: h.source,
    severity: h.severity,
    geometry: h.geometry,
    visible: h.visible ?? true,
    description: h.description,
  };
}

export const api = {
  // Health
  health: () => fetchJson<{ status: string; data_mode: string; demo_mode: boolean; database_connected: boolean; version: string }>('/api/health'),

  // Habitations
  getHabitations: async (params?: { region?: string; district?: string; block?: string; min_risk?: number }): Promise<Habitation[]> => {
    const qs = new URLSearchParams();
    if (params?.region) qs.set('region', params.region);
    if (params?.district) qs.set('district', params.district);
    if (params?.block) qs.set('block', params.block);
    if (params?.min_risk) qs.set('min_risk', String(params.min_risk));
    const query = qs.toString() ? `?${qs}` : '';
    const raw = await fetchJson<any[]>(`/api/habitations${query}`);
    return raw.map(normalizeHabitation);
  },

  getHabitation: async (id: string): Promise<Habitation> => {
    const raw = await fetchJson<any>(`/api/habitations/${id}`);
    return normalizeHabitation(raw);
  },

  // Relocation Sites
  getRelocationSites: async (params?: { region?: string; district?: string; block?: string; min_capacity?: number }): Promise<RelocationSite[]> => {
    const qs = new URLSearchParams();
    if (params?.region) qs.set('region', params.region);
    if (params?.district) qs.set('district', params.district);
    if (params?.block) qs.set('block', params.block);
    if (params?.min_capacity) qs.set('min_capacity', String(params.min_capacity));
    const query = qs.toString() ? `?${qs}` : '';
    const raw = await fetchJson<any[]>(`/api/relocation-sites${query}`);
    return raw.map(normalizeSite);
  },

  getRelocationSite: async (id: string): Promise<RelocationSite> => {
    const raw = await fetchJson<any>(`/api/relocation-sites/${id}`);
    return normalizeSite(raw);
  },

  // Alerts
  getAlerts: async (params?: { source?: string; severity?: string }): Promise<DisasterAlert[]> => {
    const qs = new URLSearchParams();
    if (params?.source) qs.set('source', params.source);
    if (params?.severity) qs.set('severity', params.severity);
    const query = qs.toString() ? `?${qs}` : '';
    const raw = await fetchJson<any[]>(`/api/alerts${query}`);
    return raw.map(normalizeAlert);
  },

  // Weather
  getWeather: async (district: string = 'Chamoli'): Promise<{
    report?: WeatherReport;
    forecast: WeatherForecast[];
  }> => {
    try {
      const raw = await fetchJson<any>(`/api/weather/${district}`);
      if (Array.isArray(raw)) {
        return { forecast: raw.map(normalizeWeather) };
      }
      const forecastList = (raw.forecast || []).map(normalizeWeather);
      return {
        report: {
          location: raw.location || district,
          current: {
            temperature: raw.current?.temperature ?? 20,
            humidity: raw.current?.humidity ?? 80,
            windSpeed: raw.current?.wind_speed ?? 10,
            rainfall24h: raw.current?.rainfall_24h ?? 0,
            condition: raw.current?.condition ?? 'CLOUDY',
            warning: raw.current?.warning,
          },
          forecast: forecastList,
          updatedAt: raw.updated_at || new Date().toISOString(),
          source: raw.source || 'IMD',
          provenance: raw.provenance || 'DEMO',
        },
        forecast: forecastList,
      };
    } catch {
      return { report: undefined, forecast: [] };
    }
  },

  // River Gauging Stations
  getRivers: async (region?: string): Promise<RiverStation[]> => {
    const query = region ? `?region=${encodeURIComponent(region)}` : '';
    const raw = await fetchJson<any[]>(`/api/rivers${query}`);
    return raw.map(normalizeRiverStation);
  },

  getRiverMeasurement: async (stationId: string): Promise<any> => {
    return fetchJson<any>(`/api/rivers/${stationId}`);
  },

  // Layers & Hazards
  getLayers: async (): Promise<MapLayer[]> => {
    try {
      const hazards = await fetchJson<any[]>('/api/hazards');
      return DEFAULT_LAYERS.map((dl) => {
        const matchingHaz = hazards.find((h) => h.id === dl.id || h.type === dl.id);
        if (matchingHaz) {
          return { ...dl, visible: matchingHaz.visible ?? dl.visible };
        }
        return dl;
      });
    } catch {
      return DEFAULT_LAYERS;
    }
  },

  getHazardLayers: async (region?: string): Promise<HazardLayerItem[]> => {
    const query = region ? `?region=${encodeURIComponent(region)}` : '';
    const raw = await fetchJson<any[]>(`/api/hazards${query}`);
    return raw.map(normalizeHazardLayer);
  },

  // Risk Report
  getDistrictRisk: async (district: string): Promise<DistrictRiskReport> => {
    const raw = await fetchJson<any>(`/api/risk/district/${district}`);
    return {
      district: raw.district,
      generatedAt: raw.generated_at,
      totalHabitations: raw.total_habitations,
      atRiskCount: raw.at_risk_count,
      totalPopulationExposed: raw.total_population_exposed,
      habitations: (raw.habitations || []).map(normalizeHabitation),
      relocationSites: (raw.relocation_sites || []).map(normalizeSite),
      activeAlerts: (raw.active_alerts || []).map(normalizeAlert),
    };
  },

  // Multi-Criteria Prioritization (TOPSIS)
  getPrioritization: async (weights?: {
    hvi?: number;
    hazard?: number;
    population?: number;
    historical?: number;
    structural?: number;
    feasibility?: number;
    district?: string;
  }): Promise<{
    district: string;
    method: string;
    totalEvaluated: number;
    rankedHabitations: PrioritizationItem[];
    weightsUsed: Record<string, number>;
  }> => {
    const qs = new URLSearchParams();
    if (weights?.district) qs.set('district', weights.district);
    if (weights?.hvi !== undefined) qs.set('weight_hvi', String(weights.hvi));
    if (weights?.hazard !== undefined) qs.set('weight_hazard', String(weights.hazard));
    if (weights?.population !== undefined) qs.set('weight_population', String(weights.population));
    if (weights?.historical !== undefined) qs.set('weight_historical', String(weights.historical));
    if (weights?.structural !== undefined) qs.set('weight_structural', String(weights.structural));
    if (weights?.feasibility !== undefined) qs.set('weight_feasibility', String(weights.feasibility));
    const query = qs.toString() ? `?${qs}` : '';
    const raw = await fetchJson<any>(`/api/analysis/prioritization${query}`);

    return {
      district: raw.district,
      method: raw.method,
      totalEvaluated: raw.total_evaluated,
      rankedHabitations: (raw.ranked_habitations || []).map((item: any) => ({
        rank: item.rank,
        habitationId: item.habitation_id,
        name: item.name,
        district: item.district,
        population: item.population,
        score: item.score,
        reason: item.reason,
        hvi: item.hvi,
        hazardScore: item.hazard_score,
        nearestRelocationSite: item.nearest_relocation_site,
      })),
      weightsUsed: raw.weights_used,
    };
  },

  // Roads & Evacuation Corridors (OpenStreetMap)
  getRoads: async (region?: string): Promise<OSMRoadFeature[]> => {
    const query = region ? `?region=${encodeURIComponent(region)}` : '';
    const raw = await fetchJson<any[]>(`/api/roads${query}`);
    return raw.map(normalizeRoad);
  },

  // Emergency Infrastructure (IDRN / DEOC)
  getEmergencyResources: async (params?: { district?: string; resourceType?: string }): Promise<EmergencyResource[]> => {
    const qs = new URLSearchParams();
    if (params?.district) qs.set('district', params.district);
    if (params?.resourceType) qs.set('resource_type', params.resourceType);
    const query = qs.toString() ? `?${qs}` : '';
    const raw = await fetchJson<any[]>(`/api/emergency/resources${query}`);
    return raw.map(normalizeEmergencyResource);
  },

  // Administrative Hierarchy (LGD + Census)
  getAdminHierarchy: async (region?: string): Promise<AdministrativeHierarchyResponse> => {
    const query = region ? `?region=${encodeURIComponent(region)}` : '';
    return fetchJson<AdministrativeHierarchyResponse>(`/api/admin/hierarchy${query}`);
  },

  // Copernicus DEM Terrain Slope
  getTerrainSlope: async (lat: number, lng: number): Promise<TerrainElevationPoint> => {
    const raw = await fetchJson<any>(`/api/terrain/slope?lat=${lat}&lng=${lng}`);
    return {
      lat: raw.lat,
      lng: raw.lng,
      elevation: raw.elevation,
      slopeDegrees: raw.slope_degrees,
      slopePercentage: raw.slope_percentage,
      slopeGrade: raw.slope_grade,
      source: raw.source,
      provenance: raw.provenance,
    };
  },

  // System Status & Telemetry Provenance
  getStatus: () => fetchJson<SystemStatus>('/api/status'),

  // Detailed Provider Ingestion Health
  getProvidersDetailedStatus: () => fetchJson<SystemProvidersStatusResponse>('/api/providers/status'),

  // Dynamic Multi-Factor Hazard Assessment
  getHazardAssessment: (habitationId: string) =>
    fetchJson<DynamicHazardAssessment>(`/api/analysis/hazard/${encodeURIComponent(habitationId)}`),

  // Machine Learning Model Provenance & Metrics
  getMLStatus: () => fetchJson<MLStatusResponse>('/api/analysis/ml-status'),

  // ISRO Bhuvan / NRSC Geospatial Services
  getBhuvanStatus: () => fetchJson<{ portal: string; overall_status: string; services: Record<string, boolean> }>('/api/bhuvan/status'),
  getBhuvanDistricts: () => fetchJson<Array<{ code: string; name: string }>>('/api/bhuvan/districts'),
  geocodeVillageBhuvan: (villageName: string, state: string = 'UTTARAKHAND') =>
    fetchJson<{ query: string; count: number; results: any[] }>(`/api/bhuvan/village/${encodeURIComponent(villageName)}?state=${encodeURIComponent(state)}`),
  getBhuvanShortestRoute: (lat1: number, lon1: number, lat2: number, lon2: number) =>
    fetchJson<any>(`/api/bhuvan/route?lat1=${lat1}&lon1=${lon1}&lat2=${lat2}&lon2=${lon2}`),
  getBhuvanDistrictLULC: (distcode: string = '0502', year: string = '1112') =>
    fetchJson<any>(`/api/bhuvan/lulc/district/${distcode}?year=${year}`),
  getBhuvanFacilities: (theme: string = 'hospital', lat: number = 30.555, lon: number = 79.566, buffer: number = 20000) =>
    fetchJson<any>(`/api/bhuvan/facilities?theme=${theme}&lat=${lat}&lon=${lon}&buffer=${buffer}`),
};

