"""
Alert Service.
Fetches and aggregates multi-hazard alerts from SACHET/NDMA and local mock providers.
"""
from __future__ import annotations
from app.config import get_settings
from app.schemas import DisasterAlert, DataProvenance
from app.providers.alerts.sachet_provider import SachetAlertProvider
from app.providers.alerts.mock_alert_provider import MockAlertProvider
from app.providers.sdma.sdma_adapter import get_sdma_provider
from app.services.cache_service import get_cache


class AlertService:
    def __init__(self):
        self.settings = get_settings()
        self.sachet_provider = SachetAlertProvider()
        self.sdma_provider = get_sdma_provider()
        self.mock_provider = MockAlertProvider()
        self.cache = get_cache()

    async def get_alerts(self, region: str | None = None) -> list[DisasterAlert]:
        cache_key = f"alerts:{region.lower() if region else 'all'}"

        if self.settings.is_live_mode:
            cached = self.cache.get(cache_key)
            if cached is not None:
                for a in cached:
                    a.provenance = DataProvenance.CACHED
                return cached

            live_sachet = await self.sachet_provider.get_active_alerts(region)
            live_sdma = await self.sdma_provider.get_state_advisories(region or "Uttarakhand")

            combined = []
            seen_ids = set()
            for a in live_sachet + live_sdma:
                if a.id not in seen_ids:
                    seen_ids.add(a.id)
                    combined.append(a)

            if combined:
                self.cache.set(cache_key, combined, ttl_seconds=300.0)  # 5 min TTL
                return combined

            # Stale cache check
            stale = self.cache.get_stale(cache_key)
            if stale:
                alerts, _ = stale
                for a in alerts:
                    a.provenance = DataProvenance.STALE
                return alerts

        # Fallback to combined static / mock alerts
        mock_alerts = await self.mock_provider.get_active_alerts(region)
        sdma_static = await self.sdma_provider.get_state_advisories(region or "Uttarakhand")
        combined = []
        seen_ids = set()
        for a in mock_alerts + sdma_static:
            if a.id not in seen_ids:
                seen_ids.add(a.id)
                combined.append(a)
        return combined


_alert_service = AlertService()


def get_alert_service() -> AlertService:
    return _alert_service
