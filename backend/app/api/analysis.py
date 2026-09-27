"""
Analysis and Decision-Support API endpoints.
Provides dynamically derived TOPSIS multi-criteria prioritization,
explainable hazard factor breakdowns, HVI assessments, and ML model status.
"""
from __future__ import annotations
import json
from pathlib import Path
from fastapi import APIRouter, HTTPException
from app.schemas import (
    PrioritizationResponse,
    PrioritizationItemResponse,
    DynamicHazardAssessment,
    DynamicVulnerabilityAssessment,
    DynamicRelocationSuitabilityAssessment,
)
from app.services.gis_service import get_gis_service
from app.services.intelligence_service import get_intelligence_service
from app.services.disaster_history import get_disaster_history_service
from app.intelligence.prioritization import topsis_prioritize, PrioritizationInput
from app.intelligence.models.landslide_inference import METADATA_PATH

router = APIRouter(prefix="/api/analysis", tags=["analysis"])


@router.get("/prioritization", response_model=PrioritizationResponse)
async def get_prioritization(
    district: str | None = None,
    weight_hvi: float = 0.25,
    weight_hazard: float = 0.20,
    weight_population: float = 0.20,
    weight_historical: float = 0.10,
    weight_structural: float = 0.15,
    weight_feasibility: float = 0.10,
):
    """
    Compute TOPSIS multi-criteria prioritization for habitations using
    dynamically evaluated hazard exposure, HVI, real population, and documented disaster archives.
    """
    gis = get_gis_service()
    intel = get_intelligence_service()
    history = get_disaster_history_service()

    habitations = await gis.get_habitations(region=district)
    if district:
        habitations = [h for h in habitations if h.district.lower() == district.lower()]

    inputs: list[PrioritizationInput] = []
    hab_meta: dict[str, dict] = {}

    for h in habitations:
        # Dynamically evaluate hazard and vulnerability from live telemetry
        hz = await intel.assess_habitation_hazard(h)
        vuln = await intel.assess_habitation_vulnerability(h, hz)
        hist_count = history.get_event_count_for_habitation(h.id)

        hab_meta[h.id] = {
            "hab": h,
            "hazard_score": hz.composite_hazard_score,
            "hvi": vuln.overall_hvi,
            "drivers": hz.factors.contributors,
        }

        inputs.append(
            PrioritizationInput(
                habitation_id=h.id,
                name=h.name,
                hvi=vuln.overall_hvi,
                hazard_exposure=hz.composite_hazard_score,
                population_exposed=h.population,
                historical_frequency=hist_count,
                structural_vulnerability=vuln.sensitivity,
                relocation_feasibility=vuln.adaptive_capacity,
            )
        )

    weights = [
        weight_hvi,
        weight_hazard,
        weight_population,
        weight_historical,
        weight_structural,
        weight_feasibility,
    ]

    topsis_results = topsis_prioritize(inputs, weights=weights)

    ranked_items: list[PrioritizationItemResponse] = []
    for r in topsis_results:
        meta = hab_meta.get(r.habitation_id, {})
        hab = meta.get("hab")
        drivers = meta.get("drivers", [])
        driver_str = "; ".join(drivers) if drivers else r.reason

        ranked_items.append(
            PrioritizationItemResponse(
                rank=r.rank,
                habitation_id=r.habitation_id,
                name=r.name,
                district=hab.district if hab else "Chamoli",
                population=hab.population if hab else 0,
                score=r.score,
                reason=driver_str,
                hvi=meta.get("hvi", 0.0),
                hazard_score=meta.get("hazard_score", 0.0),
                nearest_relocation_site=hab.nearest_relocation_site if hab else None,
            )
        )

    return PrioritizationResponse(
        district=district or "All Monitored Districts (Chamoli + Rudraprayag)",
        method="TOPSIS (Technique for Order of Preference by Similarity to Ideal Solution) + Dynamic Feature Engine",
        total_evaluated=len(ranked_items),
        ranked_habitations=ranked_items,
        weights_used={
            "HVI": weight_hvi,
            "Hazard": weight_hazard,
            "Population": weight_population,
            "Historical": weight_historical,
            "Structural": weight_structural,
            "Feasibility": weight_feasibility,
        },
    )


@router.get("/hazard/{habitation_id}", response_model=DynamicHazardAssessment)
async def get_dynamic_hazard_assessment(habitation_id: str):
    """Get real-time dynamic hazard assessment and explainable factor breakdown for a habitation."""
    gis = get_gis_service()
    hab = await gis.get_habitation_by_id(habitation_id)
    if not hab:
        raise HTTPException(status_code=404, detail=f"Habitation '{habitation_id}' not found")
    intel = get_intelligence_service()
    return await intel.assess_habitation_hazard(hab)


@router.get("/vulnerability/{habitation_id}", response_model=DynamicVulnerabilityAssessment)
async def get_dynamic_vulnerability_assessment(habitation_id: str):
    """Get dynamic Habitation Vulnerability Index (HVI) with exposure, sensitivity, and adaptive capacity."""
    gis = get_gis_service()
    hab = await gis.get_habitation_by_id(habitation_id)
    if not hab:
        raise HTTPException(status_code=404, detail=f"Habitation '{habitation_id}' not found")
    intel = get_intelligence_service()
    hz = await intel.assess_habitation_hazard(hab)
    return await intel.assess_habitation_vulnerability(hab, hz)


@router.get("/relocation/{site_id}", response_model=DynamicRelocationSuitabilityAssessment)
async def get_dynamic_relocation_suitability(site_id: str, habitation_id: str | None = None):
    """Get dynamic relocation suitability for a safe haven site."""
    gis = get_gis_service()
    site = await gis.get_relocation_site_by_id(site_id)
    if not site:
        raise HTTPException(status_code=404, detail=f"Relocation site '{site_id}' not found")

    target_lat = 30.555
    target_lng = 79.566
    if habitation_id:
        hab = await gis.get_habitation_by_id(habitation_id)
        if hab:
            target_lat = hab.latitude or (hab.location.lat if hab.location else target_lat)
            target_lng = hab.longitude or (hab.location.lng if hab.location else target_lng)

    intel = get_intelligence_service()
    return await intel.assess_relocation_site(site, target_lat, target_lng)


@router.get("/ml-status")
async def get_ml_model_status():
    """Get trained Landslide Susceptibility ML model metadata, evaluation metrics, and feature importances."""
    if METADATA_PATH.exists():
        try:
            with open(METADATA_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
                data["status"] = "OPERATIONAL"
                data["model_type"] = data.get("algorithm", "RandomForestClassifier")
                return data
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to read ML metadata: {e}")
    return {
        "status": "UNAVAILABLE",
        "detail": "Model artifact not yet trained",
    }
