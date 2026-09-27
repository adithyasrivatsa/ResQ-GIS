"""
Administrative Hierarchy Domain Service.
Integrates Local Government Directory (LGD) and Census definitions.
Supports: Region -> State -> District -> Block -> Village / Habitation.
Facilitates seamless regional expansion across Indian disaster zones.
"""
from __future__ import annotations
from app.config import get_settings
from app.schemas import AdministrativeHierarchyResponse, AdministrativeHierarchyNode
from app.providers.lgd.lgd_adapter import get_lgd_provider
from app.services.cache_service import get_cache


class AdminHierarchyService:
    def __init__(self):
        self.settings = get_settings()
        self.lgd_provider = get_lgd_provider()
        self.cache = get_cache()

    async def get_hierarchy(self, region: str | None = None) -> AdministrativeHierarchyResponse:
        cache_key = f"svc:admin:hierarchy:{region.lower() if region else 'all'}"
        cached = self.cache.get(cache_key)
        if cached is not None:
            return cached

        resp = await self.lgd_provider.get_administrative_hierarchy(region)
        self.cache.set(cache_key, resp, ttl_seconds=86400.0)
        return resp

    async def get_districts(self, state: str = "Uttarakhand") -> list[str]:
        hier = await self.get_hierarchy()
        districts = {n.district for n in hier.hierarchy if n.state.lower() == state.lower()}
        return sorted(list(districts))

    async def get_blocks(self, district: str) -> list[str]:
        hier = await self.get_hierarchy()
        blocks = {n.block for n in hier.hierarchy if n.district.lower() == district.lower()}
        return sorted(list(blocks))


_admin_service = AdminHierarchyService()


def get_admin_service() -> AdminHierarchyService:
    return _admin_service
