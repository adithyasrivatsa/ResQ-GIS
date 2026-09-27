"""
Hazard Layers and Risk Assessment API endpoints.
Provides spatial hazard polygon layers and district operational risk reports.
"""
from fastapi import APIRouter
from datetime import datetime
from app.schemas import HazardLayerResponse, RiskReportResponse, OSMRoadFeature
from app.services.gis_service import get_gis_service
from app.services.alert_service import get_alert_service

router = APIRouter(tags=["hazards-and-layers"])


@router.get("/api/layers", response_model=list[HazardLayerResponse])
@router.get("/api/hazards", response_model=list[HazardLayerResponse])
async def list_hazard_layers(region: str | None = None):
    """List all available hazard zone polygon layers and operational overlays."""
    gis = get_gis_service()
    return await gis.get_hazard_layers(region=region)


@router.get("/api/hazards/{hazard_type}", response_model=list[HazardLayerResponse])
async def get_hazards_by_type(hazard_type: str):
    """Filter hazard polygon layers by hazard type (e.g. landslide, flood, glof)."""
    gis = get_gis_service()
    layers = await gis.get_hazard_layers()
    return [l for l in layers if l.type.lower() == hazard_type.lower() or (l.description and hazard_type.lower() in l.description.lower())]


@router.get("/api/roads", response_model=list[OSMRoadFeature])
async def list_roads(region: str | None = None):
    """List OpenStreetMap evacuation road networks and lifelines."""
    gis = get_gis_service()
    return await gis.get_roads(region=region)


@router.get("/api/risk/district/{district}", response_model=RiskReportResponse)
async def get_district_risk(district: str):
    """Generate comprehensive relocation risk report for a target district."""
    gis = get_gis_service()
    alert_svc = get_alert_service()

    habitations = await gis.get_habitations(region=district)
    sites = await gis.get_relocation_sites(region=district)
    alerts = await alert_svc.get_alerts(region=district)
    at_risk = [h for h in habitations if h.risk_score >= 0.6]

    return RiskReportResponse(
        district=district,
        generated_at=datetime.utcnow(),
        total_habitations=len(habitations),
        at_risk_count=len(at_risk),
        total_population_exposed=sum(h.population for h in at_risk),
        habitations=habitations,
        relocation_sites=sites,
        active_alerts=alerts,
    )
