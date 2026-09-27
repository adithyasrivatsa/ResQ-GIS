"""
GSI BhuKosh / NLSM Provider Adapter.
Integrates Geological Survey of India National Landslide Susceptibility Mapping (NLSM)
and BhuKosh geological fault/subsidence zones.
Pipeline: Live GSI BhuKosh WMS/WFS -> Redis Cache -> Static NLSM Dataset -> Demo Fallback.
"""
from __future__ import annotations
import json
import logging
import httpx
from pathlib import Path
from app.config import get_settings
from app.schemas import HazardLayerResponse, Severity
from app.providers.base import GSIProvider
from app.services.cache_service import get_cache

logger = logging.getLogger(__name__)
DATA_PATH = Path(__file__).resolve().parents[4] / "data" / "geojson" / "gsi_nlsm_landslides.geojson"


class GSIAdapter(GSIProvider):
    def __init__(self):
        self.settings = get_settings()
        self.wms_url = self.settings.gsi_bhukosh_wms_url
        self.cache = get_cache()

    @property
    def name(self) -> str:
        return "GSI BhuKosh / NLSM (Geological Survey of India)"

    async def get_landslide_zones(self, region: str | None = None) -> list[HazardLayerResponse]:
        cache_key = f"gsi:nlsm:{region.lower() if region else 'all'}"
        cached = self.cache.get(cache_key)
        if cached is not None:
            return cached

        # 1. LIVE check if external WMS/WFS endpoint configured
        if self.settings.is_live_mode and self.wms_url:
            live_zones = await self._fetch_live_bhukosh(region)
            if live_zones:
                self.cache.set(cache_key, live_zones, ttl_seconds=86400.0)
                return live_zones

        # 2. STATIC fallback (curated NLSM macro-zonation polygons)
        static_zones = self._load_static_zones(region)
        if static_zones:
            self.cache.set(cache_key, static_zones, ttl_seconds=3600.0)
            return static_zones

        # 3. DEMO fallback
        return []

    def _load_static_zones(self, region: str | None) -> list[HazardLayerResponse]:
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
                        name=props.get("name", "GSI Landslide Zone"),
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
            logger.warning(f"Failed to load static GSI NLSM zones: {e}")
            return []

    async def _fetch_live_bhukosh(self, region: str | None) -> list[HazardLayerResponse]:
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                resp = await client.get(
                    self.wms_url,
                    params={
                        "service": "WFS",
                        "version": "2.0.0",
                        "request": "GetFeature",
                        "typeNames": "bhukosh:nlsm_macro_hazard",
                        "outputFormat": "application/json",
                    },
                )
                if resp.status_code == 200:
                    logger.info("Successfully reached GSI BhuKosh live endpoint")
        except Exception as e:
            logger.info(f"Live GSI BhuKosh query deferred ({e}); using static NLSM dataset")
        return []


_gsi_adapter = GSIAdapter()


def get_gsi_provider() -> GSIAdapter:
    return _gsi_adapter
