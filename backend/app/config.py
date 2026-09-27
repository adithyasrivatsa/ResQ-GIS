"""
ResQ-GIS Backend Configuration
Centralized settings management supporting live and demo operational modes.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache
from typing import Optional


class Settings(BaseSettings):
    # Operating Mode: "demo" or "live"
    data_mode: str = "demo"

    # Database (PostgreSQL + PostGIS)
    database_url: str = "postgresql://resqgis:resqgis@localhost:5432/resqgis"

    # Redis Cache (Optional)
    redis_url: Optional[str] = None

    # IMD API
    imd_api_base_url: str = "https://api.imd.gov.in/api/v1"
    imd_api_key: str = ""

    # NDMA / SACHET
    ndma_cap_feed_url: str = "https://sachet.ndma.gov.in/cap_public_website/FetchAllAlertDetails"

    # CWC
    cwc_api_base_url: str = ""

    # OpenStreetMap (Overpass API)
    osm_overpass_url: str = "https://overpass-api.de/api/interpreter"

    # Copernicus DEM
    copernicus_dem_url: str = ""

    # ISRO Bhuvan / NRSC
    bhuvan_wms_url: str = "https://bhuvan-wms.nrsc.gov.in/bhuvan/wms"
    bhuvan_api_base_url: str = "https://bhuvan-app1.nrsc.gov.in/api"
    bhuvan_token_village_geocoding: str = "d1ce6ccb01dd184cc930d9f7aef77ace93776fac"
    bhuvan_token_village_reverse: str = "88dc93d556c36d31f5f74563d8ce72ee66b3abc1"
    bhuvan_token_routing: str = "0cf8071493cb95421e2ff23ebbbaf6b7bab300f9"
    bhuvan_token_geoid: str = "3142acbee3c280834047e805c9b1c21e7f8d8303"
    bhuvan_token_postal_hospital: str = "bb3c3e8946935e1831eb0d8adf76bc12744297c6"
    bhuvan_token_lulc_stats: str = "1ba76d7c2e6df447f22464504e1b27c2b0977e59"
    bhuvan_token_lulc_aoi: str = "773fe1425fb6a99a5fe73d7b493dc4329edffaef"

    # LGD (Local Government Directory)
    lgd_api_base_url: str = ""

    # GSI BhuKosh / NLSM
    gsi_bhukosh_wms_url: str = "https://bhukosh.gsi.gov.in/geoserver/wms"

    # SDMA (e.g. USDMA)
    sdma_api_base_url: str = ""

    # IDRN / DEOC
    idrn_api_base_url: str = ""

    # Cesium Ion Token (Server configuration reference)
    cesium_ion_token: str = ""

    # CORS
    cors_origins: str = "http://localhost:3000,http://localhost:5173"

    # App Environment
    app_env: str = "development"

    @property
    def is_live_mode(self) -> bool:
        return self.data_mode.lower() == "live"

    @property
    def demo_mode(self) -> bool:
        return self.data_mode.lower() != "live"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
