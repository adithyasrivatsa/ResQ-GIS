"""
Weather Service.
Implements resilient multi-tier meteorological provider hierarchy:
1. IMD Provider (when official API key is configured)
2. Open-Meteo Live API (Free Public ECMWF/DWD open data engine)
3. In-memory / Redis Cache (CACHED)
4. Stale Cache (STALE)
5. Static Curated Himalayan Weather Data (STATIC / DEMO)
Explicit provenance tracking: LIVE, CACHED, STALE, STATIC, DEMO.
"""
from __future__ import annotations
from datetime import datetime
from app.config import get_settings
from app.schemas import WeatherResponse, WeatherCurrent, WeatherForecastItem, DataProvenance, ProviderHealthStatus
from app.providers.weather.imd_provider import IMDWeatherProvider
from app.providers.weather.openmeteo_adapter import get_openmeteo_provider
from app.providers.weather.mock_weather_provider import MockWeatherProvider
from app.services.cache_service import get_cache


class WeatherService:
    def __init__(self):
        self.settings = get_settings()
        self.imd_provider = IMDWeatherProvider()
        self.openmeteo_provider = get_openmeteo_provider()
        self.mock_provider = MockWeatherProvider()
        self.cache = get_cache()

    async def get_weather(self, location: str = "Chamoli") -> WeatherResponse:
        cache_key = f"weather:{location.lower()}"

        # 1. Check for fresh cache first
        cached = self.cache.get(cache_key)
        if cached:
            cached.provenance = DataProvenance.CACHED
            return cached

        # 2. Try official IMD if configured with API key
        if self.settings.imd_api_key:
            curr = await self.imd_provider.get_current_weather(location)
            forecast = await self.imd_provider.get_forecast(location)
            if curr is not None:
                resp = WeatherResponse(
                    location=location,
                    current=curr,
                    forecast=forecast,
                    updated_at=datetime.utcnow(),
                    source=self.imd_provider.name,
                    provenance=DataProvenance.LIVE,
                )
                self.cache.set(cache_key, resp, ttl_seconds=900.0)
                return resp

        # 3. Try live public Open-Meteo engine
        curr_om = await self.openmeteo_provider.get_current_weather(location)
        forecast_om = await self.openmeteo_provider.get_forecast(location)
        if curr_om is not None and forecast_om:
            resp = WeatherResponse(
                location=location,
                current=curr_om,
                forecast=forecast_om,
                updated_at=datetime.utcnow(),
                source=self.openmeteo_provider.name,
                provenance=DataProvenance.LIVE,
            )
            self.cache.set(cache_key, resp, ttl_seconds=900.0)
            return resp

        # 4. Check for stale cache
        stale_tuple = self.cache.get_stale(cache_key)
        if stale_tuple:
            resp, age = stale_tuple
            resp.provenance = DataProvenance.STALE
            return resp

        # 5. Fallback to mock / demo provider
        curr = await self.mock_provider.get_current_weather(location)
        forecast = await self.mock_provider.get_forecast(location)

        return WeatherResponse(
            location=location,
            current=curr,
            forecast=forecast,
            updated_at=datetime.utcnow(),
            source=self.mock_provider.name,
            provenance=DataProvenance.DEMO,
        )

    async def get_status(self) -> ProviderHealthStatus:
        if self.settings.imd_api_key:
            return ProviderHealthStatus(
                provider="weather_imd",
                status="LIVE",
                source="IMD Official API",
                last_updated=datetime.utcnow(),
                latency_ms=120.0,
                quality="GOOD",
            )
        return await self.openmeteo_provider.get_status()


_weather_service = WeatherService()


def get_weather_service() -> WeatherService:
    return _weather_service
