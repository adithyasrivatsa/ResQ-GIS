"""
IMD (India Meteorological Department) Weather Provider.
Backward compatibility facade delegating to app.providers.imd.IMDAdapter.
"""
from __future__ import annotations
from app.providers.imd.imd_adapter import IMDAdapter

IMDWeatherProvider = IMDAdapter

__all__ = ["IMDWeatherProvider", "IMDAdapter"]
