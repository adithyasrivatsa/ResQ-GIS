"""
River Monitoring API endpoints.
Provides real-time river gauge observations, warning/danger levels, and telemetry.
"""
from fastapi import APIRouter, HTTPException
from app.schemas import RiverStation, RiverMeasurement
from app.services.river_service import get_river_service

router = APIRouter(prefix="/api/rivers", tags=["rivers"])


@router.get("", response_model=list[RiverStation])
async def list_river_stations(region: str | None = None):
    """List all hydrological monitoring stations, optionally filtered by basin/district."""
    svc = get_river_service()
    return await svc.get_stations(region=region)


@router.get("/{station_id}", response_model=RiverMeasurement)
async def get_river_measurement(station_id: str):
    """Get latest hydrological measurements for a specific gauge station."""
    svc = get_river_service()
    measurement = await svc.get_measurement(station_id)
    if not measurement:
        raise HTTPException(status_code=404, detail=f"River station '{station_id}' not found or telemetry unavailable")
    return measurement
