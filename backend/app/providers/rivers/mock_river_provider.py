"""
Mock River Provider.
Provides CWC river station telemetry from local GeoJSON.
"""
from __future__ import annotations
import json
from pathlib import Path
from datetime import datetime
from app.schemas import RiverStation, RiverMeasurement, RiverStatus, GeoPoint, DataProvenance
from app.providers.base import RiverProvider

DATA_PATH = Path(__file__).resolve().parents[4] / "data" / "geojson" / "river_stations.geojson"


class MockRiverProvider(RiverProvider):
    @property
    def name(self) -> str:
        return "Mock River Provider (Demo Mode)"

    def _load_stations_geojson(self) -> list[dict]:
        if DATA_PATH.exists():
            try:
                with open(DATA_PATH, "r", encoding="utf-8") as f:
                    fc = json.load(f)
                    return fc.get("features", [])
            except Exception:
                pass
        return []

    async def get_river_stations(self, region: str | None = None) -> list[RiverStation]:
        features = self._load_stations_geojson()
        stations = []
        for feat in features:
            props = feat.get("properties", {})
            dist = props.get("district", "")
            if region and region.lower() not in dist.lower():
                continue

            lat = props.get("latitude", 0.0)
            lng = props.get("longitude", 0.0)
            elev = props.get("elevation", 0.0)
            wl = props.get("waterLevel")
            warn = props.get("warningLevel", 1000.0)
            dang = props.get("dangerLevel", 1005.0)

            status = (
                RiverStatus.DANGER if wl and wl >= dang
                else RiverStatus.WARNING if wl and wl >= warn
                else RiverStatus.NORMAL
            )

            measurement = RiverMeasurement(
                station_id=props.get("stationId", feat.get("id")),
                timestamp=datetime.utcnow(),
                water_level=wl,
                warning_level=warn,
                danger_level=dang,
                status=status,
                flow_discharge_cumecs=props.get("flowDischargeCumecs"),
            )

            stations.append(
                RiverStation(
                    id=props.get("stationId", feat.get("id")),
                    name=props.get("name", "River Gauge"),
                    river=props.get("river", "Alaknanda"),
                    district=dist,
                    latitude=lat,
                    longitude=lng,
                    elevation=elev,
                    location=GeoPoint(lat=lat, lng=lng, elevation=elev),
                    warning_level=warn,
                    danger_level=dang,
                    current_measurement=measurement,
                    geometry=feat.get("geometry"),
                    provenance=DataProvenance.DEMO,
                )
            )
        return stations

    async def get_river_measurement(self, station_id: str) -> RiverMeasurement | None:
        stations = await self.get_river_stations()
        for s in stations:
            if s.id == station_id:
                return s.current_measurement
        return None
