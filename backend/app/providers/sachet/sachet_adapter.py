"""
SACHET / NDMA Alert Provider Adapter.
Fetches and normalizes Common Alerting Protocol (CAP) multi-hazard early warnings.
Pipeline: Live SACHET CAP Feed -> Redis/Memory Cache -> Static Alert Scenario Dataset -> Demo Fallback.
Implements BaseLifecycleProvider with truthful provenance and status telemetry.
"""
from __future__ import annotations
import time
import json
import logging
import httpx
from datetime import datetime
from pathlib import Path
from app.config import get_settings
from app.schemas import DisasterAlert, Severity, DataProvenance, ProviderHealthStatus
from app.providers.base import AlertProvider, BaseLifecycleProvider
from app.services.cache_service import get_cache

logger = logging.getLogger(__name__)
DATA_PATH = Path(__file__).resolve().parents[4] / "data" / "demo" / "alerts.json"


class SachetAdapter(BaseLifecycleProvider[list, list, list[DisasterAlert]], AlertProvider):
    def __init__(self):
        self.settings = get_settings()
        self.feed_url = self.settings.ndma_cap_feed_url
        self.cache = get_cache()
        self._last_status = ProviderHealthStatus(
            provider="alerts_sachet",
            status="INITIALIZING",
            source="NDMA SACHET CAP Feed",
            last_updated=None,
        )

    @property
    def name(self) -> str:
        return "SACHET (NDMA CAP Feed)"

    async def get_status(self) -> ProviderHealthStatus:
        return self._last_status

    async def fetch(self, region: str | None = None) -> list:
        async with httpx.AsyncClient(timeout=6.0) as client:
            resp = await client.get(self.feed_url)
            resp.raise_for_status()
            data = resp.json()
            return data if isinstance(data, list) else data.get("alerts", data.get("data", []))

    def validate(self, raw: list) -> list:
        if not isinstance(raw, list):
            return []
        return raw

    def normalize(self, validated: list) -> list[DisasterAlert]:
        alerts: list[DisasterAlert] = []
        for a in validated:
            try:
                area_desc = a.get("area_description", a.get("area", "Uttarakhand"))
                severity_str = str(a.get("severity", "yellow")).lower()
                sev = (
                    Severity.RED if severity_str in ("red", "extreme", "severe")
                    else Severity.ORANGE if severity_str in ("orange", "moderate")
                    else Severity.YELLOW
                )
                alerts.append(
                    DisasterAlert(
                        id=str(a.get("identifier", a.get("id", f"alert-{len(alerts)+1}"))),
                        type=str(a.get("event", a.get("type", "Disaster Alert"))),
                        severity=sev,
                        title=str(a.get("headline", a.get("title", "Disaster Warning"))),
                        description=str(a.get("description", "")),
                        issued_at=datetime.fromisoformat(a.get("sent", datetime.utcnow().isoformat())),
                        region=area_desc,
                        geometry=a.get("geometry"),
                        source="SACHET",
                        provenance=DataProvenance.LIVE,
                    )
                )
            except Exception as e:
                logger.warning(f"Error normalizing SACHET alert: {e}")
        return alerts

    async def get_active_alerts(self, region: str | None = None) -> list[DisasterAlert]:
        cache_key = f"sachet:alerts:{region.lower() if region else 'all'}"
        cached = self.cache.get(cache_key)
        if cached is not None:
            for a in cached:
                a.provenance = DataProvenance.CACHED
            return cached

        # 1. Try Live CAP fetch
        t0 = time.perf_counter()
        if self.feed_url:
            try:
                raw = await self.fetch(region)
                valid = self.validate(raw)
                live_alerts = self.normalize(valid)
                latency = (time.perf_counter() - t0) * 1000.0

                if live_alerts:
                    self._last_status = ProviderHealthStatus(
                        provider="alerts_sachet",
                        status="LIVE",
                        source="NDMA SACHET Live CAP Feed",
                        last_updated=datetime.utcnow(),
                        latency_ms=round(latency, 2),
                        quality="GOOD",
                        record_count=len(live_alerts),
                    )
                    self.cache.set(cache_key, live_alerts, ttl_seconds=300.0)
                    return live_alerts
            except Exception as e:
                latency = (time.perf_counter() - t0) * 1000.0
                logger.info(f"Live SACHET CAP query deferred: {e}; falling back to static alert records")
                self._last_status = ProviderHealthStatus(
                    provider="alerts_sachet",
                    status="UNAVAILABLE",
                    source="NDMA SACHET Feed (Connection Timed Out)",
                    last_updated=datetime.utcnow(),
                    latency_ms=round(latency, 2),
                    quality="DEGRADED",
                    error_message=str(e),
                )

        # 2. Static Fallback (clearly tagged as STATIC provenance)
        static_alerts = self._load_static_alerts(region)
        if static_alerts:
            self.cache.set(cache_key, static_alerts, ttl_seconds=300.0)
            return static_alerts

        return self._demo_alerts()

    def _load_static_alerts(self, region: str | None) -> list[DisasterAlert]:
        if not DATA_PATH.exists():
            return []
        try:
            with open(DATA_PATH, "r", encoding="utf-8") as f:
                items = json.load(f)

            alerts = []
            for a in items:
                area = a.get("region", a.get("area", ""))
                if region and region.lower() not in area.lower():
                    continue

                sev_val = str(a.get("severity", "yellow")).lower()
                sev = Severity.RED if sev_val == "red" else Severity.ORANGE if sev_val == "orange" else Severity.YELLOW

                alerts.append(
                    DisasterAlert(
                        id=a.get("id", f"alert-{len(alerts)+1}"),
                        type=a.get("type", "Disaster Alert"),
                        severity=sev,
                        title=a.get("title", "Disaster Warning"),
                        description=a.get("description", ""),
                        issued_at=datetime.fromisoformat(a.get("issuedAt", datetime.utcnow().isoformat())),
                        expires_at=datetime.fromisoformat(a.get("expiresAt")) if a.get("expiresAt") else None,
                        region=area,
                        geometry=a.get("geometry"),
                        source="SACHET",
                        provenance=DataProvenance.STATIC,
                    )
                )
            return alerts
        except Exception as e:
            logger.warning(f"Failed to load static SACHET alerts: {e}")
            return []

    def _demo_alerts(self) -> list[DisasterAlert]:
        return [
            DisasterAlert(
                id="alert-demo-joshimath",
                type="Landslide Warning",
                severity=Severity.RED,
                title="Red Alert: Subsidence Hazard in Sunil/Marwari Sector",
                description="Ground displacement rate exceeding threshold; immediate evacuation advisory active.",
                issued_at=datetime.utcnow(),
                region="Chamoli",
                source="SACHET",
                provenance=DataProvenance.DEMO,
            )
        ]


_sachet_adapter = SachetAdapter()


def get_sachet_provider() -> SachetAdapter:
    return _sachet_adapter
