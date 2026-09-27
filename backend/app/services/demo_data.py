"""
Demo data service.
Provides mock data for development when live APIs are not configured.
All demo data is clearly marked with is_demo=True.
"""
from __future__ import annotations
from datetime import datetime, timedelta
from app.schemas import (
    HabitationResponse, RelocationSiteResponse, AlertResponse,
    WeatherForecastResponse, MapLayerResponse, RiskReportResponse,
    GeoPoint, HazardExposure, VulnerabilityIndex, SiteConstraint,
    HazardType, RiskLevel, Severity,
)


def get_demo_habitations() -> list[HabitationResponse]:
    return [
        HabitationResponse(
            id="hab-joshimath", name="Joshimath", district="Chamoli", state="Uttarakhand",
            location=GeoPoint(lat=30.5550, lng=79.5660, elevation=1890),
            population=4213, households=892, risk_score=0.78, risk_level=RiskLevel.HIGH,
            hazard_exposure=[
                HazardExposure(type=HazardType.LANDSLIDE, level=RiskLevel.HIGH, score=0.85,
                    contributors=["High landslide susceptibility", "Active subsidence zone", "Steep slope gradient"]),
                HazardExposure(type=HazardType.FLOOD, level=RiskLevel.MODERATE, score=0.55,
                    contributors=["Proximity to Alaknanda", "Recent rainfall anomaly"]),
                HazardExposure(type=HazardType.GLOF, level=RiskLevel.MODERATE, score=0.52,
                    contributors=["Upstream glacial lakes", "Climate warming trend"]),
                HazardExposure(type=HazardType.EARTHQUAKE, level=RiskLevel.LOW, score=0.35,
                    contributors=["Seismic Zone V"]),
            ],
            vulnerability_index=VulnerabilityIndex(overall=0.78, level=RiskLevel.HIGH,
                exposure=0.82, sensitivity=0.74, adaptive_capacity=0.31),
            recommended_action="Prioritize phased relocation",
            nearest_relocation_site="site-pipalkoti",
        ),
        HabitationResponse(
            id="hab-kedarnath-base", name="Kedarnath (Base Area)", district="Rudraprayag", state="Uttarakhand",
            location=GeoPoint(lat=30.7346, lng=79.0669, elevation=3583),
            population=600, households=150, risk_score=0.82, risk_level=RiskLevel.CRITICAL,
            hazard_exposure=[
                HazardExposure(type=HazardType.LANDSLIDE, level=RiskLevel.HIGH, score=0.80,
                    contributors=["Steep moraine deposits", "2013 disaster history"]),
                HazardExposure(type=HazardType.FLOOD, level=RiskLevel.CRITICAL, score=0.90,
                    contributors=["Mandakini source", "Chorabari Tal GLOF history"]),
                HazardExposure(type=HazardType.GLOF, level=RiskLevel.HIGH, score=0.78,
                    contributors=["Chorabari Glacier", "Gandhi Sarovar"]),
                HazardExposure(type=HazardType.EARTHQUAKE, level=RiskLevel.MODERATE, score=0.50,
                    contributors=["Seismic Zone V"]),
            ],
            vulnerability_index=VulnerabilityIndex(overall=0.82, level=RiskLevel.CRITICAL,
                exposure=0.88, sensitivity=0.80, adaptive_capacity=0.22),
            recommended_action="Critical: Seasonal evacuation protocol required",
            nearest_relocation_site="site-sonprayag",
        ),
        HabitationResponse(
            id="hab-reni", name="Reni", district="Chamoli", state="Uttarakhand",
            location=GeoPoint(lat=30.5930, lng=79.7560, elevation=2200),
            population=380, households=85, risk_score=0.75, risk_level=RiskLevel.HIGH,
            hazard_exposure=[
                HazardExposure(type=HazardType.LANDSLIDE, level=RiskLevel.CRITICAL, score=0.92,
                    contributors=["Feb 2021 rock/ice avalanche zone", "Extreme slope"]),
                HazardExposure(type=HazardType.FLOOD, level=RiskLevel.HIGH, score=0.70,
                    contributors=["Rishiganga valley", "Debris dam failure risk"]),
                HazardExposure(type=HazardType.GLOF, level=RiskLevel.HIGH, score=0.72,
                    contributors=["Upstream glacial features"]),
                HazardExposure(type=HazardType.EARTHQUAKE, level=RiskLevel.LOW, score=0.35,
                    contributors=["Seismic Zone V"]),
            ],
            vulnerability_index=VulnerabilityIndex(overall=0.75, level=RiskLevel.HIGH,
                exposure=0.85, sensitivity=0.72, adaptive_capacity=0.28),
            recommended_action="Immediate relocation recommended",
            nearest_relocation_site="site-pipalkoti",
        ),
        HabitationResponse(
            id="hab-marwari", name="Marwari", district="Chamoli", state="Uttarakhand",
            location=GeoPoint(lat=30.5420, lng=79.5580, elevation=1750),
            population=1850, households=410, risk_score=0.72, risk_level=RiskLevel.HIGH,
            hazard_exposure=[
                HazardExposure(type=HazardType.LANDSLIDE, level=RiskLevel.HIGH, score=0.80,
                    contributors=["Slope instability", "Poor drainage"]),
                HazardExposure(type=HazardType.FLOOD, level=RiskLevel.MODERATE, score=0.50,
                    contributors=["Flash flood channel proximity"]),
                HazardExposure(type=HazardType.GLOF, level=RiskLevel.LOW, score=0.30, contributors=[]),
                HazardExposure(type=HazardType.EARTHQUAKE, level=RiskLevel.LOW, score=0.35,
                    contributors=["Seismic Zone V"]),
            ],
            vulnerability_index=VulnerabilityIndex(overall=0.72, level=RiskLevel.HIGH,
                exposure=0.76, sensitivity=0.70, adaptive_capacity=0.34),
            recommended_action="Initiate relocation planning",
            nearest_relocation_site="site-pipalkoti",
        ),
        HabitationResponse(
            id="hab-augustmuni", name="Augustmuni", district="Rudraprayag", state="Uttarakhand",
            location=GeoPoint(lat=30.3960, lng=79.0540, elevation=850),
            population=3200, households=720, risk_score=0.68, risk_level=RiskLevel.MODERATE,
            hazard_exposure=[
                HazardExposure(type=HazardType.LANDSLIDE, level=RiskLevel.MODERATE, score=0.55,
                    contributors=["Valley slope", "Weathered rock"]),
                HazardExposure(type=HazardType.FLOOD, level=RiskLevel.HIGH, score=0.75,
                    contributors=["Mandakini river proximity", "Flood plain settlement"]),
                HazardExposure(type=HazardType.GLOF, level=RiskLevel.LOW, score=0.20, contributors=[]),
                HazardExposure(type=HazardType.EARTHQUAKE, level=RiskLevel.MODERATE, score=0.45,
                    contributors=["Seismic Zone V"]),
            ],
            vulnerability_index=VulnerabilityIndex(overall=0.68, level=RiskLevel.MODERATE,
                exposure=0.72, sensitivity=0.66, adaptive_capacity=0.40),
            recommended_action="Flood early warning priority",
            nearest_relocation_site="site-tilwara",
        ),
        HabitationResponse(
            id="hab-sunil", name="Sunil Village", district="Chamoli", state="Uttarakhand",
            location=GeoPoint(lat=30.5380, lng=79.5430, elevation=1680),
            population=820, households=180, risk_score=0.65, risk_level=RiskLevel.MODERATE,
            hazard_exposure=[
                HazardExposure(type=HazardType.LANDSLIDE, level=RiskLevel.MODERATE, score=0.60,
                    contributors=["Moderate slope", "Deforested area"]),
                HazardExposure(type=HazardType.FLOOD, level=RiskLevel.MODERATE, score=0.55,
                    contributors=["Near seasonal nala"]),
                HazardExposure(type=HazardType.GLOF, level=RiskLevel.LOW, score=0.25, contributors=[]),
                HazardExposure(type=HazardType.EARTHQUAKE, level=RiskLevel.LOW, score=0.35,
                    contributors=["Seismic Zone V"]),
            ],
            vulnerability_index=VulnerabilityIndex(overall=0.65, level=RiskLevel.MODERATE,
                exposure=0.68, sensitivity=0.64, adaptive_capacity=0.38),
            recommended_action="Monitor and prepare contingency plan",
            nearest_relocation_site="site-pipalkoti",
        ),
        HabitationResponse(
            id="hab-auli", name="Auli", district="Chamoli", state="Uttarakhand",
            location=GeoPoint(lat=30.5280, lng=79.5650, elevation=2519),
            population=450, households=95, risk_score=0.42, risk_level=RiskLevel.LOW,
            hazard_exposure=[
                HazardExposure(type=HazardType.LANDSLIDE, level=RiskLevel.LOW, score=0.30,
                    contributors=["Rocky terrain"]),
                HazardExposure(type=HazardType.FLOOD, level=RiskLevel.MINIMAL, score=0.15, contributors=[]),
                HazardExposure(type=HazardType.GLOF, level=RiskLevel.LOW, score=0.28, contributors=[]),
                HazardExposure(type=HazardType.EARTHQUAKE, level=RiskLevel.MODERATE, score=0.50,
                    contributors=["Seismic Zone V", "Elevation"]),
            ],
            vulnerability_index=VulnerabilityIndex(overall=0.42, level=RiskLevel.LOW,
                exposure=0.40, sensitivity=0.38, adaptive_capacity=0.55),
            recommended_action="Standard monitoring",
            nearest_relocation_site="site-chamoli-town",
        ),
    ]


