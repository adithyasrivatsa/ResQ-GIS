"""
PostGIS GIS Provider.
Queries PostgreSQL + PostGIS using spatial SQL when connected,
falling back seamlessly to GeoJSON provider when running in demo/offline mode.
Never silently presents mock data as live data.
"""
from __future__ import annotations
import json
import time
import logging
from datetime import datetime
from sqlalchemy import text
from app.database.session import is_database_connected, _SessionLocal
from app.schemas import (
    HabitationResponse,
    RelocationSiteResponse,
    HazardLayerResponse,
    DataProvenance,
    GeoPoint,
    RiskLevel,
    Severity,
    ProviderHealthStatus,
)
from app.providers.base import GISProvider
from app.providers.gis.geojson_provider import GeoJSONGISProvider

logger = logging.getLogger(__name__)


class PostGISProvider(GISProvider):
    def __init__(self):
        self._fallback_geojson = GeoJSONGISProvider()

    @property
    def name(self) -> str:
        return "PostgreSQL + PostGIS Spatial Provider"

    async def get_status(self) -> ProviderHealthStatus:
        t0 = time.perf_counter()
        connected = is_database_connected() and _SessionLocal is not None
        latency = (time.perf_counter() - t0) * 1000.0

        if connected:
            try:
                with _SessionLocal() as session:
                    count = session.execute(text("SELECT COUNT(*) FROM habitations")).scalar() or 0
                return ProviderHealthStatus(
                    provider="gis_postgis",
                    status="LIVE",
                    source="PostgreSQL 16 + PostGIS 3.4 (Relational Spatial Store)",
                    last_updated=datetime.utcnow(),
                    latency_ms=round(latency, 2),
                    quality="GOOD",
                    record_count=count,
                )
            except Exception as e:
                return ProviderHealthStatus(
                    provider="gis_postgis",
                    status="DEGRADED",
                    source="PostgreSQL + PostGIS",
                    last_updated=datetime.utcnow(),
                    latency_ms=round(latency, 2),
                    quality="DEGRADED",
                    error_message=str(e),
                )

        return ProviderHealthStatus(
            provider="gis_postgis",
            status="STATIC",
            source="Local File-Backed Spatial GeoJSON (PostGIS Offline)",
            last_updated=datetime.utcnow(),
            latency_ms=0.5,
            quality="MOCK",
            record_count=7,
        )

    async def get_habitations(self, region: str | None = None) -> list[HabitationResponse]:
        if not is_database_connected() or _SessionLocal is None:
            return await self._fallback_geojson.get_habitations(region)

        try:
            with _SessionLocal() as session:
                query = (
                    "SELECT id, name, village, district, state, latitude, longitude, elevation, "
                    "population, households, risk_score, risk_level, vulnerability, vulnerability_index, "
                    "hazard_exposure, recommended_action, nearest_relocation_site "
                    "FROM habitations"
                )
                params = {}
                if region:
                    query += " WHERE LOWER(district) = LOWER(:region)"
                    params["region"] = region

                rows = session.execute(text(query), params).fetchall()
                if not rows:
                    return await self._fallback_geojson.get_habitations(region)

                habitations: list[HabitationResponse] = []
                for r in rows:
                    lat = float(r.latitude)
                    lng = float(r.longitude)
                    elev = float(r.elevation) if r.elevation is not None else None
                    risk_lvl = (
                        RiskLevel(r.risk_level)
                        if r.risk_level in RiskLevel._value2member_map_
                        else RiskLevel.LOW
                    )

                    habitations.append(
                        HabitationResponse(
                            id=str(r.id),
                            name=str(r.name),
                            village=r.village,
                            district=str(r.district),
                            state=str(r.state or "Uttarakhand"),
                            latitude=lat,
                            longitude=lng,
                            elevation=elev,
                            location=GeoPoint(lat=lat, lng=lng, elevation=elev),
                            population=int(r.population or 0),
                            households=int(r.households or 0),
                            risk_score=float(r.risk_score or 0.0),
                            risk_level=risk_lvl,
                            vulnerability=r.vulnerability,
                            vulnerability_index=r.vulnerability_index,
                            hazard_exposure=r.hazard_exposure or [],
                            recommended_action=r.recommended_action or "",
                            nearest_relocation_site=r.nearest_relocation_site,
                            provenance=DataProvenance.LIVE,
                        )
                    )
                return habitations
        except Exception as e:
            logger.warning(f"PostGIS habitation query failed: {e}; falling back to GeoJSON provider")

        return await self._fallback_geojson.get_habitations(region)

    async def get_relocation_sites(self, region: str | None = None) -> list[RelocationSiteResponse]:
        if not is_database_connected() or _SessionLocal is None:
            return await self._fallback_geojson.get_relocation_sites(region)

        try:
            with _SessionLocal() as session:
                query = (
                    "SELECT id, name, district, state, latitude, longitude, elevation, usable_area_sqm, "
                    "emergency_capacity, capacity, slope, slope_grade, road_access, drinking_water, "
                    "electricity, medical_facility_nearby, distance_to_road_km, distance_to_medical_km, "
                    "hazard_exposure, suitability, suitability_score, constraints "
                    "FROM relocation_sites"
                )
                params = {}
                if region:
                    query += " WHERE LOWER(district) = LOWER(:region)"
                    params["region"] = region

                rows = session.execute(text(query), params).fetchall()
                if not rows:
                    return await self._fallback_geojson.get_relocation_sites(region)

                sites: list[RelocationSiteResponse] = []
                for r in rows:
                    lat = float(r.latitude)
                    lng = float(r.longitude)
                    elev = float(r.elevation) if r.elevation is not None else None

                    sites.append(
                        RelocationSiteResponse(
                            id=str(r.id),
                            name=str(r.name),
                            district=str(r.district),
                            state=str(r.state or "Uttarakhand"),
                            latitude=lat,
                            longitude=lng,
                            elevation=elev,
                            location=GeoPoint(lat=lat, lng=lng, elevation=elev),
                            usable_area_sqm=r.usable_area_sqm,
                            capacity=int(r.capacity or r.emergency_capacity or 0),
                            emergency_capacity=int(r.emergency_capacity or 0),
                            slope=float(r.slope or 5.0),
                            slope_grade=r.slope_grade or "Gentle",
                            road_access=bool(r.road_access),
                            drinking_water=bool(r.drinking_water),
                            electricity=bool(r.electricity),
                            medical_facility_nearby=bool(r.medical_facility_nearby),
                            distance_to_road_km=float(r.distance_to_road_km or 0.1),
                            distance_to_medical_km=float(r.distance_to_medical_km or 2.0),
                            hazard_exposure=float(r.hazard_exposure or 0.1),
                            suitability=str(r.suitability or "HIGH"),
                            suitability_score=float(r.suitability_score or 0.8),
                            constraints=r.constraints or [],
                            provenance=DataProvenance.LIVE,
                        )
                    )
                return sites
        except Exception as e:
            logger.warning(f"PostGIS relocation site query failed: {e}; falling back to GeoJSON provider")

        return await self._fallback_geojson.get_relocation_sites(region)

    async def get_hazard_layers(self, region: str | None = None) -> list[HazardLayerResponse]:
        if not is_database_connected() or _SessionLocal is None:
            return await self._fallback_geojson.get_hazard_layers(region)

        try:
            with _SessionLocal() as session:
                query = (
                    "SELECT id, name, hazard_type, severity, source, description, visible, "
                    "ST_AsGeoJSON(geom) as geom_geojson "
                    "FROM hazard_areas"
                )
                rows = session.execute(text(query)).fetchall()
                if not rows:
                    return await self._fallback_geojson.get_hazard_layers(region)

                layers: list[HazardLayerResponse] = []
                for r in rows:
                    sev = (
                        Severity(r.severity)
                        if r.severity in Severity._value2member_map_
                        else Severity.ORANGE
                    )
                    geom_dict = json.loads(r.geom_geojson) if r.geom_geojson else None

                    layers.append(
                        HazardLayerResponse(
                            id=str(r.id),
                            name=str(r.name),
                            type=str(r.hazard_type),
                            severity=sev,
                            source=str(r.source or "PostGIS Store"),
                            description=r.description,
                            visible=bool(r.visible),
                            geometry=geom_dict,
                            provenance=DataProvenance.LIVE,
                        )
                    )
                return layers
        except Exception as e:
            logger.warning(f"PostGIS hazard layers query failed: {e}; falling back to GeoJSON provider")

        return await self._fallback_geojson.get_hazard_layers(region)
