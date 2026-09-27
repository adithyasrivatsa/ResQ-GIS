"""
Terrain Analysis Domain Service.
Powered by Copernicus 30m Global DEM (GLO-30).
Performs elevation queries, slope gradient computation, and safe relocation terrain validation.
"""
from __future__ import annotations
from app.config import get_settings
from app.schemas import TerrainElevationPoint, SlopeAnalysisResponse, GeoPoint
from app.providers.copernicus.copernicus_adapter import get_copernicus_provider
from app.services.cache_service import get_cache


class TerrainService:
    def __init__(self):
        self.settings = get_settings()
        self.copernicus_provider = get_copernicus_provider()
        self.cache = get_cache()

    async def get_elevation(self, lat: float, lng: float) -> float:
        return await self.copernicus_provider.get_elevation(lat, lng)

    async def get_slope(self, lat: float, lng: float) -> TerrainElevationPoint:
        return await self.copernicus_provider.get_slope(lat, lng)

    async def analyze_slope(self, points: list[GeoPoint]) -> SlopeAnalysisResponse:
        return await self.copernicus_provider.analyze_slope_profile(points)


_terrain_service = TerrainService()


def get_terrain_service() -> TerrainService:
    return _terrain_service
