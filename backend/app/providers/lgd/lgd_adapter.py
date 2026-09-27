"""
LGD (Local Government Directory) + Census Provider Adapter.
Provides multi-tiered administrative boundaries and demographic context:
Region -> State -> District -> Block -> Village / Habitation.
Allows seamless expansion from Uttarakhand to HP, Sikkim, Kerala, Assam, Odisha.
Pipeline: Live LGD API -> Redis Cache -> Static LGD & Census Dataset -> Demo Fallback.
"""
from __future__ import annotations
import json
import logging
import httpx
from pathlib import Path
from app.config import get_settings
from app.schemas import AdministrativeHierarchyResponse, AdministrativeHierarchyNode
from app.providers.base import LGDProvider
from app.services.cache_service import get_cache

logger = logging.getLogger(__name__)
DATA_PATH = Path(__file__).resolve().parents[4] / "data" / "geojson" / "lgd_census_hierarchy.json"


class LGDAdapter(LGDProvider):
    def __init__(self):
        self.settings = get_settings()
        self.api_url = self.settings.lgd_api_base_url
        self.cache = get_cache()

    @property
    def name(self) -> str:
        return "LGD + Census of India (Ministry of Panchayati Raj / RGI)"

    async def get_administrative_hierarchy(self, region: str | None = None) -> AdministrativeHierarchyResponse:
        cache_key = f"lgd:hierarchy:{region.lower() if region else 'all'}"
        cached = self.cache.get(cache_key)
        if cached is not None:
            return cached

        # 1. LIVE check if external LGD API configured
        if self.settings.is_live_mode and self.api_url:
            live_hier = await self._fetch_live_lgd(region)
            if live_hier:
                self.cache.set(cache_key, live_hier, ttl_seconds=86400.0)
                return live_hier

        # 2. STATIC fallback (high-fidelity multi-state hierarchy)
        static_hier = self._load_static_hierarchy(region)
        if static_hier:
            self.cache.set(cache_key, static_hier, ttl_seconds=3600.0)
            return static_hier

        # 3. DEMO fallback
        return self._demo_hierarchy()

    def _load_static_hierarchy(self, region_filter: str | None) -> AdministrativeHierarchyResponse | None:
        if not DATA_PATH.exists():
            return None
        try:
            with open(DATA_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)

            regions = data.get("regions", [])
            states = data.get("states", [])
            raw_nodes = data.get("nodes", [])

            nodes: list[AdministrativeHierarchyNode] = []
            for n in raw_nodes:
                if region_filter and region_filter.lower() not in n.get("region", "").lower() and region_filter.lower() not in n.get("district", "").lower():
                    continue
                nodes.append(
                    AdministrativeHierarchyNode(
                        region=n.get("region", "Western Himalayas"),
                        state=n.get("state", "Uttarakhand"),
                        district=n.get("district", "Chamoli"),
                        block=n.get("block", "Joshimath"),
                        villages=n.get("villages", []),
                        lgd_code=n.get("lgd_code"),
                    )
                )

            return AdministrativeHierarchyResponse(
                regions=regions,
                states=states,
                hierarchy=nodes,
            )
        except Exception as e:
            logger.warning(f"Failed to load static LGD hierarchy: {e}")
            return None

    async def _fetch_live_lgd(self, region: str | None) -> AdministrativeHierarchyResponse | None:
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                resp = await client.get(f"{self.api_url}/hierarchy", params={"region": region})
                if resp.status_code == 200:
                    raw = resp.json()
                    nodes = [AdministrativeHierarchyNode(**item) for item in raw.get("hierarchy", [])]
                    return AdministrativeHierarchyResponse(
                        regions=raw.get("regions", []),
                        states=raw.get("states", []),
                        hierarchy=nodes,
                    )
        except Exception as e:
            logger.info(f"Live LGD API connection deferred ({e}); using static census structure")
        return None

    def _demo_hierarchy(self) -> AdministrativeHierarchyResponse:
        return AdministrativeHierarchyResponse(
            regions=["Western Himalayas"],
            states=["Uttarakhand"],
            hierarchy=[
                AdministrativeHierarchyNode(
                    region="Western Himalayas",
                    state="Uttarakhand",
                    district="Chamoli",
                    block="Joshimath",
                    villages=["Joshimath Town", "Reni", "Helang", "Tapovan"],
                    lgd_code="0478",
                )
            ],
        )


_lgd_adapter = LGDAdapter()


def get_lgd_provider() -> LGDAdapter:
    return _lgd_adapter
