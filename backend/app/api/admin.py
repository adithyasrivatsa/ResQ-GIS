"""
LGD Administrative Hierarchy API endpoints.
Provides hierarchical administrative boundaries:
Region -> State -> District -> Block -> Village / Habitation.
Supports multi-state scalability for Himalayan and Indian disaster zones.
"""
from fastapi import APIRouter
from app.schemas import AdministrativeHierarchyResponse
from app.services.admin_service import get_admin_service

router = APIRouter(prefix="/api/admin", tags=["administrative-hierarchy"])


@router.get("/hierarchy", response_model=AdministrativeHierarchyResponse)
async def get_administrative_hierarchy(region: str | None = None):
    """Fetch administrative boundary tree for operational scoping."""
    svc = get_admin_service()
    return await svc.get_hierarchy(region=region)
