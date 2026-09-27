"""
Copernicus DEM Terrain and Slope Analysis API endpoints.
Provides elevation querying and localized slope gradient evaluation.
"""
from fastapi import APIRouter
from app.schemas import TerrainElevationPoint, SlopeAnalysisResponse, SlopeAnalysisRequest
from app.services.terrain_service import get_terrain_service

router = APIRouter(prefix="/api/terrain", tags=["terrain-and-dem"])


@router.get("/slope", response_model=TerrainElevationPoint)
async def get_terrain_slope(lat: float, lng: float):
    """Fetch elevation, slope gradient (degrees & percentage), and grade classification from Copernicus DEM."""
    svc = get_terrain_service()
    return await svc.get_slope(lat, lng)


@router.post("/analyze", response_model=SlopeAnalysisResponse)
async def analyze_terrain_profile(req: SlopeAnalysisRequest):
    """Batch analyze slope gradient profile across proposed relocation points."""
    svc = get_terrain_service()
    return await svc.analyze_slope(req.points)
