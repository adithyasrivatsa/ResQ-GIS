"""
IMD (India Meteorological Department) Data Ingestion.

Uses official IMD API (https://api.imd.gov.in/api/v1/).
NEVER scrape the IMD website.
"""
from __future__ import annotations
import httpx
import logging
from datetime import datetime
from typing import Optional
from app.config import get_settings
from app.schemas import IMDDistrictWarning, Severity

logger = logging.getLogger(__name__)

# IMD API endpoints (from official docs)
ENDPOINTS = {
    "city_forecast": "/cityforecast",
    "city_forecast_mapping": "/cityforecast_mapping",
    "current_weather": "/current_weather",
    "district_nowcast": "/nowcast",
    "district_warnings": "/districtWiseWarning",
    "district_rainfall": "/districtRainfall",
    "state_rainfall": "/stateRainfall",
    "aws_arg": "/aws_arg",
    "river_basin_qpf": "/riverBasinQPF",
}


class IMDClient:
    """Client for IMD official API."""

    def __init__(self):
        settings = get_settings()
        self.base_url = settings.imd_api_base_url
        self.api_key = settings.imd_api_key
        self._client = httpx.AsyncClient(
            base_url=self.base_url,
            timeout=30.0,
            headers={"Accept": "application/json"},
        )

    async def close(self):
        await self._client.aclose()

    async def _get(self, endpoint: str, params: dict | None = None) -> dict | list | None:
        """Make authenticated GET request to IMD API."""
        try:
            resp = await self._client.get(endpoint, params=params)
            resp.raise_for_status()
            return resp.json()
        except httpx.HTTPError as e:
            logger.error(f"IMD API error for {endpoint}: {e}")
            return None

    async def get_city_forecast(self, city_id: str) -> dict | None:
        """Get 7-day forecast for a city by station code."""
        return await self._get(ENDPOINTS["city_forecast"], params={"id": city_id})

    async def get_city_forecast_mapping(self) -> list | None:
        """Get mapping of city names to station codes."""
        return await self._get(ENDPOINTS["city_forecast_mapping"])

    async def get_district_warnings(self, state: str = "Uttarakhand") -> list[IMDDistrictWarning]:
        """Get district-wise warnings for a state."""
        data = await self._get(ENDPOINTS["district_warnings"])
        if not data:
            return []
        return self._parse_district_warnings(data, state)

    async def get_district_rainfall(self) -> dict | None:
        """Get district-wise rainfall data."""
        return await self._get(ENDPOINTS["district_rainfall"])

    async def get_aws_arg_data(self) -> dict | None:
        """Get AWS/ARG station data."""
        return await self._get(ENDPOINTS["aws_arg"])

    async def get_river_basin_qpf(self) -> dict | None:
        """Get river basin quantitative precipitation forecast."""
        return await self._get(ENDPOINTS["river_basin_qpf"])

    def _parse_district_warnings(self, raw_data: dict | list, state_filter: str) -> list[IMDDistrictWarning]:
        """Normalize IMD warning data into internal schema."""
        warnings = []
        # IMD API response format varies — this handles the common structures
        items = raw_data if isinstance(raw_data, list) else raw_data.get("data", [])

        for item in items:
            try:
                state = item.get("state", "")
                if state_filter and state_filter.lower() not in state.lower():
                    continue

                severity_str = (item.get("warning_color") or item.get("color") or "green").lower()
                severity_map = {"red": Severity.RED, "orange": Severity.ORANGE,
                                "yellow": Severity.YELLOW, "green": Severity.GREEN}
                severity = severity_map.get(severity_str, Severity.GREEN)

                warnings.append(IMDDistrictWarning(
                    location=item.get("district", "Unknown"),
                    severity=severity,
                    issued_at=datetime.utcnow(),
                    raw_data=item,
                ))
            except Exception as e:
                logger.warning(f"Failed to parse IMD warning item: {e}")
                continue

        return warnings


# Module-level singleton
_client: Optional[IMDClient] = None


def get_imd_client() -> IMDClient:
    global _client
    if _client is None:
        _client = IMDClient()
    return _client
