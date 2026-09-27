"""
Automated OpenStreetMap Overpass Infrastructure Harvester for ResQ-GIS.
Extracts live highways, bridges, evacuation lifelines, hospitals, and emergency staging
facilities for Chamoli and Rudraprayag districts in Uttarakhand.
"""
from __future__ import annotations
import json
import logging
import asyncio
from pathlib import Path
import httpx

logger = logging.getLogger(__name__)

OVERPASS_URL = "https://overpass-api.de/api/interpreter"
DATA_DIR = Path(__file__).resolve().parents[4] / "data" / "geojson"

# Bounding boxes for Himalayan monitoring districts
DISTRICT_BBOXES = {
    "chamoli": "30.20,79.15,30.85,79.95",
    "rudraprayag": "30.15,78.80,30.80,79.35",
}


async def harvest_highways(district: str = "chamoli") -> dict:
    """Fetch primary/secondary road networks and bridges from OSM."""
    bbox = DISTRICT_BBOXES.get(district.lower(), DISTRICT_BBOXES["chamoli"])
    query = f"""
    [out:json][timeout:25];
    (
      way["highway"~"primary|secondary|trunk|tertiary|bridge"]({bbox});
    );
    out geom;
    """
    logger.info(f"Harvesting OSM highways for {district}...")
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(OVERPASS_URL, data={"data": query})
        resp.raise_for_status()
        data = resp.json()

    features = []
    for el in data.get("elements", []):
        tags = el.get("tags", {})
        coords = [[p["lon"], p["lat"]] for p in el.get("geometry", []) if "lon" in p and "lat" in p]
        if len(coords) < 2:
            continue

        features.append({
            "type": "Feature",
            "id": f"osm-{el.get('id')}",
            "properties": {
                "id": f"osm-{el.get('id')}",
                "name": tags.get("name", tags.get("ref", "Himalayan Corridor")),
                "ref": tags.get("ref", "NH/SH"),
                "highway": tags.get("highway", "primary"),
                "surface": tags.get("surface", "paved"),
                "lanes": int(tags.get("lanes", 2) if str(tags.get("lanes", "")).isdigit() else 2),
                "is_evacuation_route": True,
                "passability_status": "clear",
                "district": district.capitalize(),
            },
            "geometry": {
                "type": "LineString",
                "coordinates": coords,
            }
        })

    geojson = {
        "type": "FeatureCollection",
        "name": f"OSM_Highways_{district.capitalize()}",
        "features": features,
    }
    return geojson


async def harvest_emergency_facilities(district: str = "chamoli") -> dict:
    """Fetch medical facilities, schools, and community shelters from OSM."""
    bbox = DISTRICT_BBOXES.get(district.lower(), DISTRICT_BBOXES["chamoli"])
    query = f"""
    [out:json][timeout:25];
    (
      node["amenity"~"hospital|clinic|doctors|school|community_centre"]({bbox});
    );
    out body;
    """
    logger.info(f"Harvesting emergency facilities for {district}...")
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(OVERPASS_URL, data={"data": query})
        resp.raise_for_status()
        data = resp.json()

    features = []
    for el in data.get("elements", []):
        tags = el.get("tags", {})
        lat = el.get("lat")
        lng = el.get("lon")
        if not lat or not lng:
            continue

        amenity = tags.get("amenity", "facility")
        features.append({
            "type": "Feature",
            "id": f"facility-{el.get('id')}",
            "properties": {
                "id": f"facility-{el.get('id')}",
                "name": tags.get("name", f"Emergency {amenity.capitalize()}"),
                "amenity": amenity,
                "type": "medical" if amenity in ["hospital", "clinic", "doctors"] else "shelter",
                "district": district.capitalize(),
                "latitude": lat,
                "longitude": lng,
            },
            "geometry": {
                "type": "Point",
                "coordinates": [lng, lat],
            }
        })

    return {
        "type": "FeatureCollection",
        "name": f"OSM_Facilities_{district.capitalize()}",
        "features": features,
    }


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    async def main():
        hw = await harvest_highways("chamoli")
        print(f"Harvested {len(hw['features'])} road corridors for Chamoli.")
    asyncio.run(main())
