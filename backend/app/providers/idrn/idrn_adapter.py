"""
IDRN (India Disaster Resource Network) & DEOC Provider Adapter.
Integrates emergency response resources, shelters, equipment depots,
helipads, and field hospitals from IDRN and DEOC/DDMAP inventories.
Pipeline: Live IDRN API -> Redis Cache -> Static IDRN GeoJSON Dataset -> Demo Fallback.
"""
from __future__ import annotations
import math
import json
import logging
import httpx
from pathlib import Path
from app.config import get_settings
from app.schemas import EmergencyResource, EmergencyResourceType, GeoPoint, DataProvenance
from app.providers.base import IDRNProvider
from app.services.cache_service import get_cache

logger = logging.getLogger(__name__)
DATA_PATH = Path(__file__).resolve().parents[4] / "data" / "geojson" / "idrn_resources.geojson"


class IDRNAdapter(IDRNProvider):
    def __init__(self):
        self.settings = get_settings()
        self.api_url = self.settings.idrn_api_base_url
        self.cache = get_cache()

    @property
    def name(self) -> str:
        return "IDRN / DEOC (India Disaster Resource Network & District EOC)"

    async def get_emergency_resources(
        self,
        district: str | None = None,
        resource_type: str | None = None,
    ) -> list[EmergencyResource]:
        cache_key = f"idrn:resources:{district.lower() if district else 'all'}:{resource_type.lower() if resource_type else 'all'}"
        cached = self.cache.get(cache_key)
        if cached is not None:
            return cached

        # 1. LIVE check if external IDRN API configured
        if self.settings.is_live_mode and self.api_url:
            live_res = await self._fetch_live_idrn(district, resource_type)
            if live_res:
                self.cache.set(cache_key, live_res, ttl_seconds=3600.0)
                return live_res

        # 2. STATIC fallback (curated emergency inventory)
        static_res = self._load_static_resources(district, resource_type)
        if static_res:
            self.cache.set(cache_key, static_res, ttl_seconds=1800.0)
            return static_res

        # 3. DEMO fallback
        return self._demo_resources()

    def _load_static_resources(
        self,
        district: str | None,
        resource_type: str | None,
    ) -> list[EmergencyResource]:
        if not DATA_PATH.exists():
            return []
        try:
            with open(DATA_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)

            resources = []
            for feat in data.get("features", []):
                props = feat.get("properties", {})
                dist = props.get("district", "Chamoli")
                if district and district.lower() not in dist.lower():
                    continue

                rtype_str = props.get("resource_type", "shelter")
                if resource_type and resource_type.lower() != rtype_str.lower():
                    continue

                lat = props.get("latitude", 0.0)
                lng = props.get("longitude", 0.0)
                elev = props.get("elevation", 1200.0)

                resources.append(
                    EmergencyResource(
                        id=props.get("id", feat.get("id")),
                        name=props.get("name", "Emergency Resource"),
                        resource_type=EmergencyResourceType(rtype_str),
                        district=dist,
                        state=props.get("state", "Uttarakhand"),
                        region=props.get("region", "Western Himalayas"),
                        block=props.get("block"),
                        latitude=lat,
                        longitude=lng,
                        elevation=elev,
                        location=GeoPoint(lat=lat, lng=lng, elevation=elev),
                        capacity=int(props.get("capacity", 0)),
                        equipment=props.get("equipment", []),
                        contact_person=props.get("contact_person"),
                        contact_phone=props.get("contact_phone"),
                        status=props.get("status", "operational"),
                        geometry=feat.get("geometry"),
                        provenance=DataProvenance.STATIC,
                    )
                )
            return resources
        except Exception as e:
            logger.warning(f"Failed to load static IDRN resources: {e}")
            return []

    async def _fetch_live_idrn(self, district: str | None, resource_type: str | None) -> list[EmergencyResource]:
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                params = {}
                if district:
                    params["district"] = district
                if resource_type:
                    params["type"] = resource_type
                resp = await client.get(f"{self.api_url}/resources", params=params)
                if resp.status_code == 200:
                    raw = resp.json()
                    items = raw if isinstance(raw, list) else raw.get("resources", [])
                    results = []
                    for r in items:
                        lat = float(r.get("latitude", 0))
                        lng = float(r.get("longitude", 0))
                        elev = float(r.get("elevation", 0))
                        results.append(
                            EmergencyResource(
                                id=str(r.get("id")),
                                name=r.get("name", "Emergency Resource"),
                                resource_type=EmergencyResourceType(r.get("type", "shelter")),
                                district=r.get("district", "Chamoli"),
                                latitude=lat,
                                longitude=lng,
                                elevation=elev,
                                location=GeoPoint(lat=lat, lng=lng, elevation=elev),
                                capacity=int(r.get("capacity", 0)),
                                equipment=r.get("equipment", []),
                                status=r.get("status", "operational"),
                                provenance=DataProvenance.LIVE,
                            )
                        )
                    return results
        except Exception as e:
            logger.info(f"Live IDRN API query deferred: {e}; using static DEOC emergency resources")
        return []

    def _demo_resources(self) -> list[EmergencyResource]:
        return [
            EmergencyResource(
                id="idrn-demo-shelter",
                name="Pipalkoti Safe Haven Shelter",
                resource_type=EmergencyResourceType.SHELTER,
                district="Chamoli",
                block="Dasholi",
                latitude=30.430,
                longitude=79.430,
                elevation=1260.0,
                location=GeoPoint(lat=30.430, lng=79.430, elevation=1260.0),
                capacity=3000,
                equipment=["RO Unit", "Generators", "Field Hospital"],
                status="operational",
                provenance=DataProvenance.DEMO,
            )
        ]


_idrn_adapter = IDRNAdapter()


def get_idrn_provider() -> IDRNAdapter:
    return _idrn_adapter
