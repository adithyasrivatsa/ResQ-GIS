"""
Optional Adapter: Generic State Disaster Management Authorities (Other SDMAs).
Provides interfaces for HPSDMA (Himachal Pradesh), SSDMA (Sikkim),
KSDMA (Kerala), ASDMA (Assam), and OSDMA (Odisha).
Ready adapter interface — not a mandatory runtime dependency.
"""
from __future__ import annotations
from datetime import datetime
from app.schemas import DisasterAlert, Severity, DataProvenance
from app.providers.base import SDMAProvider


class GenericSDMAAdapter(SDMAProvider):
    def __init__(self, state_name: str = "Himachal Pradesh", api_url: str = ""):
        self.state_name = state_name
        self.api_url = api_url
        self.is_enabled = bool(api_url)

    @property
    def name(self) -> str:
        return f"{self.state_name} State Disaster Management Authority (Optional)"

    async def get_state_advisories(self, state: str = "") -> list[DisasterAlert]:
        target_state = state or self.state_name
        return [
            DisasterAlert(
                id=f"sdma-gen-{target_state.lower()[:3]}-01",
                type="State Level Advisory",
                severity=Severity.YELLOW,
                title=f"{target_state} SDMA: Regional Meteorological Watch",
                description=f"Standard seasonal vigilance active across {target_state} hill and river sectors.",
                issued_at=datetime.utcnow(),
                region=target_state,
                source=self.name,
                provenance=DataProvenance.DEMO,
            )
        ]


# Pre-configured instances for prospective expansion states
hpsdma_adapter = GenericSDMAAdapter(state_name="Himachal Pradesh")
ssma_adapter = GenericSDMAAdapter(state_name="Sikkim")
ksdma_adapter = GenericSDMAAdapter(state_name="Kerala")
asdma_adapter = GenericSDMAAdapter(state_name="Assam")
osdma_adapter = GenericSDMAAdapter(state_name="Odisha")
