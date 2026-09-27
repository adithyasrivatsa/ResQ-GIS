"""
River Monitoring Service.
Provides hydrological telemetry from CWC and local gauge station providers.
"""
from __future__ import annotations
from app.config import get_settings
from app.schemas import RiverStation, RiverMeasurement, DataProvenance
from app.providers.rivers.cwc_provider import CWCRiverProvider
from app.providers.rivers.mock_river_provider import MockRiverProvider
from app.services.cache_service import get_cache


class RiverService:
    def __init__(self):
        self.settings = get_settings()
        self.cwc_provider = CWCRiverProvider()
        self.mock_provider = MockRiverProvider()
        self.cache = get_cache()

    async def get_stations(self, region: str | None = None) -> list[RiverStation]:
        cache_key = f"rivers:stations:{region.lower() if region else 'all'}"

        if self.settings.is_live_mode:
            cached = self.cache.get(cache_key)
            if cached is not None:
                return cached

            live_stations = await self.cwc_provider.get_river_stations(region)
            if live_stations:
                self.cache.set(cache_key, live_stations, ttl_seconds=600.0)
                return live_stations

        return await self.mock_provider.get_river_stations(region)

    async def get_measurement(self, station_id: str) -> RiverMeasurement | None:
        if self.settings.is_live_mode:
            live = await self.cwc_provider.get_river_measurement(station_id)
            if live:
                return live

        return await self.mock_provider.get_river_measurement(station_id)


_river_service = RiverService()


def get_river_service() -> RiverService:
    return _river_service
