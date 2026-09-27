"""
GIS Service.
Manages spatial habitations, relocation safe havens, and hazard overlays.
Integrates PostGIS and GeoJSON providers with caching.
"""
from __future__ import annotations
from app.config import get_settings
from app.schemas import HabitationResponse, RelocationSiteResponse, HazardLayerResponse, OSMRoadFeature
from app.providers.gis.postgis_provider import PostGISProvider
from app.providers.gis.geojson_provider import GeoJSONGISProvider
from app.providers.osm.osm_adapter import get_osm_provider
from app.services.cache_service import get_cache


class GISService:
    def __init__(self):
        self.settings = get_settings()
        self.postgis_provider = PostGISProvider()
        self.geojson_provider = GeoJSONGISProvider()
        self.osm_provider = get_osm_provider()
        self.cache = get_cache()

    async def get_habitations(
        self,
        region: str | None = None,
        district: str | None = None,
        block: str | None = None,
    ) -> list[HabitationResponse]:
        cache_key = f"gis:habitations:{region.lower() if region else 'all'}:{district.lower() if district else 'all'}:{block.lower() if block else 'all'}"
        cached = self.cache.get(cache_key)
        if cached is not None:
            return cached

        # Use PostGIS provider (auto-falls back to GeoJSON)
        items = await self.postgis_provider.get_habitations(district or region)

        # Apply secondary block/district filters if specified
        if district:
            items = [h for h in items if h.district.lower() == district.lower()]
        if block:
            items = [h for h in items if (h.block and h.block.lower() == block.lower())]

        self.cache.set(cache_key, items, ttl_seconds=300.0)
        return items

    async def get_habitation_by_id(self, habitation_id: str) -> HabitationResponse | None:
        habs = await self.get_habitations()
        return next((h for h in habs if h.id == habitation_id), None)

    async def get_relocation_sites(
        self,
        region: str | None = None,
        district: str | None = None,
        block: str | None = None,
    ) -> list[RelocationSiteResponse]:
        cache_key = f"gis:sites:{region.lower() if region else 'all'}:{district.lower() if district else 'all'}:{block.lower() if block else 'all'}"
        cached = self.cache.get(cache_key)
        if cached is not None:
            return cached

        items = await self.postgis_provider.get_relocation_sites(district or region)
        if district:
            items = [s for s in items if s.district.lower() == district.lower()]
        if block:
            items = [s for s in items if (s.block and s.block.lower() == block.lower())]

        self.cache.set(cache_key, items, ttl_seconds=300.0)
        return items

    async def get_relocation_site_by_id(self, site_id: str) -> RelocationSiteResponse | None:
        sites = await self.get_relocation_sites()
        return next((s for s in sites if s.id == site_id), None)

    async def get_hazard_layers(self, region: str | None = None) -> list[HazardLayerResponse]:
        cache_key = f"gis:hazards:{region.lower() if region else 'all'}"
        cached = self.cache.get(cache_key)
        if cached is not None:
            return cached

        items = await self.postgis_provider.get_hazard_layers(region)
        self.cache.set(cache_key, items, ttl_seconds=300.0)
        return items

    async def get_roads(self, region: str | None = None) -> list[OSMRoadFeature]:
        cache_key = f"gis:roads:{region.lower() if region else 'all'}"
        cached = self.cache.get(cache_key)
        if cached is not None:
            return cached

        roads = await self.osm_provider.get_road_network(region)
        self.cache.set(cache_key, roads, ttl_seconds=600.0)
        return roads


_gis_service = GISService()


def get_gis_service() -> GISService:
    return _gis_service

