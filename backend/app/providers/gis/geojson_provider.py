"""
GeoJSON GIS Provider.
Reads georeferenced Habitations, Relocation Sites, and Hazard Layers from GeoJSON datasets.
Also supports importing CSV and GeoJSON updates.
"""
from __future__ import annotations
import json
import csv
from pathlib import Path
from typing import Any
from app.schemas import (
    HabitationResponse,
    RelocationSiteResponse,
    HazardLayerResponse,
    GeoPoint,
    RiskLevel,
    Severity,
    HazardType,
    SiteConstraint,
    HabitationVulnerability,
    VulnerabilityIndex,
    HazardExposure,
    DataProvenance,
)
from app.providers.base import GISProvider

DATA_DIR = Path(__file__).resolve().parents[4] / "data" / "geojson"


class GeoJSONGISProvider(GISProvider):
    @property
    def name(self) -> str:
        return "GeoJSON GIS Provider (File-based)"

    def _read_file(self, filename: str) -> dict[str, Any]:
        filepath = DATA_DIR / filename
        if filepath.exists():
            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                pass
        return {"features": []}

    async def get_habitations(self, region: str | None = None) -> list[HabitationResponse]:
        data = self._read_file("habitations.geojson")
        results = []
        for feat in data.get("features", []):
            props = feat.get("properties", {})
            dist = props.get("district", "Chamoli")
            if region and region.lower() not in dist.lower():
                continue

            lat = props.get("latitude", 0.0)
            lng = props.get("longitude", 0.0)
            elev = props.get("elevation", 0.0)

            vuln_dict = props.get("vulnerability", {})
            vuln_obj = HabitationVulnerability(
                kutcha_house_percentage=vuln_dict.get("kutchaHousePercentage", 0.0),
                elderly_count=vuln_dict.get("elderlyCount", 0),
                children_count=vuln_dict.get("childrenCount", 0),
                road_cutoff_risk=vuln_dict.get("roadCutoffRisk", 0.0),
            )

            vi_dict = props.get("vulnerabilityIndex", {})
            vi_obj = VulnerabilityIndex(
                overall=vi_dict.get("overall", 0.5),
                level=RiskLevel(vi_dict.get("level", "MODERATE")),
                exposure=vi_dict.get("exposure", 0.5),
                sensitivity=vi_dict.get("sensitivity", 0.5),
                adaptive_capacity=vi_dict.get("adaptiveCapacity", 0.5),
            )

            haz_list = []
            for h in props.get("hazardExposure", []):
                haz_list.append(
                    HazardExposure(
                        type=HazardType(h.get("type", "landslide")),
                        level=RiskLevel(h.get("level", "MODERATE")),
                        score=float(h.get("score", 0.5)),
                        contributors=h.get("contributors", []),
                    )
                )

            results.append(
                HabitationResponse(
                    id=props.get("id", feat.get("id")),
                    name=props.get("name", "Unknown"),
                    village=props.get("village"),
                    district=dist,
                    state=props.get("state", "Uttarakhand"),
                    region=props.get("region", "Western Himalayas"),
                    block=props.get("block", "Joshimath" if "joshimath" in props.get("name", "").lower() or "joshimath" in str(props.get("village", "")).lower() else "Dasholi" if "pipalkoti" in props.get("name", "").lower() else "Ukhimath" if "guptkashi" in props.get("name", "").lower() else "Joshimath"),
                    lgd_code=props.get("lgdCode", props.get("lgd_code")),
                    latitude=lat,
                    longitude=lng,
                    elevation=elev,
                    location=GeoPoint(lat=lat, lng=lng, elevation=elev),
                    population=int(props.get("population", 0)),
                    households=int(props.get("households", 0)),
                    risk_score=float(props.get("riskScore", 0.5)),
                    risk_level=RiskLevel(props.get("riskLevel", "MODERATE")),
                    vulnerability=vuln_obj,
                    hazard_exposure=haz_list,
                    vulnerability_index=vi_obj,
                    recommended_action=props.get("recommendedAction", ""),
                    nearest_relocation_site=props.get("nearestRelocationSite"),
                    geometry=feat.get("geometry"),
                    provenance=DataProvenance.STATIC,
                )
            )
        return results

    async def get_relocation_sites(self, region: str | None = None) -> list[RelocationSiteResponse]:
        data = self._read_file("relocation_sites.geojson")
        results = []
        for feat in data.get("features", []):
            props = feat.get("properties", {})
            dist = props.get("district", "Chamoli")
            if region and region.lower() not in dist.lower():
                continue

            lat = props.get("latitude", 0.0)
            lng = props.get("longitude", 0.0)
            elev = props.get("elevation", 0.0)

            constraints = [
                SiteConstraint(label=c["label"], met=c["met"])
                for c in props.get("constraints", [])
            ]

            results.append(
                RelocationSiteResponse(
                    id=props.get("id", feat.get("id")),
                    name=props.get("name", "Site"),
                    district=dist,
                    state=props.get("state", "Uttarakhand"),
                    region=props.get("region", "Western Himalayas"),
                    block=props.get("block", "Dasholi" if "pipalkoti" in props.get("name", "").lower() else "Joshimath" if "joshimath" in props.get("name", "").lower() or "ravigram" in props.get("name", "").lower() else "Ukhimath" if "guptkashi" in props.get("name", "").lower() else "Dasholi"),
                    lgd_code=props.get("lgdCode", props.get("lgd_code")),
                    latitude=lat,
                    longitude=lng,
                    elevation=elev,
                    location=GeoPoint(lat=lat, lng=lng, elevation=elev),
                    usable_area_sqm=props.get("usableAreaSqM"),
                    emergency_capacity=props.get("emergencyCapacity", props.get("capacity", 5000)),
                    capacity=props.get("capacity", 5000),
                    slope=props.get("slope"),
                    slope_grade=props.get("slopeGrade", "Gentle"),
                    road_access=props.get("roadAccess", True),
                    drinking_water=props.get("drinkingWater", True),
                    electricity=props.get("electricity", True),
                    medical_facility_nearby=props.get("medicalFacilityNearby", True),
                    distance_to_road_km=props.get("distanceToRoadKm", 0.1),
                    distance_to_medical_km=props.get("distanceToMedicalKm", 2.0),
                    hazard_exposure=props.get("hazardExposure", 0.1),
                    suitability=RiskLevel(props.get("suitability", "HIGH")),
                    suitability_score=float(props.get("suitabilityScore", 0.85)),
                    distance_from_affected=float(props.get("distanceFromAffected", 5.0)),
                    constraints=constraints,
                    geometry=feat.get("geometry"),
                    provenance=DataProvenance.STATIC,
                )
            )
        return results

    async def get_hazard_layers(self, region: str | None = None) -> list[HazardLayerResponse]:
        files_to_load = ["hazard_layers.geojson", "bhuvan_layers.geojson", "gsi_nlsm_landslides.geojson"]
        results = []
        seen_ids = set()

        for filename in files_to_load:
            data = self._read_file(filename)
            for feat in data.get("features", []):
                props = feat.get("properties", {})
                layer_id = props.get("id", feat.get("id"))
                if layer_id in seen_ids:
                    continue
                seen_ids.add(layer_id)

                sev = props.get("severity")
                results.append(
                    HazardLayerResponse(
                        id=layer_id,
                        name=props.get("name", "Hazard Layer"),
                        type=props.get("type", "polygon"),
                        source=props.get("source", "GIS Study"),
                        severity=Severity(sev) if sev in Severity._value2member_map_ else None,
                        geometry=feat.get("geometry"),
                        visible=props.get("visible", True),
                        description=props.get("description"),
                    )
                )
        return results
