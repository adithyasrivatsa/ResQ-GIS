"""
NDMA / SACHET CAP Alert Ingestion.

Uses SACHET's official CAP/RSS feed.
NEVER scrape the NDMA dashboard.
"""
from __future__ import annotations
import httpx
import logging
import hashlib
from datetime import datetime
from typing import Optional
from app.config import get_settings
from app.schemas import NDMAAlert, Severity

logger = logging.getLogger(__name__)

# Deduplication cache (in-memory for prototype)
_seen_alerts: set[str] = set()


class NDMAClient:
    """Client for NDMA/SACHET CAP alert feeds."""

    def __init__(self):
        settings = get_settings()
        self.cap_url = settings.ndma_cap_feed_url
        self._client = httpx.AsyncClient(timeout=30.0)

    async def close(self):
        await self._client.aclose()

    async def fetch_alerts(self) -> list[NDMAAlert]:
        """Fetch and parse CAP alerts from SACHET."""
        try:
            resp = await self._client.get(self.cap_url)
            resp.raise_for_status()
            data = resp.json()
            return self._parse_alerts(data)
        except httpx.HTTPError as e:
            logger.error(f"NDMA CAP feed error: {e}")
            return []
        except Exception as e:
            logger.error(f"NDMA parsing error: {e}")
            return []

    def _parse_alerts(self, raw_data: dict | list) -> list[NDMAAlert]:
        """Parse CAP alert data into normalized schema with deduplication."""
        alerts = []
        items = raw_data if isinstance(raw_data, list) else raw_data.get("alerts", raw_data.get("data", []))

        for item in items:
            try:
                # Create dedup key
                dedup_key = hashlib.md5(
                    f"{item.get('identifier', '')}{item.get('sent', '')}".encode()
                ).hexdigest()

                if dedup_key in _seen_alerts:
                    continue
                _seen_alerts.add(dedup_key)

                # Map severity
                severity_str = (item.get("severity") or item.get("color") or "minor").lower()
                severity_map = {
                    "extreme": Severity.RED, "severe": Severity.RED,
                    "moderate": Severity.ORANGE,
                    "minor": Severity.YELLOW,
                    "unknown": Severity.GREEN,
                }
                severity = severity_map.get(severity_str, Severity.YELLOW)

                # Extract area
                area_desc = item.get("areaDesc") or item.get("area", "Unknown")
                if isinstance(area_desc, list):
                    area_desc = ", ".join(area_desc)

                alerts.append(NDMAAlert(
                    event_type=item.get("event") or item.get("event_type", "Alert"),
                    severity=severity,
                    area=area_desc,
                    issued_at=_parse_datetime(item.get("sent") or item.get("issued_at")),
                    expires_at=_parse_datetime(item.get("expires")),
                    description=item.get("description") or item.get("headline", ""),
                    geometry=item.get("geometry"),
                ))
            except Exception as e:
                logger.warning(f"Failed to parse NDMA alert: {e}")
                continue

        return alerts


def _parse_datetime(val: str | None) -> datetime:
    """Best-effort datetime parsing."""
    if not val:
        return datetime.utcnow()
    try:
        return datetime.fromisoformat(val.replace("Z", "+00:00"))
    except (ValueError, AttributeError):
        return datetime.utcnow()


# Module-level singleton
_client: Optional[NDMAClient] = None


def get_ndma_client() -> NDMAClient:
    global _client
    if _client is None:
        _client = NDMAClient()
    return _client
