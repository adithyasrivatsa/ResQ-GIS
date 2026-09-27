"""
PostGIS Spatial SQLAlchemy Models.
Stores Habitations, Relocation Sites, Hazard Polygons, and River Gauge Stations.
Resilient to environments where GeoAlchemy2 / psycopg2 is optional or containerized.
"""
from __future__ import annotations
from sqlalchemy import Column, String, Integer, Float, Boolean, JSON, Index
from app.database.session import Base

try:
    from geoalchemy2 import Geometry
    HAS_GEOALCHEMY = True
except ImportError:
    HAS_GEOALCHEMY = False
    Geometry = None


class HabitationModel(Base):
    __tablename__ = "habitations"

    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(128), nullable=False, index=True)
    village = Column(String(128), nullable=True)
    district = Column(String(64), nullable=False, index=True)
    state = Column(String(64), default="Uttarakhand")

    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    elevation = Column(Float, nullable=True)

    population = Column(Integer, default=0)
    households = Column(Integer, default=0)
    risk_score = Column(Float, default=0.0)
    risk_level = Column(String(16), default="LOW")

    vulnerability = Column(JSON, nullable=True)
    vulnerability_index = Column(JSON, nullable=True)
    hazard_exposure = Column(JSON, nullable=True)
    recommended_action = Column(String(256), default="")
    nearest_relocation_site = Column(String(64), nullable=True)

    if HAS_GEOALCHEMY:
        geom = Column(Geometry("POINT", srid=4326), nullable=False)
        __table_args__ = (
            Index("idx_habitations_geom", "geom", postgresql_using="gist"),
        )
    else:
        geom = Column(String(256), nullable=True)


class RelocationSiteModel(Base):
    __tablename__ = "relocation_sites"

    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(128), nullable=False, index=True)
    district = Column(String(64), nullable=False, index=True)
    state = Column(String(64), default="Uttarakhand")

    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    elevation = Column(Float, nullable=True)

    usable_area_sqm = Column(Float, nullable=True)
    emergency_capacity = Column(Integer, default=0)
    capacity = Column(Integer, default=0)
    slope = Column(Float, nullable=True)
    slope_grade = Column(String(32), default="Gentle")

    road_access = Column(Boolean, default=True)
    drinking_water = Column(Boolean, default=True)
    electricity = Column(Boolean, default=True)
    medical_facility_nearby = Column(Boolean, default=True)
    distance_to_road_km = Column(Float, default=0.1)
    distance_to_medical_km = Column(Float, default=2.0)
    hazard_exposure = Column(Float, default=0.1)

    suitability = Column(String(16), default="HIGH")
    suitability_score = Column(Float, default=0.85)
    constraints = Column(JSON, nullable=True)

    if HAS_GEOALCHEMY:
        geom = Column(Geometry("POINT", srid=4326), nullable=False)
        __table_args__ = (
            Index("idx_relocation_sites_geom", "geom", postgresql_using="gist"),
        )
    else:
        geom = Column(String(256), nullable=True)


class HazardAreaModel(Base):
    __tablename__ = "hazard_areas"

    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(128), nullable=False)
    hazard_type = Column(String(32), nullable=False, index=True)
    severity = Column(String(16), default="orange")
    source = Column(String(128), default="GIS Study")
    description = Column(String(512), nullable=True)
    visible = Column(Boolean, default=True)

    if HAS_GEOALCHEMY:
        geom = Column(Geometry("GEOMETRY", srid=4326), nullable=False)
        __table_args__ = (
            Index("idx_hazard_areas_geom", "geom", postgresql_using="gist"),
        )
    else:
        geom = Column(String(512), nullable=True)


class RiverStationModel(Base):
    __tablename__ = "river_stations"

    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(128), nullable=False)
    river = Column(String(64), nullable=False, index=True)
    district = Column(String(64), nullable=False)

    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    elevation = Column(Float, nullable=True)

    warning_level = Column(Float, nullable=False)
    danger_level = Column(Float, nullable=False)
    water_level = Column(Float, nullable=True)
    status = Column(String(16), default="normal")

    if HAS_GEOALCHEMY:
        geom = Column(Geometry("POINT", srid=4326), nullable=False)
        __table_args__ = (
            Index("idx_river_stations_geom", "geom", postgresql_using="gist"),
        )
    else:
        geom = Column(String(256), nullable=True)
