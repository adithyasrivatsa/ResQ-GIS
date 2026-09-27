"""
Weather API endpoints.
Provides real-time meteorological observations and forecasts via IMD provider and cache.
"""
from fastapi import APIRouter
from app.schemas import WeatherResponse
from app.services.weather_service import get_weather_service

router = APIRouter(prefix="/api/weather", tags=["weather"])


@router.get("", response_model=WeatherResponse)
@router.get("/{location}", response_model=WeatherResponse)
async def get_weather(location: str = "Chamoli"):
    """Get current weather and 5-day forecast for a district or location."""
    svc = get_weather_service()
    return await svc.get_weather(location=location)
