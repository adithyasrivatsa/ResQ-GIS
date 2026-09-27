"""
IMD (India Meteorological Department) Provider Adapter.
Fetches real-time AWS/ARG observations, rainfall anomalies,
and 5-7 day district weather warnings.
Pipeline: Live IMD API -> Redis Cache -> Static IMD Weather Dataset -> Demo Fallback.
"""
from __future__ import annotations
import json
import logging
import httpx
from datetime import datetime
from pathlib import Path
from app.config import get_settings
from app.schemas import WeatherCurrent, WeatherForecastItem, Severity, DataProvenance
from app.providers.base import WeatherProvider
from app.services.cache_service import get_cache

logger = logging.getLogger(__name__)
DATA_PATH = Path(__file__).resolve().parents[4] / "data" / "demo" / "weather.json"


class IMDAdapter(WeatherProvider):
    def __init__(self):
        self.settings = get_settings()
        self.base_url = self.settings.imd_api_base_url.rstrip("/")
        self.api_key = self.settings.imd_api_key
        self.cache = get_cache()

    @property
    def name(self) -> str:
        return "IMD (India Meteorological Department)"

    async def get_current_weather(self, location: str) -> WeatherCurrent | None:
        cache_key = f"imd:current:{location.lower()}"
        cached = self.cache.get(cache_key)
        if cached is not None:
            return cached

        # 1. LIVE check if API key configured and live mode enabled
        if self.settings.is_live_mode and self.api_key:
            live_curr = await self._fetch_live_current(location)
            if live_curr:
                self.cache.set(cache_key, live_curr, ttl_seconds=900.0)
                return live_curr

        # 2. STATIC fallback (curated meteorological dataset)
        static_curr = self._load_static_current(location)
        if static_curr:
            self.cache.set(cache_key, static_curr, ttl_seconds=600.0)
            return static_curr

        # 3. DEMO fallback
        return self._demo_current()

    async def get_forecast(self, location: str) -> list[WeatherForecastItem]:
        cache_key = f"imd:forecast:{location.lower()}"
        cached = self.cache.get(cache_key)
        if cached is not None:
            return cached

        if self.settings.is_live_mode and self.api_key:
            live_forecast = await self._fetch_live_forecast(location)
            if live_forecast:
                self.cache.set(cache_key, live_forecast, ttl_seconds=1800.0)
                return live_forecast

        static_forecast = self._load_static_forecast(location)
        if static_forecast:
            self.cache.set(cache_key, static_forecast, ttl_seconds=600.0)
            return static_forecast

        return self._demo_forecast()

    def _load_static_current(self, location: str) -> WeatherCurrent | None:
        if not DATA_PATH.exists():
            return None
        try:
            with open(DATA_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
            curr = data.get("current", {})
            warn_val = curr.get("warning")
            warn = Severity(warn_val) if warn_val in Severity._value2member_map_ else None
            return WeatherCurrent(
                temperature=float(curr.get("temperature", 18.5)),
                humidity=float(curr.get("humidity", 82.0)),
                wind_speed=float(curr.get("windSpeed", curr.get("wind_speed", 12.0))),
                rainfall_24h=float(curr.get("rainfall24h", curr.get("rainfall_24h", 24.5))),
                condition=curr.get("condition", "HEAVY_RAIN"),
                warning=warn,
            )
        except Exception as e:
            logger.warning(f"Failed to load static IMD weather: {e}")
            return None

    def _load_static_forecast(self, location: str) -> list[WeatherForecastItem]:
        if not DATA_PATH.exists():
            return []
        try:
            with open(DATA_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
            items = []
            for f in data.get("forecast", []):
                warn_val = f.get("warning")
                warn = Severity(warn_val) if warn_val in Severity._value2member_map_ else None
                items.append(
                    WeatherForecastItem(
                        date=f.get("date", datetime.utcnow().strftime("%Y-%m-%d")),
                        day_label=f.get("dayLabel", f.get("day_label", "")),
                        condition=f.get("condition", "RAIN"),
                        max_temp=float(f.get("maxTemp", f.get("max_temp", 22.0))),
                        min_temp=float(f.get("minTemp", f.get("min_temp", 13.0))),
                        rainfall=float(f.get("rainfall", 15.0)),
                        warning=warn,
                    )
                )
            return items
        except Exception:
            return []

    async def _fetch_live_current(self, location: str) -> WeatherCurrent | None:
        try:
            async with httpx.AsyncClient(timeout=6.0) as client:
                headers = {"Authorization": f"Bearer {self.api_key}", "Accept": "application/json"}
                resp = await client.get(
                    f"{self.base_url}/current_weather",
                    params={"district": location},
                    headers=headers,
                )
                if resp.status_code == 200:
                    data = resp.json()
                    return WeatherCurrent(
                        temperature=float(data.get("temp", 20.0)),
                        humidity=float(data.get("humidity", 80.0)),
                        wind_speed=float(data.get("wind_speed", 10.0)),
                        rainfall_24h=float(data.get("rainfall", 0.0)),
                        condition=data.get("condition", "CLOUDY"),
                        warning=Severity.ORANGE if float(data.get("rainfall", 0)) > 30 else None,
                    )
        except Exception as e:
            logger.info(f"Live IMD weather API unavailable: {e}; falling back to static feed")
        return None

    async def _fetch_live_forecast(self, location: str) -> list[WeatherForecastItem]:
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                headers = {"Authorization": f"Bearer {self.api_key}", "Accept": "application/json"}
                resp = await client.get(
                    f"{self.base_url}/districtWiseWarning",
                    params={"district": location},
                    headers=headers,
                )
                if resp.status_code == 200:
                    data = resp.json()
                    items = []
                    for f in data.get("forecast", []):
                        items.append(
                            WeatherForecastItem(
                                date=f.get("date", datetime.utcnow().strftime("%Y-%m-%d")),
                                day_label=f.get("day", ""),
                                condition=f.get("condition", "RAIN"),
                                max_temp=float(f.get("max_temp", 22.0)),
                                min_temp=float(f.get("min_temp", 14.0)),
                                rainfall=float(f.get("rainfall", 10.0)),
                                warning=Severity(f.get("warning")) if f.get("warning") in Severity._value2member_map_ else None,
                            )
                        )
                    return items
        except Exception:
            pass
        return []

    def _demo_current(self) -> WeatherCurrent:
        return WeatherCurrent(
            temperature=17.5,
            humidity=85.0,
            wind_speed=14.0,
            rainfall_24h=28.0,
            condition="HEAVY_RAIN",
            warning=Severity.ORANGE,
        )

    def _demo_forecast(self) -> list[WeatherForecastItem]:
        return [
            WeatherForecastItem(
                date=datetime.utcnow().strftime("%Y-%m-%d"),
                day_label="Today",
                condition="RAIN",
                max_temp=20.0,
                min_temp=12.0,
                rainfall=25.0,
                warning=Severity.ORANGE,
            )
        ]


_imd_adapter = IMDAdapter()


def get_imd_provider() -> IMDAdapter:
    return _imd_adapter
