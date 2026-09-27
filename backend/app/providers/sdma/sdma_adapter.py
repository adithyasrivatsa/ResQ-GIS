"""
SDMA (State Disaster Management Authority) Provider Adapter.
Provides state-specific disaster warnings, road blockage bulletins,
and local emergency operations center (SEOC/DEOC) alerts.
Optimized for USDMA (Uttarakhand) with generalized adapters for other states.
Pipeline: Live SDMA API -> Redis Cache -> Static SDMA Bulletins -> Demo Fallback.
"""
from __future__ import annotations
import json
import logging
import httpx
from datetime import datetime
from pathlib import Path
from app.config import get_settings
from app.schemas import DisasterAlert, Severity, DataProvenance
from app.providers.base import SDMAProvider
from app.services.cache_service import get_cache

logger = logging.getLogger(__name__)
DATA_PATH = Path(__file__).resolve().parents[4] / "data" / "geojson" / "sdma_bulletins.json"


class USDMAAdapter(SDMAProvider):
    def __init__(self):
        self.settings = get_settings()
        self.api_url = self.settings.sdma_api_base_url
        self.cache = get_cache()

    @property
    def name(self) -> str:
        return "USDMA (Uttarakhand State Disaster Management Authority / DMMC)"

    async def get_state_advisories(self, state: str = "Uttarakhand") -> list[DisasterAlert]:
        cache_key = f"sdma:advisories:{state.lower()}"
        cached = self.cache.get(cache_key)
        if cached is not None:
            return cached

        # 1. LIVE check if external SDMA API configured
        if self.settings.is_live_mode and self.api_url:
            live_bulletins = await self._fetch_live_sdma(state)
            if live_bulletins:
                self.cache.set(cache_key, live_bulletins, ttl_seconds=300.0)
                return live_bulletins

        # 2. STATIC fallback (curated SEOC bulletins)
        static_bulletins = self._load_static_bulletins(state)
        if static_bulletins:
            self.cache.set(cache_key, static_bulletins, ttl_seconds=300.0)
            return static_bulletins

        # 3. DEMO fallback
        return self._demo_bulletins(state)

    def _load_static_bulletins(self, state: str) -> list[DisasterAlert]:
        if not DATA_PATH.exists():
            return []
        try:
            with open(DATA_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)

            alerts = []
            for b in data.get("bulletins", []):
                sev_val = b.get("severity", "orange").lower()
                sev = Severity.RED if sev_val == "red" else Severity.ORANGE if sev_val == "orange" else Severity.YELLOW

                alerts.append(
                    DisasterAlert(
                        id=b.get("id"),
                        type=b.get("type", "State Advisory"),
                        severity=sev,
                        title=b.get("title", "SDMA Bulletin"),
                        description=b.get("description", ""),
                        issued_at=datetime.fromisoformat(b.get("issuedAt", datetime.utcnow().isoformat())),
                        region=b.get("district", "Chamoli"),
                        source=b.get("source", self.name),
                        provenance=DataProvenance.STATIC,
                    )
                )
            return alerts
        except Exception as e:
            logger.warning(f"Failed to load static SDMA bulletins: {e}")
            return []

    async def _fetch_live_sdma(self, state: str) -> list[DisasterAlert]:
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                resp = await client.get(f"{self.api_url}/bulletins", params={"state": state})
                if resp.status_code == 200:
                    raw = resp.json()
                    items = raw if isinstance(raw, list) else raw.get("bulletins", [])
                    results = []
                    for b in items:
                        sev_val = b.get("severity", "yellow").lower()
                        sev = Severity.RED if sev_val in ("red", "extreme") else Severity.ORANGE if sev_val in ("orange", "severe") else Severity.YELLOW
                        results.append(
                            DisasterAlert(
                                id=str(b.get("id")),
                                type=b.get("type", "SDMA Bulletin"),
                                severity=sev,
                                title=b.get("title", ""),
                                description=b.get("description", ""),
                                issued_at=datetime.utcnow(),
                                region=b.get("district", "Chamoli"),
                                source=self.name,
                                provenance=DataProvenance.LIVE,
                            )
                        )
                    return results
        except Exception as e:
            logger.info(f"Live SDMA query deferred: {e}; using static state bulletin data")
        return []

    def _demo_bulletins(self, state: str) -> list[DisasterAlert]:
        return [
            DisasterAlert(
                id="sdma-demo-01",
                type="Highway Status",
                severity=Severity.ORANGE,
                title=f"{state} SDMA: Precautionary Speed Restrictions on Ghat Roads",
                description="Moderate rainfall triggering small rolling stones along cliffside highway sections.",
                issued_at=datetime.utcnow(),
                region="Chamoli",
                source=self.name,
                provenance=DataProvenance.DEMO,
            )
        ]


_sdma_adapter = USDMAAdapter()


def get_sdma_provider() -> USDMAAdapter:
    return _sdma_adapter
