"""
SACHET / NDMA Alert Provider.
Backward compatibility facade delegating to app.providers.sachet.SachetAdapter.
"""
from __future__ import annotations
from app.providers.sachet.sachet_adapter import SachetAdapter

SachetAlertProvider = SachetAdapter

__all__ = ["SachetAlertProvider", "SachetAdapter"]
