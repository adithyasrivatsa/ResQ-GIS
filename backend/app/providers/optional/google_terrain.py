"""
Optional Adapter: Google Maps & Google 3D Terrain Tiles.
Ready adapter interface — not a mandatory runtime dependency.
"""
from __future__ import annotations


class GoogleTerrainAdapter:
    def __init__(self, api_key: str = ""):
        self.api_key = api_key
        self.is_enabled = bool(api_key)

    @property
    def name(self) -> str:
        return "Google Maps / Photorealistic 3D Tiles (Optional)"

    def get_tiles_endpoint(self) -> str:
        if not self.is_enabled:
            return ""
        return f"https://tile.googleapis.com/v1/3dtiles/root.json?key={self.api_key}"
