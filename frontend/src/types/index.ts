// ============================================================
// ResQ-GIS Core Type Definitions
// ============================================================

// --- Geometry ---
export interface GeoPoint {
  lat: number;
  lng: number;
  elevation?: number;
}

// --- Risk & Severity ---
export type RiskLevel = 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW' | 'MINIMAL';
export type Severity = 'red' | 'orange' | 'yellow' | 'green';
export type HazardType = 'landslide' | 'flood' | 'glof' | 'earthquake' | 'avalanche';

// --- Habitation ---
export interface Habitation {
  id: string;
  name: string;
  district: string;
  state: string;
  region?: string;
  block?: string;
  lgdCode?: string;
  location: GeoPoint;
  population: number;
  households: number;
  riskScore: number;
  riskLevel: RiskLevel;
  hazardExposure: HazardExposure[];
  vulnerabilityIndex: VulnerabilityIndex;
  recommendedAction: string;
  nearestRelocationSite?: string;
}

export interface HazardExposure {
  type: HazardType;
  level: RiskLevel;
  score: number;
  contributors: string[];
}

// --- Vulnerability ---
export interface VulnerabilityIndex {
  overall: number;
  level: RiskLevel;
  exposure: number;
  sensitivity: number;
  adaptiveCapacity: number;
}

// --- Relocation Site ---
export interface RelocationSite {
  id: string;
  name: string;
  location: GeoPoint;
  district: string;
  state?: string;
  region?: string;
  block?: string;
  lgdCode?: string;
  suitability: RiskLevel;
  suitabilityScore: number;
  capacity: number;
  distanceFromAffected: number; // km
  constraints: SiteConstraint[];
  slopeGrade: string;
  hasRoadAccess: boolean;
  hasWaterAccess: boolean;
  nearInfrastructure: boolean;
}

export interface SiteConstraint {
  label: string;
  met: boolean;
}

// --- Hazard Zone & Layer ---
export interface HazardZone {
  id: string;
  type: HazardType;
  name: string;
  severity: Severity;
  geometry: any;
  description: string;
}

export interface HazardLayerItem {
  id: string;
  name: string;
  type: string;
  source: string;
  severity?: Severity;
  geometry?: any;
  visible: boolean;
  description?: string;
}

// --- Alerts ---
export interface DisasterAlert {
  id: string;
  source: 'IMD' | 'NDMA' | 'SACHET' | 'CWC' | 'GSI' | 'USDMA' | 'SDMA' | 'SYSTEM' | string;
  eventType: string;
  severity: Severity;
  area: string;
  description: string;
  issuedAt: string;
  expiresAt?: string;
  geometry?: any;
  provenance?: 'LIVE' | 'DEMO' | 'CACHED' | 'STATIC' | 'STALE';
}

// --- Weather ---
export interface WeatherCurrent {
  temperature: number;
  humidity: number;
  windSpeed: number;
  rainfall24h: number;
  condition: string;
  warning?: Severity;
}

export interface WeatherForecast {
  date: string;
  dayLabel: string;
  condition: 'RAIN' | 'CLOUD' | 'CLEAR' | 'STORM' | 'SNOW' | string;
  maxTemp: number;
  minTemp: number;
  rainfall: number;
  warning?: Severity;
}

export interface WeatherReport {
  location: string;
  current: WeatherCurrent;
  forecast: WeatherForecast[];
  updatedAt: string;
  source: string;
  provenance: 'LIVE' | 'DEMO' | 'CACHED' | 'STATIC' | 'STALE';
}

// --- River Observation & Stations ---
export interface RiverObservation {
  id: string;
  river: string;
  station: string;
  waterLevel: number;
  warningLevel: number;
  dangerLevel: number;
  observedAt: string;
  location: GeoPoint;
}

export interface RiverStation {
  id: string;
  name: string;
  river: string;
  district: string;
  latitude: number;
  longitude: number;
  elevation?: number;
  location: GeoPoint;
  warningLevel: number;
  dangerLevel: number;
  waterLevel?: number;
  status: 'normal' | 'warning' | 'danger' | 'unknown';
  flowDischargeCumecs?: number;
  lastObserved?: string;
}

// --- Map Layer ---
export interface MapLayer {
  id: string;
  name: string;
  type: 'geojson' | 'tiles' | 'imagery' | 'terrain';
  category: 'base' | 'hazard' | 'infrastructure' | 'operational';
  visible: boolean;
  url?: string;
  data?: unknown;
  opacity?: number;
}

// --- Priority Ranking ---
export interface PriorityRanking {
  rank: number;
  habitation: Habitation;
  riskScore: number;
  reason: string;
  recommendedSite: RelocationSite;
}

export interface PrioritizationItem {
  rank: number;
  habitationId: string;
  name: string;
  district: string;
  population: number;
  score: number;
  reason: string;
  hvi: number;
  hazardScore: number;
  nearestRelocationSite?: string;
}

