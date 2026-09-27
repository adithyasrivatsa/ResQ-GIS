"""
Mock Weather Provider.
Loads realistic Himalayan meteorological demo data when live IMD API is unconfigured.
"""
from __future__ import annotations
import json
from pathlib import Path
from datetime import datetime
from app.schemas import WeatherCurrent, WeatherForecastItem, Severity
from app.providers.base import WeatherProvider

DATA_PATH = Path(__file__).resolve().parents[4] / "data" / "demo" / "weather.json"


class MockWeatherProvider(WeatherProvider):
    @property
    def name(self) -> str:
        return "Mock Weather Provider (Demo Mode)"

    def _load_data(self) -> dict:
        if DATA_PATH.exists():
            try:
                with open(DATA_PATH, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                pass
        return {}

    async def get_current_weather(self, location: str) -> WeatherCurrent:
        data = self._load_data()
        districts = data.get("districts", {})
        # Case-insensitive match or fallback to Chamoli
        matched_key = next((k for k in districts if k.lower() == location.lower()), "Chamoli")
        dist_data = districts.get(matched_key, districts.get("Chamoli", {}))
        curr = dist_data.get("current", {})

        return WeatherCurrent(
            temperature=curr.get("temperature", 18.5),
            humidity=curr.get("humidity", 88.0),
            wind_speed=curr.get("windSpeed", 14.2),
            rainfall_24h=curr.get("rainfall24h", 46.5),
            condition=curr.get("condition", "HEAVY_RAIN"),
            warning=Severity.ORANGE if curr.get("warning") == "orange" else Severity.YELLOW,
        )

    async def get_forecast(self, location: str) -> list[WeatherForecastItem]:
        data = self._load_data()
        districts = data.get("districts", {})
        matched_key = next((k for k in districts if k.lower() == location.lower()), "Chamoli")
        dist_data = districts.get(matched_key, districts.get("Chamoli", {}))
        forecast_items = dist_data.get("forecast", [])

        results = []
        for f in forecast_items:
            results.append(
                WeatherForecastItem(
                    date=f.get("date", datetime.utcnow().strftime("%Y-%m-%d")),
                    day_label=f.get("dayLabel", ""),
                    condition=f.get("condition", "RAIN"),
                    max_temp=float(f.get("maxTemp", 21)),
                    min_temp=float(f.get("minTemp", 13)),
                    rainfall=float(f.get("rainfall", 40.0)),
                    warning=Severity(f.get("warning")) if f.get("warning") in Severity._value2member_map_ else None,
                )
            )
        return results
