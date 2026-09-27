"""
Emergency Infrastructure Service.
Manages India Disaster Resource Network (IDRN) and District Emergency Operations Center (DEOC)
resources: shelters, relief camps, field hospitals, helipads, and heavy machinery.
Correlates candidate relocation sites with prepositioned emergency infrastructure.
"""
from __future__ import annotations
from app.config import get_settings
from app.schemas import EmergencyResource
from app.providers.idrn.idrn_adapter import get_idrn_provider
from app.services.cache_service import get_cache


class EmergencyService:
    def __init__(self):
        self.settings = get_settings()
        self.idrn_provider = get_idrn_provider()
        self.cache = get_cache()

    async def get_resources(
        self,
        district: str | None = None,
        resource_type: str | None = None,
    ) -> list[EmergencyResource]:
        cache_key = f"svc:emergency:{district.lower() if district else 'all'}:{resource_type.lower() if resource_type else 'all'}"
        cached = self.cache.get(cache_key)
        if cached is not None:
            return cached

        resources = await self.idrn_provider.get_emergency_resources(district, resource_type)
        self.cache.set(cache_key, resources, ttl_seconds=600.0)
        return resources

    async def get_resource_by_id(self, resource_id: str) -> EmergencyResource | None:
        all_res = await self.get_resources()
        return next((r for r in all_res if r.id == resource_id), None)


_emergency_service = EmergencyService()


def get_emergency_service() -> EmergencyService:
    return _emergency_service
