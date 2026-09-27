"""
ResQ-GIS Backend — FastAPI Application
Disaster Relocation Intelligence Platform.
Implements Provider Adapter architecture, PostGIS persistence, and live data telemetry.
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from app.config import get_settings
from app.api import habitations, relocation, alerts, weather, hazards, rivers, analysis, emergency, terrain, admin, bhuvan
from app.database.session import is_database_connected, check_db_connection
from app.database.init_db import init_database
from app.services.cache_service import get_cache
from app.schemas import SystemStatusResponse, DataSourceStatus

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize PostGIS tables if database is available
    init_database()
    yield


app = FastAPI(
    title="ResQ-GIS API",
    description="AI/GIS decision-support platform for proactive disaster relocation",
    version="0.3.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    lifespan=lifespan,
)

# CORS Middleware
origins = [o.strip() for o in settings.cors_origins.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(habitations.router)
app.include_router(relocation.router)
app.include_router(alerts.router)
app.include_router(weather.router)
app.include_router(hazards.router)
app.include_router(rivers.router)
app.include_router(analysis.router)
app.include_router(emergency.router)
app.include_router(terrain.router)
app.include_router(admin.router)
app.include_router(bhuvan.router)


@app.get("/api/health")
async def health_check():
    return {
        "status": "ok",
        "data_mode": settings.data_mode,
        "demo_mode": settings.demo_mode,
        "database_connected": is_database_connected(),
        "version": "0.3.0",
    }


@app.get("/api/status", response_model=SystemStatusResponse)
async def system_status():
    """System status and telemetry provenance for all integrated data sources in the hierarchy."""
    cache = get_cache()
    db_connected = check_db_connection()

    # Truthful Provenance Calculation (LIVE, CACHED, STATIC, DEMO)
    imd_status = "LIVE" if (settings.is_live_mode and settings.imd_api_key) else "DEMO"
    sachet_status = "LIVE" if (settings.is_live_mode and settings.ndma_cap_feed_url) else "STATIC"
    cwc_status = "LIVE" if (settings.is_live_mode and settings.cwc_api_base_url) else "STATIC"
    osm_status = "LIVE" if (settings.is_live_mode and settings.osm_overpass_url) else "STATIC"
    copernicus_status = "LIVE" if (settings.is_live_mode and settings.copernicus_dem_url) else "STATIC"
    bhuvan_has_tokens = bool(
        settings.bhuvan_token_village_geocoding
        or settings.bhuvan_token_routing
        or settings.bhuvan_token_lulc_stats
    )
    bhuvan_status = "LIVE" if bhuvan_has_tokens else ("STATIC" if settings.bhuvan_wms_url else "DEMO")
    lgd_status = "LIVE" if (settings.is_live_mode and settings.lgd_api_base_url) else "STATIC"
    gsi_status = "LIVE" if (settings.is_live_mode and settings.gsi_bhukosh_wms_url) else "STATIC"
    sdma_status = "LIVE" if (settings.is_live_mode and settings.sdma_api_base_url) else "STATIC"
    idrn_status = "LIVE" if (settings.is_live_mode and settings.idrn_api_base_url) else "STATIC"
    postgis_status = "LIVE" if db_connected else "STATIC"

    return SystemStatusResponse(
        sources={
            "osm": DataSourceStatus(
                status=osm_status,
                last_updated=datetime.utcnow(),
                details="OpenStreetMap Overpass API (Live)" if osm_status == "LIVE" else "OSM Geofabrik Himalayan roads & evacuation lifelines (Static)",
            ),
            "copernicus": DataSourceStatus(
                status=copernicus_status,
                last_updated=datetime.utcnow(),
                details="Copernicus 30m WCS DEM (Live)" if copernicus_status == "LIVE" else "Copernicus GLO-30 Digital Elevation Model (Static)",
            ),
            "bhuvan": DataSourceStatus(
                status=bhuvan_status,
                last_updated=datetime.utcnow(),
                details="ISRO Bhuvan Web API & NRSC Portal (Live: Census Village Geocoding, Road Routing, LULC 50k, Post/Hospitals)" if bhuvan_status == "LIVE" else "ISRO Bhuvan Glacial Lake & Inundation Atlas (Static)",
            ),
            "lgd": DataSourceStatus(
                status=lgd_status,
                last_updated=datetime.utcnow(),
                details="LGD Ministry API (Live)" if lgd_status == "LIVE" else "LGD + Census Administrative Hierarchy & Demographics (Static)",
            ),
            "gsi": DataSourceStatus(
                status=gsi_status,
                last_updated=datetime.utcnow(),
                details="GSI BhuKosh WFS (Live)" if gsi_status == "LIVE" else "GSI National Landslide Susceptibility Mapping (Static)",
            ),
            "cwc": DataSourceStatus(
                status=cwc_status,
                last_updated=datetime.utcnow(),
                details="CWC Hydrological telemeters (Live)" if cwc_status == "LIVE" else "CWC / India-WRIS River Gauging Stations (Static)",
            ),
            "imd": DataSourceStatus(
                status=imd_status,
                last_updated=datetime.utcnow(),
                details="Official IMD API (Live)" if imd_status == "LIVE" else "IMD High-Fidelity Meteorological Scenario (Demo)",
            ),
            "sachet": DataSourceStatus(
                status=sachet_status,
                last_updated=datetime.utcnow(),
                details="SACHET / NDMA CAP Feed (Live)" if sachet_status == "LIVE" else "NDMA SACHET Disaster Warning Scenarios (Static)",
            ),
            "sdma": DataSourceStatus(
                status=sdma_status,
                last_updated=datetime.utcnow(),
                details="USDMA State Emergency API (Live)" if sdma_status == "LIVE" else "USDMA Emergency Dispatch & Road Bulletins (Static)",
            ),
            "idrn": DataSourceStatus(
                status=idrn_status,
                last_updated=datetime.utcnow(),
                details="IDRN Portal Webhook (Live)" if idrn_status == "LIVE" else "IDRN / DEOC Emergency Shelters, Helipads & Equipment (Static)",
            ),
            "postgis": DataSourceStatus(
                status=postgis_status,
                last_updated=datetime.utcnow(),
                details="PostgreSQL 16 + PostGIS 3.4 Spatial Database (Live)" if postgis_status == "LIVE" else "PostGIS Spatial Engine with GeoJSON Fallback (Static)",
            ),
        },
        data_mode=settings.data_mode,
        pilot_region="Chamoli + Rudraprayag, Uttarakhand",
        database_connected=db_connected,
        redis_enabled=cache.is_redis_active(),
    )


@app.get("/api/providers/status")
async def providers_detailed_status():
    """Detailed live telemetry, latency, and provenance for all data ingestion adapters."""
    from app.services.weather_service import get_weather_service
    from app.providers.copernicus.copernicus_adapter import get_copernicus_provider
    from app.providers.sachet.sachet_adapter import get_sachet_provider
    from app.providers.cwc.cwc_adapter import get_cwc_provider
    from app.providers.osm.osm_adapter import get_osm_provider
    from app.providers.gis.postgis_provider import PostGISProvider

    weather_svc = get_weather_service()
    dem_p = get_copernicus_provider()
    sachet_p = get_sachet_provider()
    cwc_p = get_cwc_provider()
    osm_p = get_osm_provider()
    postgis_p = PostGISProvider()

    statuses = {
        "weather": await weather_svc.get_status(),
        "terrain_dem": await dem_p.get_status(),
        "alerts_sachet": await sachet_p.get_status(),
        "rivers_cwc": await cwc_p.get_status(),
        "roads_osm": await osm_p.get_status(),
        "spatial_store": await postgis_p.get_status(),
    }

    live_count = sum(1 for s in statuses.values() if s.status == "LIVE")
    return {
        "overall_status": "OPERATIONAL" if live_count > 0 else "OFFLINE_STANDALONE",
        "live_count": live_count,
        "total_providers": len(statuses),
        "providers": statuses,
        "timestamp": datetime.utcnow(),
    }