def get_demo_relocation_sites() -> list[RelocationSiteResponse]:
    return [
        RelocationSiteResponse(
            id="site-pipalkoti", name="Pipalkoti", district="Chamoli",
            location=GeoPoint(lat=30.4290, lng=79.4310, elevation=1260),
            suitability=RiskLevel.HIGH, suitability_score=0.85, capacity=6000,
            distance_from_affected=4.2, slope_grade="Gentle (5-10°)",
            has_road_access=True, has_water_access=True, near_infrastructure=True,
            constraints=[
                SiteConstraint(label="Low slope gradient", met=True),
                SiteConstraint(label="Outside major hazard zones", met=True),
                SiteConstraint(label="Road access (NH-7)", met=True),
                SiteConstraint(label="Near water source", met=True),
                SiteConstraint(label="Sufficient carrying capacity", met=True),
                SiteConstraint(label="Healthcare within 5km", met=True),
            ],
        ),
        RelocationSiteResponse(
            id="site-gauchar", name="Gauchar", district="Chamoli",
            location=GeoPoint(lat=30.2890, lng=79.1850, elevation=800),
            suitability=RiskLevel.HIGH, suitability_score=0.88, capacity=8000,
            distance_from_affected=22.0, slope_grade="Flat (0-5°)",
            has_road_access=True, has_water_access=True, near_infrastructure=True,
            constraints=[
                SiteConstraint(label="Low slope gradient", met=True),
                SiteConstraint(label="Outside major hazard zones", met=True),
                SiteConstraint(label="Road access (NH-7)", met=True),
                SiteConstraint(label="Near water source", met=True),
                SiteConstraint(label="Sufficient carrying capacity", met=True),
                SiteConstraint(label="Healthcare + School within 5km", met=True),
            ],
        ),
        RelocationSiteResponse(
            id="site-tilwara", name="Tilwara", district="Rudraprayag",
            location=GeoPoint(lat=30.4580, lng=79.0800, elevation=750),
            suitability=RiskLevel.HIGH, suitability_score=0.80, capacity=4000,
            distance_from_affected=6.3, slope_grade="Gentle (5-10°)",
            has_road_access=True, has_water_access=True, near_infrastructure=True,
            constraints=[
                SiteConstraint(label="Low slope gradient", met=True),
                SiteConstraint(label="Outside major hazard zones", met=True),
                SiteConstraint(label="Road access (NH-7)", met=True),
                SiteConstraint(label="Near water source", met=True),
                SiteConstraint(label="Sufficient carrying capacity", met=True),
                SiteConstraint(label="Healthcare within 5km", met=True),
            ],
        ),
        RelocationSiteResponse(
            id="site-chamoli-town", name="Chamoli Town", district="Chamoli",
            location=GeoPoint(lat=30.4050, lng=79.3250, elevation=1300),
            suitability=RiskLevel.MODERATE, suitability_score=0.68, capacity=3500,
            distance_from_affected=12.5, slope_grade="Moderate (10-15°)",
            has_road_access=True, has_water_access=True, near_infrastructure=True,
            constraints=[
                SiteConstraint(label="Low slope gradient", met=False),
                SiteConstraint(label="Outside major hazard zones", met=True),
                SiteConstraint(label="Road access", met=True),
                SiteConstraint(label="Near water source", met=True),
                SiteConstraint(label="Sufficient carrying capacity", met=False),
                SiteConstraint(label="Healthcare within 5km", met=True),
            ],
        ),
        RelocationSiteResponse(
            id="site-sonprayag", name="Sonprayag", district="Rudraprayag",
            location=GeoPoint(lat=30.6320, lng=79.0620, elevation=1829),
            suitability=RiskLevel.MODERATE, suitability_score=0.62, capacity=2500,
            distance_from_affected=8.0, slope_grade="Moderate (10-15°)",
            has_road_access=True, has_water_access=True, near_infrastructure=False,
            constraints=[
                SiteConstraint(label="Low slope gradient", met=False),
                SiteConstraint(label="Outside major hazard zones", met=True),
                SiteConstraint(label="Road access", met=True),
                SiteConstraint(label="Near water source", met=True),
                SiteConstraint(label="Sufficient carrying capacity", met=True),
                SiteConstraint(label="Healthcare within 5km", met=False),
            ],
        ),
    ]


