"""
Optional Adapter: PM Gati Shakti National Master Plan.
Provides multi-modal infrastructure alignment, logistical nodes, and right-of-way corridor layers.
Ready adapter interface — not a mandatory runtime dependency.
"""
from __future__ import annotations
import logging
from typing import Optional

logger = logging.getLogger(__name__)


class PMGatiShaktiAdapter:
    """PM Gati Shakti Multi-Modal Logistics & Infrastructure Adapter."""

    def __init__(self, endpoint_url: str = ""):
        self.endpoint_url = endpoint_url
        self.is_enabled = False

    @property
    def name(self) -> str:
        return "PM Gati Shakti National Master Plan (Optional)"

    async def get_logistics_corridors(self, district: str | None = None) -> list[dict]:
        if not self.is_enabled or not self.endpoint_url:
            return []
        return []
