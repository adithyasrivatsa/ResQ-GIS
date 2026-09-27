"""
CWC (Central Water Commission) Data Ingestion.

Uses official API/feed where available.
Falls back to controlled parser for published bulletins.
NEVER build the system around HTML scraping.
"""
from __future__ import annotations
import httpx
import logging
from datetime import datetime
from typing import Optional
from app.config import get_settings
from app.schemas import CWCRiverObservation

logger = logging.getLogger(__name__)


class CWCClient:
    """Client for CWC river observation data."""

    def __init__(self):
        settings = get_settings()
        self.base_url = settings.cwc_api_base_url
        self._client = httpx.AsyncClient(timeout=30.0)

    async def close(self):
        await self._client.aclose()

    async def fetch_observations(self, basin: str = "Ganga") -> list[CWCRiverObservation]:
        """Fetch river observations for a basin. Returns empty list if API not configured."""
        if not self.base_url:
            logger.info("CWC API not configured, returning empty observations")
            return []

        try:
            resp = await self._client.get(f"{self.base_url}/observations", params={"basin": basin})
            resp.raise_for_status()
            data = resp.json()
            return self._parse_observations(data)
        except httpx.HTTPError as e:
            logger.error(f"CWC API error: {e}")
            return []

    def _parse_observations(self, raw_data: dict | list) -> list[CWCRiverObservation]:
        """Parse CWC observation data into normalized schema."""
        observations = []
        items = raw_data if isinstance(raw_data, list) else raw_data.get("data", [])

        for item in items:
            try:
                observations.append(CWCRiverObservation(
                    river=item.get("river_name", "Unknown"),
                    station=item.get("station_name", "Unknown"),
                    water_level=float(item.get("water_level", 0)),
                    warning_level=float(item.get("warning_level", 0)),
                    danger_level=float(item.get("danger_level", 0)),
                    observed_at=_parse_datetime(item.get("observed_at")),
                    geometry=item.get("geometry"),
                ))
            except Exception as e:
                logger.warning(f"Failed to parse CWC observation: {e}")
                continue

        return observations


def _parse_datetime(val: str | None) -> datetime:
    if not val:
        return datetime.utcnow()
    try:
        return datetime.fromisoformat(val.replace("Z", "+00:00"))
    except (ValueError, AttributeError):
        return datetime.utcnow()


# Module-level singleton
_client: Optional[CWCClient] = None


def get_cwc_client() -> CWCClient:
    global _client
    if _client is None:
        _client = CWCClient()
    return _client