def get_demo_alerts() -> list[AlertResponse]:
    now = datetime.utcnow()
    return [
        AlertResponse(
            id="alert-1", source="IMD", event_type="Heavy Rain Warning",
            severity=Severity.ORANGE, area="Chamoli District",
            description="Heavy to very heavy rainfall likely over Chamoli district during next 24 hours.",
            issued_at=now - timedelta(minutes=15),
        ),
        AlertResponse(
            id="alert-2", source="CWC", event_type="River Level Warning",
            severity=Severity.YELLOW, area="Alaknanda River, Srinagar Station",
            description="Alaknanda River water level approaching warning level at Srinagar gauge station.",
            issued_at=now - timedelta(minutes=32),
        ),
        AlertResponse(
            id="alert-3", source="NDMA", event_type="Landslide Alert",
            severity=Severity.ORANGE, area="Joshimath Region",
            description="Continued subsidence activity reported in Joshimath. Residents advised to remain vigilant.",
            issued_at=now - timedelta(hours=1),
        ),
        AlertResponse(
            id="alert-4", source="IMD", event_type="Thunderstorm Warning",
            severity=Severity.YELLOW, area="Rudraprayag District",
            description="Thunderstorm with lightning likely over Rudraprayag district.",
            issued_at=now - timedelta(hours=2),
        ),
        AlertResponse(
            id="alert-5", source="GSI", event_type="Seismic Activity",
            severity=Severity.GREEN, area="Garhwal Region",
            description="Minor seismic event (M 2.3) recorded near Chamoli. No damage reported.",
            issued_at=now - timedelta(hours=5),
        ),
    ]


