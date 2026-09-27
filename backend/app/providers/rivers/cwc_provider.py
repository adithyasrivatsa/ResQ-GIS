"""
CWC (Central Water Commission) River Provider.
Backward compatibility facade delegating to app.providers.cwc.CWCAdapter.
"""
from __future__ import annotations
from app.providers.cwc.cwc_adapter import CWCAdapter

CWCRiverProvider = CWCAdapter

__all__ = ["CWCRiverProvider", "CWCAdapter"]
