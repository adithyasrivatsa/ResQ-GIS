"""
Optional Adapter: CARTO Spatial Vector & Basemap Services.
Provides high-contrast operational dispatch basemaps and spatial SQL endpoints.
Ready adapter interface — not a mandatory runtime dependency.
"""
from __future__ import annotations


class CartoAdapter:
    def __init__(self, api_key: str = "", username: str = ""):
        self.api_key = api_key
        self.username = username
        self.is_enabled = bool(api_key and username)

    @property
    def name(self) -> str:
        return "CARTO Spatial Platform (Optional)"

    def get_basemap_url(self, theme: str = "dark_all") -> str:
        return f"https://{{s}}.basemaps.cartocdn.com/rastertiles/{theme}/{{z}}/{{x}}/{{y}}.png"
