"""
ResQ-GIS Pydantic Schemas
Normalized data models matching the live GIS operational specification.
"""
from __future__ import annotations
from datetime import datetime
from enum import Enum
from typing import Optional, Any
from pydantic import BaseModel, Field, model_validator


# --- Enums ---
class RiskLevel(str, Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MODERATE = "MODERATE"
    LOW = "LOW"
    MINIMAL = "MINIMAL"


class Severity(str, Enum):
    RED = "red"
    ORANGE = "orange"
    YELLOW = "yellow"
    GREEN = "green"


class HazardType(str, Enum):
    LANDSLIDE = "landslide"
    FLOOD = "flood"
    GLOF = "glof"
    EARTHQUAKE = "earthquake"
    AVALANCHE = "avalanche"


class RiverStatus(str, Enum):
    NORMAL = "normal"
    WARNING = "warning"
    DANGER = "danger"
    UNKNOWN = "unknown"


class DataProvenance(str, Enum):
    LIVE = "LIVE"
    CACHED = "CACHED"
    STATIC = "STATIC"
    DEMO = "DEMO"
    STALE = "STALE"


# --- GeoPoint ---
class GeoPoint(BaseModel):
    lat: float
    lng: float
    elevation: Optional[float] = None


# --- Hazard Exposure ---
class HazardExposure(BaseModel):
    type: HazardType
    level: RiskLevel
    score: float = Field(ge=0, le=1)
    contributors: list[str] = []


# --- Vulnerability Breakdown ---
class HabitationVulnerability(BaseModel):
    kutcha_house_percentage: float = 0.0
    elderly_count: int = 0
    children_count: int = 0
    road_cutoff_risk: float = 0.0


class VulnerabilityIndex(BaseModel):
    overall: float = Field(ge=0, le=1)
    level: RiskLevel
    exposure: float = Field(ge=0, le=1)
    sensitivity: float = Field(ge=0, le=1)
    adaptive_capacity: float = Field(ge=0, le=1)


# --- Habitation Model ---
class HabitationResponse(BaseModel):
    id: str
    name: str
    village: Optional[str] = None
    district: str
    state: str = "Uttarakhand"
    region: Optional[str] = "Western Himalayas"
    block: Optional[str] = None
    lgd_code: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    elevation: Optional[float] = None
    location: Optional[GeoPoint] = None
    population: int = 0
    households: int = 0
    risk_score: float = Field(default=0.0, ge=0, le=1)
    risk_level: RiskLevel = RiskLevel.LOW
    vulnerability: Optional[HabitationVulnerability] = None
    hazard_exposure: list[HazardExposure] = []
    vulnerability_index: VulnerabilityIndex
    recommended_action: str = ""
    nearest_relocation_site: Optional[str] = None
    geometry: Optional[dict[str, Any]] = None
    provenance: DataProvenance = DataProvenance.DEMO

    @model_validator(mode="before")
    @classmethod
    def sync_coordinates(cls, data: Any) -> Any:
        if isinstance(data, dict):
            loc = data.get("location")
            lat = data.get("latitude")
            lng = data.get("longitude")
            geom = data.get("geometry")

            # Extract from geometry if missing
            if lat is None and lng is None and geom and isinstance(geom, dict):
                coords = geom.get("coordinates")
                if coords and len(coords) >= 2:
                    lng, lat = coords[0], coords[1]
                    data["longitude"] = lng
                    data["latitude"] = lat

            # If location object/dict exists, sync to lat/lng
            if loc is not None:
                if isinstance(loc, dict):
                    if lat is None:
                        data["latitude"] = loc.get("lat")
                    if lng is None:
                        data["longitude"] = loc.get("lng")
                    if data.get("elevation") is None:
                        data["elevation"] = loc.get("elevation")
                elif hasattr(loc, "lat") and hasattr(loc, "lng"):
                    if lat is None:
                        data["latitude"] = loc.lat
                    if lng is None:
                        data["longitude"] = loc.lng
                    if data.get("elevation") is None:
                        data["elevation"] = getattr(loc, "elevation", None)

            # If lat/lng exists but location is missing, populate location
            if data.get("location") is None and data.get("latitude") is not None and data.get("longitude") is not None:
                data["location"] = GeoPoint(
                    lat=data["latitude"],
                    lng=data["longitude"],
                    elevation=data.get("elevation"),
                )
        return data


# --- Site Constraint ---
class SiteConstraint(BaseModel):
    label: str
    met: bool


# --- Relocation Site Model ---
class RelocationSiteResponse(BaseModel):
    id: str
    name: str
    district: str
    state: str = "Uttarakhand"
    region: Optional[str] = "Western Himalayas"
    block: Optional[str] = None
    lgd_code: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    elevation: Optional[float] = None
    location: Optional[GeoPoint] = None
    usable_area_sqm: Optional[float] = None
    emergency_capacity: int = 0
    capacity: int = 0
    slope: Optional[float] = None
    slope_grade: str = "Gentle (5-10°)"
    road_access: bool = True
    drinking_water: bool = True
    electricity: bool = True
    medical_facility_nearby: bool = True
    distance_to_road_km: Optional[float] = None
    distance_to_medical_km: Optional[float] = None
    hazard_exposure: float = 0.0
    suitability: RiskLevel = RiskLevel.HIGH
    suitability_score: float = Field(default=0.8, ge=0, le=1)
    distance_from_affected: float = 0.0
    constraints: list[SiteConstraint] = []
    geometry: Optional[dict[str, Any]] = None
    provenance: DataProvenance = DataProvenance.DEMO

    @model_validator(mode="before")
    @classmethod
    def sync_site_coordinates(cls, data: Any) -> Any:
        if isinstance(data, dict):
            loc = data.get("location")
            lat = data.get("latitude")
            lng = data.get("longitude")
            geom = data.get("geometry")

            if lat is None and lng is None and geom and isinstance(geom, dict):
                coords = geom.get("coordinates")
                if coords and len(coords) >= 2:
                    lng, lat = coords[0], coords[1]
                    data["longitude"] = lng
                    data["latitude"] = lat

            if loc is not None:
                if isinstance(loc, dict):
                    if lat is None:
                        data["latitude"] = loc.get("lat")
                    if lng is None:
                        data["longitude"] = loc.get("lng")
                    if data.get("elevation") is None:
                        data["elevation"] = loc.get("elevation")
                elif hasattr(loc, "lat") and hasattr(loc, "lng"):
                    if lat is None:
                        data["latitude"] = loc.lat
                    if lng is None:
                        data["longitude"] = loc.lng
                    if data.get("elevation") is None:
                        data["elevation"] = getattr(loc, "elevation", None)

            if data.get("location") is None and data.get("latitude") is not None and data.get("longitude") is not None:
                data["location"] = GeoPoint(
                    lat=data["latitude"],
                    lng=data["longitude"],
                    elevation=data.get("elevation"),
                )
        return data


# --- Disaster Alert ---
class DisasterAlert(BaseModel):
    id: str
    type: str
    severity: Severity
    title: str
    description: str
    issued_at: datetime
    expires_at: Optional[datetime] = None
    region: str
    geometry: Optional[dict[str, Any]] = None
    source: str = "SACHET"
    provenance: DataProvenance = DataProvenance.DEMO


# --- Weather Models ---
class WeatherCurrent(BaseModel):
    temperature: float
    humidity: float
    wind_speed: float
    rainfall_24h: float
    condition: str
    warning: Optional[Severity] = None
    provenance: DataProvenance = DataProvenance.DEMO


class WeatherForecastItem(BaseModel):
    date: str
    day_label: str
    condition: str
    max_temp: float
    min_temp: float
    rainfall: float
    warning: Optional[Severity] = None


class WeatherResponse(BaseModel):
    location: str
    current: WeatherCurrent
    forecast: list[WeatherForecastItem]
    updated_at: datetime
    source: str = "IMD"
    provenance: DataProvenance = DataProvenance.DEMO


# --- River Monitoring Models ---
class RiverMeasurement(BaseModel):
    station_id: str
    timestamp: datetime
    water_level: Optional[float] = None
    danger_level: Optional[float] = None
    warning_level: Optional[float] = None
    status: RiverStatus = RiverStatus.NORMAL
    flow_discharge_cumecs: Optional[float] = None


class RiverStation(BaseModel):
    id: str
    name: str
    river: str
    district: str
    latitude: float
    longitude: float
    elevation: Optional[float] = None
    location: GeoPoint
    warning_level: float
    danger_level: float
    current_measurement: Optional[RiverMeasurement] = None
    geometry: Optional[dict[str, Any]] = None
    provenance: DataProvenance = DataProvenance.DEMO


# --- Hazard Layer Model ---
class HazardLayerResponse(BaseModel):
    id: str
    name: str
    type: str  # "polygon" | "raster" | "point" | "line"
    source: str
    severity: Optional[Severity] = None
    geometry: Optional[dict[str, Any]] = None
    visible: bool = True
    description: Optional[str] = None


# --- District Risk Report ---
class RiskReportResponse(BaseModel):
    district: str
    generated_at: datetime
    total_habitations: int
    at_risk_count: int
    total_population_exposed: int
    habitations: list[HabitationResponse]
    relocation_sites: list[RelocationSiteResponse]
    active_alerts: list[DisasterAlert]


# --- Multi-Criteria TOPSIS Prioritization ---
class PrioritizationRequest(BaseModel):
    district: Optional[str] = None
    weight_hvi: float = 0.25
    weight_hazard: float = 0.20
    weight_population: float = 0.20
    weight_historical: float = 0.10
    weight_structural: float = 0.15
    weight_feasibility: float = 0.10


class PrioritizationItemResponse(BaseModel):

    rank: int
    habitation_id: str
    name: str
    district: str
    population: int
    score: float
    reason: str
    hvi: float
    hazard_score: float
    nearest_relocation_site: Optional[str] = None


class PrioritizationResponse(BaseModel):
    district: str
    method: str = "TOPSIS (Technique for Order Preference by Similarity to Ideal Solution)"
    total_evaluated: int
    ranked_habitations: list[PrioritizationItemResponse]
    weights_used: dict[str, float]


# --- System Status ---
class DataSourceStatus(BaseModel):
    status: str  # "LIVE", "DEMO", "CACHED", "UNAVAILABLE"
    last_updated: Optional[datetime] = None
    details: Optional[str] = None


class SystemStatusResponse(BaseModel):
    sources: dict[str, DataSourceStatus]
    data_mode: str
    pilot_region: str
    database_connected: bool
    redis_enabled: bool


# --- Backwards Compatibility Aliases ---
AlertResponse = DisasterAlert
WeatherForecastResponse = WeatherForecastItem
MapLayerResponse = HazardLayerResponse


# --- Administrative Hierarchy (Region -> State -> District -> Block -> Village) ---
class AdministrativeHierarchyNode(BaseModel):
    region: str
    state: str
    district: str
    block: str
    villages: list[str] = []
    lgd_code: Optional[str] = None


class AdministrativeHierarchyResponse(BaseModel):
    regions: list[str]
    states: list[str]
    hierarchy: list[AdministrativeHierarchyNode]


# --- IDRN / DEOC Emergency Response Infrastructure ---
class EmergencyResourceType(str, Enum):
    SHELTER = "shelter"
    RELIEF_CAMP = "relief_camp"
    MEDICAL_POST = "medical_post"
    HELIPAD = "helipad"
    EQUIPMENT_DEPOT = "equipment_depot"
    STAGING_AREA = "staging_area"


class EmergencyResource(BaseModel):
    id: str
    name: str
    resource_type: EmergencyResourceType
    district: str
    state: str = "Uttarakhand"
    region: str = "Western Himalayas"
    block: Optional[str] = None
    latitude: float
    longitude: float
    elevation: Optional[float] = None
    location: GeoPoint
    capacity: int = 0
    equipment: list[str] = []
    contact_person: Optional[str] = None
    contact_phone: Optional[str] = None
    status: str = "operational"
    distance_to_nearest_habitation_km: Optional[float] = None
    geometry: Optional[dict[str, Any]] = None
    provenance: DataProvenance = DataProvenance.STATIC


# --- Copernicus DEM Elevation & Slope Analysis ---
class TerrainElevationPoint(BaseModel):
    lat: float
    lng: float
    elevation: float
    slope_degrees: float
    slope_percentage: float
    slope_grade: str  # Flat (<5°), Gentle (5-15°), Moderate (15-25°), Steep (25-35°), Precipitous (>35°)
    source: str = "Copernicus 30m DEM"
    provenance: DataProvenance = DataProvenance.STATIC


class SlopeAnalysisRequest(BaseModel):
    points: list[GeoPoint]


class SlopeAnalysisResponse(BaseModel):
    results: list[TerrainElevationPoint]
    mean_slope_degrees: float
    max_slope_degrees: float
    safe_relocation_fraction: float


# --- OpenStreetMap (OSM) Infrastructure ---
class OSMRoadFeature(BaseModel):
    id: str
    name: str
    highway_type: str  # motorway, trunk, primary, secondary, tertiary, track
    surface: Optional[str] = "paved"
    lanes: int = 2
    is_evacuation_route: bool = True
    passability_status: str = "clear"  # clear, blocked, compromised
    distance_km: Optional[float] = None
    geometry: Optional[dict[str, Any]] = None
    provenance: DataProvenance = DataProvenance.STATIC


# --- Ingestion Telemetry Schemas ---
class CWCRiverObservation(BaseModel):
    river: str
    station: str
    water_level: float
    warning_level: float
    danger_level: float
    observed_at: datetime
    geometry: Optional[dict[str, Any]] = None


class IMDDistrictWarning(BaseModel):
    location: str
    severity: Severity
    issued_at: datetime
    raw_data: Optional[dict[str, Any]] = None


class NDMAAlert(BaseModel):
    event_type: str
    severity: Severity
    area: str
    issued_at: datetime
    expires_at: Optional[datetime] = None
    description: str
    geometry: Optional[dict[str, Any]] = None


# --- Provider Health & Provenance Schemas ---
class ProviderHealthStatus(BaseModel):
    provider: str
    status: str = "DEMO"  # LIVE, CACHED, STATIC, DEMO, UNAVAILABLE
    source: str = "Internal"
    last_updated: Optional[datetime] = None
    latency_ms: float = 0.0
    quality: str = "GOOD"  # GOOD, DEGRADED, STALE, MOCK
    record_count: int = 0
    error_message: Optional[str] = None


class SystemProvidersStatusResponse(BaseModel):
    overall_status: str = "OPERATIONAL"
    live_count: int = 0
    total_providers: int = 0
    providers: dict[str, ProviderHealthStatus]
    timestamp: datetime = Field(default_factory=datetime.utcnow)


# --- Dynamic Explainable Intelligence Schemas ---
class HazardFactorBreakdown(BaseModel):
    rainfall: float = Field(default=0.0, ge=0.0, le=1.0)
    rainfall_mm: float = 0.0
    slope: float = Field(default=0.0, ge=0.0, le=1.0)
    slope_degrees: float = 0.0
    river_proximity: float = Field(default=0.0, ge=0.0, le=1.0)
    distance_to_river_km: float = 0.0
    glof_exposure: float = Field(default=0.0, ge=0.0, le=1.0)
    seismic_zone: int = 5
    historical_events: int = 0
    ml_susceptibility: Optional[float] = None
    contributors: list[str] = []


class DynamicHazardAssessment(BaseModel):
    habitation_id: str
    habitation_name: str
    composite_hazard_score: float = Field(ge=0.0, le=1.0)
    hazard_level: RiskLevel
    factors: HazardFactorBreakdown
    provenance: DataProvenance = DataProvenance.LIVE
    calculated_at: datetime = Field(default_factory=datetime.utcnow)


class DynamicVulnerabilityAssessment(BaseModel):
    habitation_id: str
    habitation_name: str
    overall_hvi: float = Field(ge=0.0, le=1.0)
    level: RiskLevel
    exposure: float = Field(ge=0.0, le=1.0)
    sensitivity: float = Field(ge=0.0, le=1.0)
    adaptive_capacity: float = Field(ge=0.0, le=1.0)
    unknown_factors: list[str] = []
    provenance: DataProvenance = DataProvenance.LIVE
    calculated_at: datetime = Field(default_factory=datetime.utcnow)


class DynamicRelocationSuitabilityAssessment(BaseModel):
    site_id: str
    site_name: str
    suitability_score: float = Field(ge=0.0, le=1.0)
    level: str  # HIGH, MODERATE, LOW
    capacity: int
    slope_degrees: float
    distance_from_affected_km: float
    road_access: bool
    hazard_safety: float
    constraints_met: int
    constraints_total: int
    details: dict[str, float]
    provenance: DataProvenance = DataProvenance.LIVE
    calculated_at: datetime = Field(default_factory=datetime.utcnow)


class DisasterHistoricalEvent(BaseModel):
    id: str
    name: str
    year: int
    event_type: HazardType
    affected_district: str
    affected_habitations: list[str]
    description: str
    severity_index: float
    source: str = "Official Disaster Archives"



