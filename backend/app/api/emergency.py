"""
IDRN & DEOC Emergency Infrastructure API endpoints.
Provides emergency response shelters, medical posts, equipment staging depots, and helipads.
"""
from fastapi import APIRouter, HTTPException
from app.schemas import EmergencyResource
from app.services.emergency_service import get_emergency_service

router = APIRouter(prefix="/api/emergency", tags=["emergency-infrastructure"])


@router.get("/resources", response_model=list[EmergencyResource])
async def list_emergency_resources(
    district: str | None = None,
    resource_type: str | None = None,
):
    """List IDRN and DEOC emergency resources, optionally filtered by district or type."""
    svc = get_emergency_service()
    return await svc.get_resources(district=district, resource_type=resource_type)


@router.get("/resources/{resource_id}", response_model=EmergencyResource)
async def get_emergency_resource(resource_id: str):
    """Get detailed telemetry and equipment inventory for a specific emergency resource."""
    svc = get_emergency_service()
    res = await svc.get_resource_by_id(resource_id)
    if not res:
        raise HTTPException(status_code=404, detail=f"Emergency resource '{resource_id}' not found")
    return res
