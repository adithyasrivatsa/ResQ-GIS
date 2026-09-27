"""
ResQ-GIS Backend Configuration
Centralized settings management supporting live and demo operational modes.
"""
from pydantic_settings import BaseSettings
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

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


@lru_cache
def get_settings() -> Settings:
    return Settings()
