"""
Optional Adapter: Esri ArcGIS Online & Living Atlas.
Provides high-resolution world imagery and topographic contours.
Ready adapter interface — not a mandatory runtime dependency.
"""
from __future__ import annotations


class EsriAdapter:
    def __init__(self, api_key: str = ""):
        self.api_key = api_key
        self.is_enabled = bool(api_key)

    @property
    def name(self) -> str:
        return "Esri Living Atlas (Optional)"

    def get_world_imagery_url(self) -> str:
        return "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"

    def get_world_topo_url(self) -> str:
        return "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}"
