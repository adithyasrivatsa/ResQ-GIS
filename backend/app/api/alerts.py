"""
Alerts API endpoints.
Provides real-time multi-hazard CAP alerts via SACHET provider with local fallback.
"""
from fastapi import APIRouter
from app.schemas import DisasterAlert
from app.services.alert_service import get_alert_service

router = APIRouter(prefix="/api/alerts", tags=["alerts"])


@router.get("", response_model=list[DisasterAlert])
async def list_alerts(
    region: str | None = None,
    source: str | None = None,
    severity: str | None = None,
):
    """List active disaster alerts, optionally filtered by region, source, or severity."""
    svc = get_alert_service()
    alerts = await svc.get_alerts(region=region)
    if source:
        alerts = [a for a in alerts if a.source.lower() == source.lower()]
    if severity:
        alerts = [a for a in alerts if a.severity.value.lower() == severity.lower()]
    return alerts
