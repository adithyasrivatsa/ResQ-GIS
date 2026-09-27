"""
ResQ-GIS Provider Adapter Base Interfaces.
Defines abstract contracts for external and local data providers.
"""
from __future__ import annotations
from abc import ABC, abstractmethod
from typing import Generic, TypeVar, Optional, Any
from app.schemas import (
    WeatherCurrent,
    WeatherForecastItem,
    DisasterAlert,
    RiverStation,
    RiverMeasurement,
    HabitationResponse,
    RelocationSiteResponse,
    HazardLayerResponse,
    ProviderHealthStatus,
)

TRaw = TypeVar("TRaw")
TValidated = TypeVar("TValidated")
TNormalized = TypeVar("TNormalized")


class BaseLifecycleProvider(ABC, Generic[TRaw, TValidated, TNormalized]):
    """
    Unified Lifecycle Contract for All ResQ-GIS Ingestion Adapters:
    fetch() -> validate() -> normalize() -> store()
    plus get_status() for live observability and provenance.
    """

    @property
    @abstractmethod
    def name(self) -> str:
        pass

    async def fetch(self, *args, **kwargs) -> TRaw:
        """Fetch raw payload from external API or local source."""
        raise NotImplementedError

    def validate(self, raw: TRaw) -> TValidated:
        """Validate raw external response structure."""
        return raw  # default passthrough

    def normalize(self, validated: TValidated) -> TNormalized:
        """Normalize into internal Pydantic schema."""
        return validated  # default passthrough

    async def store(self, normalized: TNormalized) -> bool:
        """Persist normalized data into PostGIS / Cache."""
        return True

    @abstractmethod
    async def get_status(self) -> ProviderHealthStatus:
        """Return real-time operational status, latency, and provenance."""
        pass


class WeatherProvider(ABC):
    """Abstract interface for weather information providers."""

    @property
    @abstractmethod
    def name(self) -> str:
        pass

    @abstractmethod
    async def get_current_weather(self, location: str) -> WeatherCurrent | None:
        """Fetch current meteorological telemetry for a district or coordinates."""
        pass

    @abstractmethod
    async def get_forecast(self, location: str) -> list[WeatherForecastItem]:
        """Fetch multi-day meteorological forecast."""
        pass


class AlertProvider(ABC):
    """Abstract interface for disaster and early warning alert providers."""

    @property
    @abstractmethod
    def name(self) -> str:
        pass

    @abstractmethod
    async def get_active_alerts(self, region: str | None = None) -> list[DisasterAlert]:
        """Fetch active multi-hazard alerts for a region."""
        pass


class RiverProvider(ABC):
    """Abstract interface for river gauge and hydrological monitoring providers."""

    @property
    @abstractmethod
    def name(self) -> str:
        pass

    @abstractmethod
    async def get_river_stations(self, region: str | None = None) -> list[RiverStation]:
        """Fetch hydrological monitoring stations for a river basin or district."""
        pass

    @abstractmethod
    async def get_river_measurement(self, station_id: str) -> RiverMeasurement | None:
        """Fetch real-time water level and discharge measurements for a gauge station."""
        pass


class GISProvider(ABC):
    """Abstract interface for geographic and spatial data providers."""

    @property
    @abstractmethod
    def name(self) -> str:
        pass

    @abstractmethod
    async def get_habitations(self, region: str | None = None) -> list[HabitationResponse]:
        """Fetch monitored habitations and settlements."""
        pass

    @abstractmethod
    async def get_relocation_sites(self, region: str | None = None) -> list[RelocationSiteResponse]:
        """Fetch candidate safe havens and relocation grounds."""
        pass

    @abstractmethod
    async def get_hazard_layers(self, region: str | None = None) -> list[HazardLayerResponse]:
        """Fetch hazard zone polygons and overlays."""
        pass


class OSMProvider(ABC):
    """Abstract interface for OpenStreetMap road and settlement context providers."""

    @property
    @abstractmethod
    def name(self) -> str:
        pass

    @abstractmethod
    async def get_road_network(self, region: str | None = None) -> list[any]:
        """Fetch evacuation road network and corridors."""
        pass

    @abstractmethod
    async def get_distance_to_road(self, lat: float, lng: float) -> float:
        """Calculate road proximity distance in kilometers."""
        pass


class TerrainProvider(ABC):
    """Abstract interface for digital elevation models and slope gradient analysis (e.g. Copernicus DEM)."""

    @property
    @abstractmethod
    def name(self) -> str:
        pass

    @abstractmethod
    async def get_elevation(self, lat: float, lng: float) -> float:
        """Fetch terrain elevation above sea level in meters."""
        pass

    @abstractmethod
    async def get_slope(self, lat: float, lng: float) -> any:
        """Calculate localized slope gradient (degrees and grade classification)."""
        pass


class BhuvanProvider(ABC):
    """Abstract interface for ISRO Bhuvan / NRSC geospatial and satellite layers."""

    @property
    @abstractmethod
    def name(self) -> str:
        pass

    @abstractmethod
    async def get_thematic_layers(self, region: str | None = None) -> list[HazardLayerResponse]:
        """Fetch Indian thematic geospatial layers (LULC, geomorphology, flood plains)."""
        pass


class LGDProvider(ABC):
    """Abstract interface for Local Government Directory (LGD) administrative boundaries and Census demographics."""

    @property
    @abstractmethod
    def name(self) -> str:
        pass

    @abstractmethod
    async def get_administrative_hierarchy(self, region: str | None = None) -> any:
        """Fetch Region -> State -> District -> Block -> Village administrative hierarchy."""
        pass


class GSIProvider(ABC):
    """Abstract interface for Geological Survey of India (GSI BhuKosh / NLSM) landslide hazard data."""

    @property
    @abstractmethod
    def name(self) -> str:
        pass

    @abstractmethod
    async def get_landslide_zones(self, region: str | None = None) -> list[HazardLayerResponse]:
        """Fetch National Landslide Susceptibility Mapping (NLSM) macro/meso zones."""
        pass


class SDMAProvider(ABC):
    """Abstract interface for State Disaster Management Authorities (e.g. USDMA)."""

    @property
    @abstractmethod
    def name(self) -> str:
        pass

    @abstractmethod
    async def get_state_advisories(self, state: str = "Uttarakhand") -> list[DisasterAlert]:
        """Fetch state-specific disaster mitigation bulletins and alerts."""
        pass


class IDRNProvider(ABC):
    """Abstract interface for India Disaster Resource Network (IDRN) / DEOC emergency resources."""

    @property
    @abstractmethod
    def name(self) -> str:
        pass

    @abstractmethod
    async def get_emergency_resources(self, district: str | None = None) -> list[any]:
        """Fetch rescue shelters, medical posts, equipment staging depots, and relief camps."""
        pass

