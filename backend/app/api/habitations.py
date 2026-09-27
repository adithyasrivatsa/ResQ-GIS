"""
Habitations API endpoints.
Provides monitored settlements, demographics, dynamic vulnerability scores,
and real-time hazard exposures derived from live telemetry.
"""
from __future__ import annotations
from fastapi import APIRouter, HTTPException
from app.schemas import HabitationResponse, HazardExposure, HazardType
from app.services.gis_service import get_gis_service
from app.services.intelligence_service import get_intelligence_service

router = APIRouter(prefix="/api/habitations", tags=["habitations"])


@router.get("", response_model=list[HabitationResponse])
async def list_habitations(
    region: str | None = None,
    district: str | None = None,
    block: str | None = None,
    min_risk: float | None = None,
    dynamic: bool = True,
):
    """
    List all monitored habitations, optionally filtered by region, district, block, or minimum risk.
    When dynamic=True (default), risk scores and vulnerability indices are dynamically evaluated
    against live weather telemetry, real DEM slope, ML landslide model, and river gauge levels.
    """
    gis = get_gis_service()
    habitations = await gis.get_habitations(region=region, district=district, block=block)

    if dynamic:
        intel = get_intelligence_service()
        enriched: list[HabitationResponse] = []
        for h in habitations:
            try:
                hz = await intel.assess_habitation_hazard(h)
                vuln = await intel.assess_habitation_vulnerability(h, hz)

                # Update habitation response with dynamically computed values
                h.risk_score = hz.composite_hazard_score
                h.risk_level = hz.hazard_level
                if h.vulnerability_index:
                    h.vulnerability_index.overall = vuln.overall_hvi
                    h.vulnerability_index.level = vuln.level
                    h.vulnerability_index.exposure = vuln.exposure
                    h.vulnerability_index.sensitivity = vuln.sensitivity
                    h.vulnerability_index.adaptive_capacity = vuln.adaptive_capacity

                # Build updated hazard exposure breakdowns
                h.hazard_exposure = [
                    HazardExposure(
                        type=HazardType.LANDSLIDE,
                        level=hz.hazard_level,
                        score=round(min(hz.factors.slope * 0.5 + hz.factors.rainfall * 0.5, 1.0), 2),
                        contributors=[c for c in hz.factors.contributors if "landslide" in c.lower() or "slope" in c.lower() or "rainfall" in c.lower()],
                    ),
                    HazardExposure(
                        type=HazardType.FLOOD,
                        level=hz.hazard_level,
                        score=round(min(hz.factors.river_proximity * 0.6 + hz.factors.rainfall * 0.4, 1.0), 2),
                        contributors=[c for c in hz.factors.contributors if "river" in c.lower() or "flood" in c.lower() or "elevation" in c.lower()],
                    ),
                    HazardExposure(
                        type=HazardType.GLOF,
                        level=hz.hazard_level,
                        score=hz.factors.glof_exposure,
                        contributors=[c for c in hz.factors.contributors if "glof" in c.lower() or "glacial" in c.lower()],
                    ),
                ]
                h.provenance = hz.provenance
            except Exception:
                pass
            enriched.append(h)
        habitations = enriched

    if min_risk is not None:
        habitations = [h for h in habitations if h.risk_score >= min_risk]

    return habitations


@router.get("/{habitation_id}", response_model=HabitationResponse)
async def get_habitation(habitation_id: str):
    """Get detailed risk and vulnerability profile for a specific habitation."""
    gis = get_gis_service()
    hab = await gis.get_habitation_by_id(habitation_id)
    if not hab:
        raise HTTPException(status_code=404, detail=f"Habitation '{habitation_id}' not found")

    intel = get_intelligence_service()
    try:
        hz = await intel.assess_habitation_hazard(hab)
        vuln = await intel.assess_habitation_vulnerability(hab, hz)
        hab.risk_score = hz.composite_hazard_score
        hab.risk_level = hz.hazard_level
        if hab.vulnerability_index:
            hab.vulnerability_index.overall = vuln.overall_hvi
            hab.vulnerability_index.level = vuln.level
            hab.vulnerability_index.exposure = vuln.exposure
            hab.vulnerability_index.sensitivity = vuln.sensitivity
            hab.vulnerability_index.adaptive_capacity = vuln.adaptive_capacity
        hab.provenance = hz.provenance
    except Exception:
        pass

    return hab
