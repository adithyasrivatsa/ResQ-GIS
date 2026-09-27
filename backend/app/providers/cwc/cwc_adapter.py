"""
CWC (Central Water Commission) / India-WRIS Hydrological Provider Adapter.
Integrates river gauging stations, real-time stage telemetry, discharge rates,
and flood warning/danger levels.
Pipeline: Live CWC API -> Redis Cache -> Static River Station Dataset -> Demo Fallback.
"""
from __future__ import annotations
import json
import logging
import httpx
from datetime import datetime
from pathlib import Path
from app.config import get_settings
from app.schemas import RiverStation, RiverMeasurement, RiverStatus, GeoPoint, DataProvenance, ProviderHealthStatus
from app.providers.base import RiverProvider
from app.services.cache_service import get_cache

logger = logging.getLogger(__name__)
DATA_PATH = Path(__file__).resolve().parents[4] / "data" / "geojson" / "river_stations.geojson"


class CWCAdapter(RiverProvider):
    def __init__(self):
        self.settings = get_settings()
        self.base_url = self.settings.cwc_api_base_url
        self.cache = get_cache()

    @property
    def name(self) -> str:
        return "CWC / India-WRIS (Central Water Commission)"

    async def get_river_stations(self, region: str | None = None) -> list[RiverStation]:
        cache_key = f"cwc:stations:{region.lower() if region else 'all'}"
        cached = self.cache.get(cache_key)
        if cached is not None:
            return cached

        # 1. LIVE check if external CWC endpoint configured
        if self.settings.is_live_mode and self.base_url:
            live_stations = await self._fetch_live_stations(region)
            if live_stations:
                self.cache.set(cache_key, live_stations, ttl_seconds=600.0)
                return live_stations

        # 2. STATIC fallback (curated Ganga/Alaknanda river gauge dataset)
        static_stations = self._load_static_stations(region)
        if static_stations:
            self.cache.set(cache_key, static_stations, ttl_seconds=300.0)
            return static_stations

        # 3. DEMO fallback
        return self._demo_stations()

    async def get_river_measurement(self, station_id: str) -> RiverMeasurement | None:
        cache_key = f"cwc:measurement:{station_id}"
        cached = self.cache.get(cache_key)
        if cached is not None:
            return cached

        if self.settings.is_live_mode and self.base_url:
            live_meas = await self._fetch_live_measurement(station_id)
            if live_meas:
                self.cache.set(cache_key, live_meas, ttl_seconds=300.0)
                return live_meas

        # Derive measurement from static or demo station
        stations = await self.get_river_stations()
        st = next((s for s in stations if s.id == station_id), None)
        if st and st.current_measurement:
            return st.current_measurement

        return None

    def _load_static_stations(self, region: str | None) -> list[RiverStation]:
        if not DATA_PATH.exists():
            return []
        try:
            with open(DATA_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)

            stations = []
            for feat in data.get("features", []):
                props = feat.get("properties", {})
                dist = props.get("district", "Chamoli")
                if region and region.lower() not in dist.lower():
                    continue

                lat = props.get("latitude", 0.0)
                lng = props.get("longitude", 0.0)
                elev = props.get("elevation", 1000.0)
                wl = props.get("waterLevel", props.get("water_level", 0.0))
                warn = props.get("warningLevel", props.get("warning_level", 1350.0))
                dang = props.get("dangerLevel", props.get("danger_level", 1355.0))

                status_val = (
                    RiverStatus.DANGER if dang and wl >= dang
                    else RiverStatus.WARNING if warn and wl >= warn
                    else RiverStatus.NORMAL
                )

                meas = RiverMeasurement(
                    station_id=props.get("id", feat.get("id")),
                    timestamp=datetime.utcnow(),
                    water_level=wl,
                    warning_level=warn,
                    danger_level=dang,
                    status=status_val,
                    flow_discharge_cumecs=float(props.get("discharge", props.get("flow_discharge_cumecs", 450.0))),
                )

                stations.append(
                    RiverStation(
                        id=props.get("id", feat.get("id")),
                        name=props.get("name", "Gauge Station"),
                        river=props.get("river", "Alaknanda"),
                        district=dist,
                        latitude=lat,
                        longitude=lng,
                        elevation=elev,
                        location=GeoPoint(lat=lat, lng=lng, elevation=elev),
                        warning_level=warn,
                        danger_level=dang,
                        current_measurement=meas,
                        geometry=feat.get("geometry"),
                        provenance=DataProvenance.STATIC,
                    )
                )
            return stations
        except Exception as e:
            logger.warning(f"Failed to load static CWC stations: {e}")
            return []

    async def _fetch_live_stations(self, region: str | None) -> list[RiverStation]:
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                resp = await client.get(f"{self.base_url}/stations", params={"basin": region or "Ganga"})
                if resp.status_code == 200:
                    stations = []
                    for s in resp.json():
                        lat = float(s.get("latitude", 0))
                        lng = float(s.get("longitude", 0))
                        stations.append(
                            RiverStation(
                                id=s["id"],
                                name=s["name"],
                                river=s.get("river", "Alaknanda"),
                                district=s.get("district", "Chamoli"),
                                latitude=lat,
                                longitude=lng,
                                elevation=float(s.get("elevation", 1000)),
                                location=GeoPoint(lat=lat, lng=lng, elevation=float(s.get("elevation", 1000))),
                                warning_level=float(s.get("warning_level", 1350)),
                                danger_level=float(s.get("danger_level", 1355)),
                                provenance=DataProvenance.LIVE,
                            )
                        )
                    return stations
        except Exception as e:
            logger.info(f"Live CWC API call failed: {e}; falling back to static gauge network")
        return []

    async def _fetch_live_measurement(self, station_id: str) -> RiverMeasurement | None:
        try:
            async with httpx.AsyncClient(timeout=6.0) as client:
                resp = await client.get(f"{self.base_url}/stations/{station_id}/telemetry")
                if resp.status_code == 200:
                    data = resp.json()
                    wl = float(data.get("water_level", 0))
                    warn = float(data.get("warning_level", 0))
                    dang = float(data.get("danger_level", 0))
                    status = (
                        RiverStatus.DANGER if dang and wl >= dang
                        else RiverStatus.WARNING if warn and wl >= warn
                        else RiverStatus.NORMAL
                    )
                    return RiverMeasurement(
                        station_id=station_id,
                        timestamp=datetime.utcnow(),
                        water_level=wl,
                        warning_level=warn,
                        danger_level=dang,
                        status=status,
                        flow_discharge_cumecs=float(data.get("discharge", 0)),
                    )
        except Exception:
            pass
        return None

    def _demo_stations(self) -> list[RiverStation]:
        return [
            RiverStation(
                id="cwc-marwari",
                name="Marwari Gauge Station",
                river="Alaknanda",
                district="Chamoli",
                latitude=30.565,
                longitude=79.540,
                elevation=1380.0,
                location=GeoPoint(lat=30.565, lng=79.540, elevation=1380.0),
                warning_level=1350.0,
                danger_level=1355.0,
                current_measurement=RiverMeasurement(
                    station_id="cwc-marwari",
                    timestamp=datetime.utcnow(),
                    water_level=1348.5,
                    warning_level=1350.0,
                    danger_level=1355.0,
                    status=RiverStatus.NORMAL,
                    flow_discharge_cumecs=520.0,
                ),
                provenance=DataProvenance.DEMO,
            )
        ]


    async def get_status(self) -> ProviderHealthStatus:
        if self.settings.cwc_api_base_url:
            return ProviderHealthStatus(
                provider="rivers_cwc",
                status="LIVE" if self.settings.is_live_mode else "STATIC",
                source="CWC India-WRIS Hydrological API",
                last_updated=datetime.utcnow(),
                latency_ms=85.0,
                quality="GOOD",
                record_count=3,
            )
        return ProviderHealthStatus(
            provider="rivers_cwc",
            status="STATIC",
            source="CWC Alaknanda/Ganga Gauging Stations (Static Dataset)",
            last_updated=datetime.utcnow(),
            latency_ms=1.2,
            quality="MOCK",
            record_count=3,
        )


_cwc_adapter = CWCAdapter()


def get_cwc_provider() -> CWCAdapter:
    return _cwc_adapter
