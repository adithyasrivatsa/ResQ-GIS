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
                ident = str(item.get("identifier", ""))
                sent_time = str(item.get("effective_start_time") or item.get("sent", ""))
                dedup_key = hashlib.md5(f"{ident}{sent_time}".encode()).hexdigest()

                if dedup_key in _seen_alerts:
                    continue
                _seen_alerts.add(dedup_key)

                # Map severity
                color_str = str(item.get("severity_color", "")).lower()
                severity_str = str(item.get("severity") or item.get("color") or "yellow").lower()
                if color_str == "red" or severity_str in ("red", "extreme", "severe", "alert"):
                    severity = Severity.RED
                elif color_str == "orange" or severity_str in ("orange", "moderate", "warning"):
                    severity = Severity.ORANGE
                elif color_str == "yellow" or severity_str in ("yellow", "minor", "watch"):
                    severity = Severity.YELLOW
                elif color_str == "green" or severity_str in ("green", "minimal"):
                    severity = Severity.GREEN
                else:
                    severity = Severity.YELLOW

                # Extract area
                area_desc = item.get("area_description") or item.get("areaDesc") or item.get("area", "Unknown")
                if isinstance(area_desc, list):
                    area_desc = ", ".join(area_desc)

                event_type = item.get("disaster_type") or item.get("event") or item.get("event_type", "Alert")
                desc = item.get("warning_message") or item.get("description") or item.get("headline", "")

                geometry = item.get("geometry")
                if not geometry and item.get("centroid"):
                    try:
                        parts = str(item["centroid"]).split(",")
                        if len(parts) == 2:
                            lon, lat = float(parts[0].strip()), float(parts[1].strip())
                            geometry = {"type": "Point", "coordinates": [lon, lat]}
                    except Exception:
                        pass

                alerts.append(NDMAAlert(
                    event_type=str(event_type),
                    severity=severity,
                    area=str(area_desc),
                    issued_at=_parse_datetime(item.get("effective_start_time") or item.get("sent") or item.get("issued_at")),
                    expires_at=_parse_datetime(item.get("effective_end_time") or item.get("expires")),
                    description=str(desc),
                    geometry=geometry,
                ))
            except Exception as e:
                logger.warning(f"Failed to parse NDMA alert: {e}")
                continue

        return alerts


def _parse_datetime(val: str | None) -> datetime:
    """Best-effort datetime parsing for ISO and SACHET formats."""
    if not val:
        return datetime.utcnow()
    if isinstance(val, datetime):
        return val
    val_str = str(val).strip()
    import re
    try:
        clean = re.sub(r"\s+[A-Z]{3,4}\s+", " ", val_str)
        return datetime.strptime(clean, "%a %b %d %H:%M:%S %Y")
    except Exception:
        pass
    try:
        return datetime.fromisoformat(val_str.replace("Z", "+00:00"))
    except (ValueError, AttributeError):
        return datetime.utcnow()


# Module-level singleton
_client: Optional[NDMAClient] = None


def get_ndma_client() -> NDMAClient:
    global _client
    if _client is None:
        _client = NDMAClient()
    return _client