export interface DistrictRiskReport {
  district: string;
  generatedAt: string;
  totalHabitations: number;
  atRiskCount: number;
  totalPopulationExposed: number;
  habitations: Habitation[];
  relocationSites: RelocationSite[];
  activeAlerts: DisasterAlert[];
}

// --- Navigation ---
export type NavSection = 'map' | 'globe' | 'analysis' | 'habitations' | 'relocation' | 'alerts' | 'reports' | 'rivers';
export type MapMode = '2d' | '3d';


// --- Data Source Provenance & Status ---
export interface TelemetrySourceStatus {
  status: 'LIVE' | 'DEMO' | 'CACHED' | 'STATIC' | 'DOWN' | 'UNAVAILABLE';
  last_updated: string;
  details: string;
}

export interface SystemStatus {
  sources: Record<string, TelemetrySourceStatus>;
  data_mode: 'live' | 'demo';
  pilot_region: string;
  database_connected: boolean;
  redis_enabled: boolean;
}

export interface DataProvenance {
  source: string;
  issuedAt: string;
  isDemo: boolean;
}

// --- IDRN & DEOC Emergency Response Infrastructure ---
export type EmergencyResourceType = 'shelter' | 'relief_camp' | 'medical_post' | 'helipad' | 'equipment_depot' | 'staging_area';

export interface EmergencyResource {
  id: string;
  name: string;
  resourceType: EmergencyResourceType;
  district: string;
  state: string;
  region: string;
  block?: string;
  latitude: number;
  longitude: number;
  elevation?: number;
  location: GeoPoint;
  capacity: number;
  equipment: string[];
  contactPerson?: string;
  contactPhone?: string;
  status: string;
  provenance?: 'LIVE' | 'DEMO' | 'CACHED' | 'STATIC';
}

// --- OpenStreetMap Roads & Corridors ---
export interface OSMRoadFeature {
  id: string;
  name: string;
  highwayType: string;
  surface?: string;
  lanes: number;
  isEvacuationRoute: boolean;
  passabilityStatus: string;
  distanceKm?: number;
  geometry?: any;
  provenance?: 'LIVE' | 'DEMO' | 'CACHED' | 'STATIC';
}

// --- Administrative Hierarchy ---
export interface AdministrativeHierarchyNode {
  region: string;
  state: string;
  district: string;
  block: string;
  villages: string[];
  lgdCode?: string;
}

export interface AdministrativeHierarchyResponse {
  regions: string[];
  states: string[];
  hierarchy: AdministrativeHierarchyNode[];
}

// --- Copernicus DEM Terrain Point ---
export interface TerrainElevationPoint {
  lat: number;
  lng: number;
  elevation: number;
  slopeDegrees: number;
  slopePercentage: number;
  slopeGrade: string;
  source: string;
  provenance: string;
}

// --- Provider Health & Ingestion Telemetry ---
export interface ProviderHealthStatus {
  name: string;
  category: string;
  status: 'LIVE' | 'DEMO' | 'CACHED' | 'STATIC' | 'STALE' | 'DOWN' | 'UNAVAILABLE';
  endpoint?: string;
  lastChecked?: string;
  lastSuccess?: string;
  latencyMs?: number;
  recordCount?: number;
  error?: string;
  details?: string;
}

export interface SystemProvidersStatusResponse {
  overall_status: 'OPERATIONAL' | 'DEGRADED' | 'OFFLINE_STANDALONE';
  live_count: number;
  total_providers: number;
  providers: Record<string, ProviderHealthStatus>;
  timestamp: string;
}

// --- Dynamic Factor Breakdown & ML Intelligence ---
export interface HazardFactorBreakdown {
  rainfall: number;
  slope: number;
  river_proximity: number;
  historical_glacier: number;
  ml_susceptibility: number;
  contributors: string[];
}

export interface DynamicHazardAssessment {
  habitation_id: string;
  habitation_name: string;
  composite_hazard_score: number;
  hazard_level: RiskLevel;
  factors: HazardFactorBreakdown;
  ml_prediction: {
    susceptibility_score: number;
    susceptibility_class: string;
    confidence: number;
    top_drivers: string[];
  };
  weather_observation: {
    rainfall_24h: number;
    temperature: number;
    wind_speed: number;
    condition: string;
    provenance: string;
  };
  slope_degrees: number;
  nearest_river_dist_km: number;
  provenance: string;
  calculated_at: string;
}

export interface MLStatusResponse {
  status: string;
  model_type: string;
  trained_at: string;
  features: string[];
  metrics: {
    accuracy: number;
    precision: number;
    recall: number;
    f1_score: number;
    roc_auc: number;
  };
  feature_importances: Record<string, number>;
  artifact_path: string;
}



