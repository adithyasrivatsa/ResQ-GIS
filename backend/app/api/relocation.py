"""
Relocation Sites API endpoints.
Provides candidate safe havens, capacity limits, slope gradients, and utility access.
Dynamically calculates terrain slopes from Copernicus DEM and road proximity from OSM.
"""
from __future__ import annotations
from fastapi import APIRouter, HTTPException, Query
from app.schemas import RelocationSiteResponse, DynamicRelocationSuitabilityAssessment, RiskLevel
from app.services.gis_service import get_gis_service
from app.services.intelligence_service import get_intelligence_service

router = APIRouter(tags=["relocation"])


@router.get("/api/relocation/sites", response_model=list[RelocationSiteResponse])
@router.get("/api/relocation-sites", response_model=list[RelocationSiteResponse])
async def list_relocation_sites(
    region: str | None = None,
    district: str | None = None,
    block: str | None = None,
    min_capacity: int | None = None,
    dynamic: bool = True,
):
    """
    List all candidate relocation sites.
    When dynamic=True, terrain slopes and suitability scores are dynamically verified
    via Copernicus DEM and OSM infrastructure network.
    """
    gis = get_gis_service()
    sites = await gis.get_relocation_sites(region=region, district=district, block=block)
    if min_capacity is not None:
        sites = [s for s in sites if s.capacity >= min_capacity]

    if dynamic:
        intel = get_intelligence_service()
        enriched: list[RelocationSiteResponse] = []
        for s in sites:
            try:
                lat = s.latitude or (s.location.lat if s.location else 30.429)
                lng = s.longitude or (s.location.lng if s.location else 79.431)
                assessment = await intel.assess_relocation_site(s, affected_lat=lat, affected_lng=lng)

                s.suitability_score = assessment.suitability_score
                s.suitability = RiskLevel(assessment.level) if assessment.level in RiskLevel._value2member_map_ else RiskLevel.HIGH
                s.slope = assessment.slope_degrees
                s.provenance = assessment.provenance
            except Exception:
                pass
            enriched.append(s)
        return enriched

    return sites


@router.get("/api/relocation/sites/{site_id}", response_model=RelocationSiteResponse)
@router.get("/api/relocation-sites/{site_id}", response_model=RelocationSiteResponse)
async def get_relocation_site(site_id: str, dynamic: bool = True):
    """Get detailed assessment for a specific relocation site."""
    gis = get_gis_service()
    site = await gis.get_relocation_site_by_id(site_id)
    if not site:
        raise HTTPException(status_code=404, detail=f"Relocation site '{site_id}' not found")

    if dynamic:
        try:
            intel = get_intelligence_service()
            lat = site.latitude or (site.location.lat if site.location else 30.429)
            lng = site.longitude or (site.location.lng if site.location else 79.431)
            assessment = await intel.assess_relocation_site(site, affected_lat=lat, affected_lng=lng)
            site.suitability_score = assessment.suitability_score
            site.suitability = RiskLevel(assessment.level) if assessment.level in RiskLevel._value2member_map_ else RiskLevel.HIGH
            site.slope = assessment.slope_degrees
            site.provenance = assessment.provenance
        except Exception:
            pass

    return site


@router.get("/api/relocation/sites/{site_id}/assessment", response_model=DynamicRelocationSuitabilityAssessment)
@router.get("/api/relocation-sites/{site_id}/assessment", response_model=DynamicRelocationSuitabilityAssessment)
async def get_relocation_site_assessment(
    site_id: str,
    affected_lat: float = Query(30.556, description="Latitude of affected habitation"),
    affected_lng: float = Query(79.566, description="Longitude of affected habitation"),
):
    """
    Get full dynamic suitability evaluation for a relocation site relative to an affected zone.
    Evaluates real DEM slope, road connectivity, capacity, and safety factors.
    """
    gis = get_gis_service()
    site = await gis.get_relocation_site_by_id(site_id)
    if not site:
        raise HTTPException(status_code=404, detail=f"Relocation site '{site_id}' not found")

    intel = get_intelligence_service()
    assessment = await intel.assess_relocation_site(site, affected_lat=affected_lat, affected_lng=affected_lng)
    return assessment
