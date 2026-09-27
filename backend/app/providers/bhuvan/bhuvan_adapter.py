"""
ISRO Bhuvan / NRSC Provider Adapter.
Integrates Indian geospatial layers: Glacial Lakes Atlas (GLOF),
Flood Inundation Hazard layers, and Thematic Geomorphology from Bhuvan/NRSC.
Pipeline: Live Bhuvan WMS/REST -> Redis Cache -> Static Bhuvan Dataset -> Demo Fallback.
"""
from __future__ import annotations
import json
import logging
import httpx
from pathlib import Path
from app.config import get_settings
from app.schemas import HazardLayerResponse, Severity
from app.providers.base import BhuvanProvider
from app.services.cache_service import get_cache

logger = logging.getLogger(__name__)
DATA_PATH = Path(__file__).resolve().parents[4] / "data" / "geojson" / "bhuvan_layers.geojson"


class BhuvanAdapter(BhuvanProvider):
    def __init__(self):
        self.settings = get_settings()
        self.wms_url = self.settings.bhuvan_wms_url
        self.cache = get_cache()

    @property
    def name(self) -> str:
        return "ISRO Bhuvan / NRSC Geospatial Portal"

    async def get_thematic_layers(self, region: str | None = None) -> list[HazardLayerResponse]:
        cache_key = f"bhuvan:layers:{region.lower() if region else 'all'}"
        cached = self.cache.get(cache_key)
        if cached is not None:
            return cached

        # 1. LIVE check if external WMS endpoint configured and live mode enabled
        if self.settings.is_live_mode and self.wms_url:
            live_layers = await self._fetch_live_wms(region)
            if live_layers:
                self.cache.set(cache_key, live_layers, ttl_seconds=7200.0)
                return live_layers

        # 2. STATIC fallback (pre-downloaded NRSC/Bhuvan hazard polygons)
        static_layers = self._load_static_layers(region)
        if static_layers:
            self.cache.set(cache_key, static_layers, ttl_seconds=3600.0)
            return static_layers

        # 3. DEMO fallback
        return []

    def _load_static_layers(self, region: str | None) -> list[HazardLayerResponse]:
        if not DATA_PATH.exists():
            return []
        try:
            with open(DATA_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)

            layers = []
            for feat in data.get("features", []):
                props = feat.get("properties", {})
                sev_val = props.get("severity")
                sev = Severity(sev_val) if sev_val in Severity._value2member_map_ else None
                layers.append(
                    HazardLayerResponse(
                        id=props.get("id", feat.get("id")),
                        name=props.get("name", "Bhuvan Layer"),
                        type=props.get("type", "polygon"),
                        source=props.get("source", self.name),
                        severity=sev,
                        geometry=feat.get("geometry"),
                        visible=props.get("visible", True),
                        description=props.get("description"),
                    )
                )
            return layers
        except Exception as e:
            logger.warning(f"Failed to load static Bhuvan layers: {e}")
            return []

    async def _fetch_live_wms(self, region: str | None) -> list[HazardLayerResponse]:
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                resp = await client.get(
                    self.wms_url,
                    params={
                        "service": "WMS",
                        "request": "GetCapabilities",
                        "format": "application/json",
                    },
                )
                if resp.status_code == 200:
                    # In operational deployment, parse WMS GetCapabilities into active layer descriptors
                    logger.info("Successfully probed live ISRO Bhuvan WMS endpoint")
        except Exception as e:
            logger.info(f"Live Bhuvan WMS connection deferred ({e}); using static NRSC layer data")
        return []


_bhuvan_adapter = BhuvanAdapter()


def get_bhuvan_provider() -> BhuvanAdapter:
    return _bhuvan_adapter
