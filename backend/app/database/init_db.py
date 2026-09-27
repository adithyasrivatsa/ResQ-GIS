"""
Database initialization and PostGIS seeding script.
Creates tables and seeds sample data from GeoJSON files when PostgreSQL is running.
"""
from __future__ import annotations
import json
import logging
from pathlib import Path
from sqlalchemy import text
from app.database.session import Base, _engine, _SessionLocal, check_db_connection
from app.models.spatial import HabitationModel, RelocationSiteModel, HazardAreaModel, RiverStationModel

logger = logging.getLogger(__name__)

DATA_DIR = Path(__file__).resolve().parents[3] / "data" / "geojson"


def init_database():
    """Initialize PostGIS tables and seed initial spatial data if database is connected."""
    if not check_db_connection() or _engine is None or _SessionLocal is None:
        logger.info("PostgreSQL + PostGIS not available. Operating in file-backed GeoJSON mode.")
        return False

    try:
        with _engine.connect() as conn:
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis;"))
            conn.commit()

        Base.metadata.create_all(bind=_engine)
        logger.info("PostGIS spatial tables verified/created successfully.")

        # Seed initial data if tables are empty
        with _SessionLocal() as session:
            count = session.query(HabitationModel).count()
            if count == 0:
                seed_spatial_data(session)

        return True
    except Exception as e:
        logger.warning(f"Database initialization encountered an error: {e}")
        return False


def seed_spatial_data(session):
    """Seed data from GeoJSON into PostGIS."""
    # 1. Seed Habitations
    hab_path = DATA_DIR / "habitations.geojson"
    if hab_path.exists():
        try:
            with open(hab_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            for feat in data.get("features", []):
                props = feat.get("properties", {})
                lat = props.get("latitude", 0.0)
                lng = props.get("longitude", 0.0)
                hab = HabitationModel(
                    id=props.get("id", feat.get("id")),
                    name=props.get("name", ""),
                    village=props.get("village"),
                    district=props.get("district", "Chamoli"),
                    state=props.get("state", "Uttarakhand"),
                    latitude=lat,
                    longitude=lng,
                    elevation=props.get("elevation"),
                    population=props.get("population", 0),
                    households=props.get("households", 0),
                    risk_score=props.get("riskScore", 0.0),
                    risk_level=props.get("riskLevel", "LOW"),
                    vulnerability=props.get("vulnerability"),
                    vulnerability_index=props.get("vulnerabilityIndex"),
                    hazard_exposure=props.get("hazardExposure"),
                    recommended_action=props.get("recommendedAction", ""),
                    nearest_relocation_site=props.get("nearestRelocationSite"),
                    geom=f"SRID=4326;POINT({lng} {lat})",
                )
                session.merge(hab)
            session.commit()
            logger.info("Seeded habitations into PostGIS.")
        except Exception as e:
            logger.warning(f"Failed to seed habitations: {e}")
            session.rollback()

    # 2. Seed Relocation Sites
    site_path = DATA_DIR / "relocation_sites.geojson"
    if site_path.exists():
        try:
            with open(site_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            for feat in data.get("features", []):
                props = feat.get("properties", {})
                lat = props.get("latitude", 0.0)
                lng = props.get("longitude", 0.0)
                site = RelocationSiteModel(
                    id=props.get("id", feat.get("id")),
                    name=props.get("name", ""),
                    district=props.get("district", "Chamoli"),
                    state=props.get("state", "Uttarakhand"),
                    latitude=lat,
                    longitude=lng,
                    elevation=props.get("elevation"),
                    usable_area_sqm=props.get("usableAreaSqM"),
                    emergency_capacity=props.get("emergencyCapacity", props.get("capacity", 5000)),
                    capacity=props.get("capacity", 5000),
                    slope=props.get("slope"),
                    slope_grade=props.get("slopeGrade", "Gentle"),
                    road_access=props.get("roadAccess", True),
                    drinking_water=props.get("drinkingWater", True),
                    electricity=props.get("electricity", True),
                    medical_facility_nearby=props.get("medicalFacilityNearby", True),
                    distance_to_road_km=props.get("distanceToRoadKm", 0.1),
                    distance_to_medical_km=props.get("distanceToMedicalKm", 2.0),
                    hazard_exposure=props.get("hazardExposure", 0.1),
                    suitability=props.get("suitability", "HIGH"),
                    suitability_score=props.get("suitabilityScore", 0.85),
                    constraints=props.get("constraints"),
                    geom=f"SRID=4326;POINT({lng} {lat})",
                )
                session.merge(site)
            session.commit()
            logger.info("Seeded relocation sites into PostGIS.")
        except Exception as e:
            logger.warning(f"Failed to seed relocation sites: {e}")
            session.rollback()

    # 3. Seed Hazard Areas
    haz_path = DATA_DIR / "hazard_layers.geojson"
    if haz_path.exists():
        try:
            with open(haz_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            for feat in data.get("features", []):
                props = feat.get("properties", {})
                geom = feat.get("geometry", {})
                coords = geom.get("coordinates", [[]])[0]
                wkt_poly = ""
                if coords:
                    poly_str = ", ".join(f"{c[0]} {c[1]}" for c in coords)
                    wkt_poly = f"SRID=4326;POLYGON(({poly_str}))"

                haz = HazardAreaModel(
                    id=props.get("id", feat.get("id")),
                    name=props.get("name", "Hazard Area"),
                    hazard_type=props.get("type", "landslide"),
                    severity=props.get("severity", "orange"),
                    source=props.get("source", "GIS Study"),
                    description=props.get("description"),
                    visible=props.get("visible", True),
                    geom=wkt_poly if wkt_poly else None,
                )
                session.merge(haz)
            session.commit()
            logger.info("Seeded hazard areas into PostGIS.")
        except Exception as e:
            logger.warning(f"Failed to seed hazard areas: {e}")
            session.rollback()

    # 4. Seed River Stations
    river_path = DATA_DIR / "river_stations.geojson"
    if river_path.exists():
        try:
            with open(river_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            for feat in data.get("features", []):
                props = feat.get("properties", {})
                lat = props.get("latitude", 0.0)
                lng = props.get("longitude", 0.0)
                rst = RiverStationModel(
                    id=props.get("stationId", props.get("id", feat.get("id"))),
                    name=props.get("name", ""),
                    river=props.get("river", "Alaknanda"),
                    district=props.get("district", "Chamoli"),
                    latitude=lat,
                    longitude=lng,
                    elevation=props.get("elevation"),
                    warning_level=props.get("warningLevel", 1350.0),
                    danger_level=props.get("dangerLevel", 1355.0),
                    water_level=props.get("waterLevel"),
                    status=props.get("status", "normal"),
                    geom=f"SRID=4326;POINT({lng} {lat})",
                )
                session.merge(rst)
            session.commit()
            logger.info("Seeded river stations into PostGIS.")
        except Exception as e:
            logger.warning(f"Failed to seed river stations: {e}")
            session.rollback()