def get_demo_weather() -> list[WeatherForecastResponse]:
    today = datetime.utcnow().date()
    days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]
    return [
        WeatherForecastResponse(
            date=str(today), day_label="TODAY",
            condition="RAIN", max_temp=18, min_temp=12, rainfall=45,
            warning=Severity.ORANGE,
        ),
        WeatherForecastResponse(
            date=str(today + timedelta(days=1)),
            day_label=days[(today + timedelta(days=1)).weekday()],
            condition="RAIN", max_temp=17, min_temp=11, rainfall=60,
            warning=Severity.ORANGE,
        ),
        WeatherForecastResponse(
            date=str(today + timedelta(days=2)),
            day_label=days[(today + timedelta(days=2)).weekday()],
            condition="CLOUD", max_temp=19, min_temp=13, rainfall=12,
            warning=Severity.YELLOW,
        ),
        WeatherForecastResponse(
            date=str(today + timedelta(days=3)),
            day_label=days[(today + timedelta(days=3)).weekday()],
            condition="CLEAR", max_temp=22, min_temp=14, rainfall=0,
        ),
    ]


def get_demo_layers() -> list[MapLayerResponse]:
    return [
        MapLayerResponse(id="satellite", name="Satellite Imagery", type="imagery", category="base", visible=True),
        MapLayerResponse(id="terrain", name="Terrain", type="terrain", category="base", visible=True),
        MapLayerResponse(id="admin-boundaries", name="Administrative Boundaries", type="geojson", category="base", visible=True),
        MapLayerResponse(id="rivers", name="Rivers", type="geojson", category="infrastructure", visible=True),
        MapLayerResponse(id="roads", name="Roads", type="geojson", category="infrastructure", visible=False),
        MapLayerResponse(id="landslide", name="Landslide Susceptibility", type="geojson", category="hazard", visible=True),
        MapLayerResponse(id="flood", name="Flood Inundation", type="geojson", category="hazard", visible=False),
        MapLayerResponse(id="glof", name="GLOF Risk", type="geojson", category="hazard", visible=False),
        MapLayerResponse(id="earthquake", name="Earthquake Hazard", type="geojson", category="hazard", visible=False),
        MapLayerResponse(id="habitations", name="Habitations", type="geojson", category="operational", visible=True),
        MapLayerResponse(id="at-risk-habitations", name="At-Risk Habitations", type="geojson", category="operational", visible=True),
        MapLayerResponse(id="relocation-sites", name="Relocation Sites", type="geojson", category="operational", visible=True),
    ]
