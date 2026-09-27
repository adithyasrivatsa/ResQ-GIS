"""
ISRO Bhuvan / NRSC API Endpoints.
Exposes direct web telemetry and thematic statistics from official ISRO Bhuvan services:
- Village Geocoding & Census 2011 Demographics
- Shortest Path Road Network Routing
- LULC 50k District-level Land Cover Classifications
- Custom AOI Polygon Land Use Breakdown
- IndiaPost & Healthcare POI Proximity
"""
from __future__ import annotations
from typing import Any, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from app.providers.bhuvan.bhuvan_api_client import get_bhuvan_api_client, UK_DISTRICT_CODES

router = APIRouter(prefix="/api/bhuvan", tags=["bhuvan"])


class AoiRequest(BaseModel):
    polygon_wkt: str


@router.get("/status")
async def bhuvan_status():
    """Returns connectivity and token status for all integrated ISRO Bhuvan endpoints."""
    client = get_bhuvan_api_client()
    return await client.check_health()


@router.get("/village/{village_name}")
async def geocode_village(
    village_name: str,
    state: Optional[str] = "UTTARAKHAND"
):
    """
    Search ISRO Bhuvan Village Geocoding registry for official Census 2011 records,
    including Village ID (VID), households, total population, SC/ST count, literacy, and coordinates.
    """
    client = get_bhuvan_api_client()
    results = await client.geocode_village(village_name=village_name, state_filter=state)
    if not results:
        # Fallback without state filter if not found in state
        results = await client.geocode_village(village_name=village_name, state_filter=None)
    return {
        "query": village_name,
        "count": len(results),
        "results": results
    }


@router.get("/reverse-village")
async def reverse_geocode_village(
    lat: float = Query(..., description="Latitude in decimal degrees"),
    lon: float = Query(..., description="Longitude in decimal degrees")
):
    """
    Reverse geocodes coordinates to the closest Census village boundary on ISRO Bhuvan.
    """
    client = get_bhuvan_api_client()
    result = await client.reverse_geocode_village(lat=lat, lon=lon)
    if not result:
        return {"status": "not_found", "message": "No mapped Bhuvan village boundary at coordinates", "lat": lat, "lon": lon}
    return result


@router.get("/route")
async def get_shortest_route(
    lat1: float = Query(..., description="Origin latitude"),
    lon1: float = Query(..., description="Origin longitude"),
    lat2: float = Query(..., description="Destination latitude"),
    lon2: float = Query(..., description="Destination longitude")
):
    """
    Computes shortest path road network geometry using ISRO Bhuvan Routing API.
    Returns GeoJSON FeatureCollection with MultiLineString road coordinates.
    """
    client = get_bhuvan_api_client()
    route_geojson = await client.get_shortest_route(lat1=lat1, lon1=lon1, lat2=lat2, lon2=lon2)
    if not route_geojson:
        raise HTTPException(
            status_code=404,
            detail="Could not generate road network route between specified coordinates on Bhuvan graph."
        )
    return route_geojson


@router.get("/lulc/district/{distcode}")
async def get_district_lulc(
    distcode: str = "0502",
    year: str = "1112"
):
    """
    Returns official ISRO LULC 50k land use / land cover breakdown for a district.
    District codes: '0502' for Chamoli, '0503' for Rudraprayag, '0501' for Uttarkashi.
    """
    client = get_bhuvan_api_client()
    stats = await client.get_district_lulc(distcode=distcode, year=year)
    if not stats:
        raise HTTPException(
            status_code=502,
            detail=f"Failed to retrieve LULC statistics for district code {distcode} from ISRO Bhuvan."
        )
    return stats


@router.post("/lulc/aoi")
async def get_aoi_lulc(req: AoiRequest):
    """
    Calculates LULC class coverage on ISRO Bhuvan for an arbitrary Polygon WKT.
    """
    client = get_bhuvan_api_client()
    stats = await client.get_aoi_lulc(req.polygon_wkt)
    if not stats:
        raise HTTPException(
            status_code=502,
            detail="Failed to compute AOI LULC breakdown on ISRO Bhuvan."
        )
    return stats


@router.get("/facilities")
async def get_facilities_proximity(
    theme: str = Query("hospital", description="'hospital' or 'postal'"),
    lat: float = Query(30.555, description="Latitude"),
    lon: float = Query(79.566, description="Longitude"),
    buffer: int = Query(20000, description="Search radius in meters")
):
    """
    Queries IndiaPost and Healthcare facilities mapped on Bhuvan within search radius.
    """
    client = get_bhuvan_api_client()
    facilities = await client.get_proximity_facilities(theme=theme, lat=lat, lon=lon, buffer_meters=buffer)
    return {
        "theme": theme,
        "count": len(facilities),
        "lat": lat,
        "lon": lon,
        "buffer_meters": buffer,
        "facilities": facilities
    }


@router.get("/districts")
async def list_uttarakhand_districts():
    """Lists standard district codes for Uttarakhand mountain region."""
    return [
        {"code": code, "name": name}
        for code, name in UK_DISTRICT_CODES.items()
    ]
