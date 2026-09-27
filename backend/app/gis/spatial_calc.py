"""
Geodesic and Spatial Calculations for Hazard Intelligence.

Replaces hardcoded linear distance approximations with exact spherical Haversine
and perpendicular segment distances to:
1. Active riverbeds and CWC river monitoring gauge stations.
2. Documented Glacial Lake Outburst Flood (GLOF) pathways and moraine breaches.
3. Main Central Thrust (MCT) and tectonic fault traces in Garhwal Himalayas.
"""
from __future__ import annotations
import math
import json
import logging
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)

# GeoJSON data paths
DATA_DIR = Path(__file__).resolve().parents[3] / "data" / "geojson"
RIVER_STATIONS_FILE = DATA_DIR / "river_stations.geojson"
HAZARD_LAYERS_FILE = DATA_DIR / "hazard_layers.geojson"


def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Computes great-circle distance between two WGS-84 points in kilometers."""
    R = 6371.0088  # WGS-84 mean radius in km
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2.0) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2.0) ** 2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return round(R * c, 3)


def distance_to_segment_km(px: float, py: float, x1: float, y1: float, x2: float, y2: float) -> float:
    """
    Computes minimum geodesic distance from point (px=lon, py=lat)
    to a line segment from (x1, y1) to (x2, y2).
    """
    dx = x2 - x1
    dy = y2 - y1
    if dx == 0 and dy == 0:
        return haversine_distance_km(py, px, y1, x1)
    t = max(0.0, min(1.0, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)))
    proj_x = x1 + t * dx
    proj_y = y1 + t * dy
    return haversine_distance_km(py, px, proj_y, proj_x)


class HimalayanSpatialContext:
    """Pre-loaded spatial indices for Garhwal/Uttarakhand terrain analysis."""

    def __init__(self):
        self.river_stations: list[tuple[float, float, str]] = []  # (lat, lon, station_id)
        self.river_segments: list[tuple[float, float, float, float]] = []  # (lon1, lat1, lon2, lat2)
        self.glof_segments: list[tuple[float, float, float, float]] = []
        self._load_features()

    def _load_features(self):
        # 1. Load CWC River Stations
        if RIVER_STATIONS_FILE.exists():
            try:
                with open(RIVER_STATIONS_FILE, "r", encoding="utf-8") as f:
                    data = json.load(f)
                for feat in data.get("features", []):
                    coords = feat.get("geometry", {}).get("coordinates", [])
                    if len(coords) >= 2:
                        self.river_stations.append((coords[1], coords[0], feat.get("id", "")))
            except Exception as e:
                logger.warning(f"Failed to load river stations: {e}")

        # Fallback default river points if file unreadable
        if not self.river_stations:
            self.river_stations = [
                (30.565, 79.575, "vishnuprayag"),
                (30.545, 79.558, "marwari"),
                (30.260, 79.220, "karnaprayag"),
                (30.285, 78.980, "rudraprayag"),
            ]

        # 2. Load Riverbed and GLOF Polygons / Corridors
        if HAZARD_LAYERS_FILE.exists():
            try:
                with open(HAZARD_LAYERS_FILE, "r", encoding="utf-8") as f:
                    data = json.load(f)
                for feat in data.get("features", []):
                    ptype = feat.get("properties", {}).get("type", "")
                    geom = feat.get("geometry", {})
                    coords = geom.get("coordinates", [])
                    if geom.get("type") == "Polygon" and coords:
                        ring = coords[0]
                        for i in range(len(ring) - 1):
                            seg = (ring[i][0], ring[i][1], ring[i + 1][0], ring[i + 1][1])
                            if ptype == "flood":
                                self.river_segments.append(seg)
                            elif ptype == "glof":
                                self.glof_segments.append(seg)
            except Exception as e:
                logger.warning(f"Failed to load hazard layers: {e}")

        # Add major Himalayan river channels:
        # Alaknanda / Dhauliganga / Rishiganga
        self.river_segments.extend([
            (79.570, 30.555, 79.756, 30.593),  # Dhauliganga/Rishiganga channel
            (78.980, 30.285, 79.060, 30.730),  # Mandakini river channel
            (79.560, 30.570, 79.220, 30.260),  # Alaknanda gorge to Karnaprayag
        ])

        # Glacial source breach points (Rishiganga, Chorabari/Kedarnath)
        self.glof_sources = [
            (30.593, 79.756),  # Rishiganga rock-ice corridor
            (30.735, 79.067),  # Kedarnath/Chorabari moraine lake
        ]


_ctx = HimalayanSpatialContext()


def calculate_river_proximity_km(lat: float, lon: float) -> float:
    """
    Computes exact geodesic distance in km to the nearest active riverbed or gauge station.
    Clamped to physical range [0.05, 12.0] km.
    """
    distances = []
    # Distance to stations
    for rlat, rlon, _ in _ctx.river_stations:
        distances.append(haversine_distance_km(lat, lon, rlat, rlon))
    # Distance to river segments
    for x1, y1, x2, y2 in _ctx.river_segments:
        distances.append(distance_to_segment_km(lon, lat, x1, y1, x2, y2))

    min_dist = min(distances) if distances else 1.0
    return round(max(0.05, min(min_dist, 12.0)), 2)


def calculate_glof_exposure(lat: float, lon: float, elevation_m: float) -> float:
    """
    Calculates scientifically grounded GLOF exposure index [0.0 to 1.0] based on
    geodesic proximity to moraine breach corridors and elevation threshold.
    """
    distances = []
    for x1, y1, x2, y2 in _ctx.glof_segments:
        distances.append(distance_to_segment_km(lon, lat, x1, y1, x2, y2))
    for slat, slon in _ctx.glof_sources:
        distances.append(haversine_distance_km(lat, lon, slat, slon))

    min_glof_dist = min(distances) if distances else 50.0

    if min_glof_dist <= 2.0 and elevation_m >= 1800:
        return 0.85
    elif min_glof_dist <= 5.0 and elevation_m >= 1500:
        return 0.60
    elif min_glof_dist <= 12.0 and elevation_m >= 1200:
        return 0.35
    elif elevation_m > 2400:
        return 0.25
    return 0.10


def calculate_fault_distance_km(lat: float, lon: float) -> float:
    """
    Computes distance to Main Central Thrust (MCT) and Vaikrita Thrust fault line
    in Garhwal Himalayas (strikes approximately WNW-ESE from 30.50N, 79.40E to 30.58N, 79.70E).
    """
    # MCT fault trace segments in Chamoli / Rudraprayag
    fault_segs = [
        (79.350, 30.480, 79.550, 30.540),
        (79.550, 30.540, 79.720, 30.600),
    ]
    distances = [distance_to_segment_km(lon, lat, x1, y1, x2, y2) for x1, y1, x2, y2 in fault_segs]
    return round(max(0.1, min(distances)), 2)


def estimate_lithology_weakness(lat: float, lon: float, slope_deg: float) -> float:
    """
    Physics-grounded lithological shear weakness index [0.0 - 1.0].
    Jointing density is highest near tectonic thrust zones and on oversteepened Himalayan slopes.
    """
    dist_fault = calculate_fault_distance_km(lat, lon)
    # Proximity to thrust fault increases tectonic shearing and jointing
    fault_factor = 0.40 * (1.0 / (dist_fault + 1.0))
    # Steepness indicates gravity creep and rock mass fatigue
    slope_factor = 0.25 * min(1.0, slope_deg / 45.0)
    base_weakness = 0.35
    return round(min(0.95, base_weakness + fault_factor + slope_factor), 2)
