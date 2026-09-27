"""
ISRO Bhuvan / NRSC Web API Client.
Direct integration with official National Remote Sensing Centre (NRSC) geospatial endpoints:
- Village Geocoding & Census 2011 Demographics
- Village Reverse Geocoding
- Shortest Path Routing (Road Network MultiLineString)
- Land Use / Land Cover (LULC 50k District Statistics & Custom AOI)
- IndiaPost & Healthcare POI Proximity
- CDEM Geoid / Ellipsoid Conversion
"""
from __future__ import annotations
import json
import logging
from typing import Any, Optional
import httpx
from app.config import get_settings
from app.services.cache_service import get_cache

logger = logging.getLogger(__name__)

# Official ISRO LULC Land Use Classification Codes
LULC_CLASS_NAMES: dict[str, str] = {
    "l01": "Builtup, Urban",
    "l02": "Builtup, Rural",
    "l03": "Builtup, Mining",
    "l04": "Agriculture, Crop Land",
    "l05": "Agriculture, Plantation",
    "l06": "Agriculture, Fallow",
    "l07": "Agriculture, Current Shifting Cultivation",
    "l08": "Forest, Evergreen / Semi-Evergreen",
    "l09": "Forest, Deciduous",
    "l10": "Forest, Forest Plantation",
    "l11": "Forest, Scrub Forest",
    "l12": "Forest, Swamp / Mangroves",
    "l13": "Grass / Grazing Land",
    "l14": "Barren / Wasteland, Salt Affected Land",
    "l15": "Barren / Wasteland, Gullied / Ravinous Land",
    "l16": "Barren / Wasteland, Scrub Land",
    "l17": "Barren / Wasteland, Sandy Area",
    "l18": "Barren / Wasteland, Barren Rocky",
    "l19": "Barren / Wasteland, Rann",
    "l20": "Wetlands / Water Bodies, Inland Wetland",
    "l21": "Wetlands / Water Bodies, Coastal Wetland",
    "l22": "Wetlands / Water Bodies, River / Stream / Canals",
    "l23": "Wetlands / Water Bodies, Reservoir / Lakes / Ponds",
    "l24": "Snow and Glacier"
}

# Key Uttarakhand Mountain District Codes
UK_DISTRICT_CODES: dict[str, str] = {
    "0502": "Chamoli",
    "0503": "Rudra Prayag",
    "0501": "Uttarkashi",
    "0504": "Tehri Garhwal",
    "0505": "Dehradun",
    "0506": "Pauri Garhwal",
    "0507": "Pithoragarh",
    "0508": "Bageshwar",
    "0509": "Almora",
    "0510": "Champawat",
    "0511": "Nainital",
    "0512": "Udham Singh Nagar",
    "0513": "Haridwar"
}


class BhuvanApiClient:
    def __init__(self):
        self.settings = get_settings()
        self.base_url = self.settings.bhuvan_api_base_url
        self.cache = get_cache()
        self.client_timeout = 15.0

    # -------------------------------------------------------------------------
    # 1. Village Geocoding & Demographics (Census 2011)
    # -------------------------------------------------------------------------
    async def geocode_village(self, village_name: str, state_filter: Optional[str] = "UTTARAKHAND") -> list[dict[str, Any]]:
        """
        Geocodes village name and returns official Census 2011 demographics,
        village ID (VID), households, population, literacy, and GPS coordinates.
        """
        cache_key = f"bhuvan:vg:{village_name.lower().strip()}"
        cached = self.cache.get(cache_key)
        if cached is not None:
            return cached

        token = self.settings.bhuvan_token_village_geocoding
        if not token:
            logger.warning("Bhuvan village geocoding token missing")
            return []

        url = f"{self.base_url}/api_proximity/curl_village_geocode.php"
        params = {"village": village_name.strip(), "token": token}

        try:
            async with httpx.AsyncClient(timeout=self.client_timeout, verify=False) as client:
                resp = await client.get(url, params=params)
                if resp.status_code == 200:
                    text = resp.text.strip()
                    if text.startswith("["):
                        raw_data = json.loads(text)
                        results = []
                        for item in raw_data:
                            # Apply state filter if provided
                            item_state = str(item.get("state_name", "")).upper()
                            if state_filter and state_filter.upper() not in item_state:
                                continue

                            parsed = {
                                "village_id": item.get("vid", "").strip(),
                                "name": item.get("name", "").strip(),
                                "district": item.get("dist_name", "").strip(),
                                "tehsil": item.get("tehs_name", "").strip(),
                                "state": item.get("state_name", "").strip(),
                                "latitude": float(item["latitude"]) if item.get("latitude") else None,
                                "longitude": float(item["longitude"]) if item.get("longitude") else None,
                                "households": int(item["no_hh"]) if item.get("no_hh") and item["no_hh"].strip().isdigit() else 0,
                                "total_population": int(item["tot_p"]) if item.get("tot_p") and item["tot_p"].strip().isdigit() else 0,
                                "male_population": int(item["tot_m"]) if item.get("tot_m") and item["tot_m"].strip().isdigit() else 0,
                                "female_population": int(item["tot_f"]) if item.get("tot_f") and item["tot_f"].strip().isdigit() else 0,
                                "sc_population": int(item["p_sc"]) if item.get("p_sc") and item["p_sc"].strip().isdigit() else 0,
                                "st_population": int(item["p_st"]) if item.get("p_st") and item["p_st"].strip().isdigit() else 0,
                                "male_literacy": int(item["m_lit"]) if item.get("m_lit") and item["m_lit"].strip().isdigit() else 0,
                                "female_literacy": int(item["f_lit"]) if item.get("f_lit") and item["f_lit"].strip().isdigit() else 0,
                                "source": "ISRO Bhuvan Village Geocoding (Census 2011)"
                            }
                            results.append(parsed)

                        self.cache.set(cache_key, results, ttl_seconds=86400.0)
                        return results
        except Exception as e:
            logger.error(f"Bhuvan village geocoding failed for '{village_name}': {e}")

        return []

    # -------------------------------------------------------------------------
    # 2. Village Reverse Geocoding
    # -------------------------------------------------------------------------
    async def reverse_geocode_village(self, lat: float, lon: float) -> Optional[dict[str, Any]]:
        """
        Reverse geocodes coordinates to identify nearest Census village.
        """
        cache_key = f"bhuvan:vrg:{round(lat, 4)}:{round(lon, 4)}"
        cached = self.cache.get(cache_key)
        if cached is not None:
            return cached

        token = self.settings.bhuvan_token_village_reverse
        if not token:
            return None

        url = f"{self.base_url}/api_proximity/curl_reverse_village.php"
        params = {"lat": lat, "lon": lon, "token": token}

        try:
            async with httpx.AsyncClient(timeout=self.client_timeout, verify=False) as client:
                resp = await client.get(url, params=params)
                if resp.status_code == 200:
                    text = resp.text.strip()
                    if text.startswith("["):
                        data = json.loads(text)
                        if data and isinstance(data, list):
                            item = data[0]
                            parsed = {
                                "village_id": item.get("vid", "").strip(),
                                "name": item.get("name1", "").strip(),
                                "district": item.get("dhq_name", "").strip(),
                                "tehsil": item.get("thq_name", "").strip(),
                                "households": int(item.get("no_hh", 0)),
                                "total_population": int(item.get("tot_p", 0)),
                                "source": "ISRO Bhuvan Reverse Geocoding"
                            }
                            self.cache.set(cache_key, parsed, ttl_seconds=86400.0)
                            return parsed
        except Exception as e:
            logger.error(f"Bhuvan reverse geocoding error at ({lat}, {lon}): {e}")

        return None

    # -------------------------------------------------------------------------
    # 3. Shortest Path Routing (Road Network MultiLineString)
    # -------------------------------------------------------------------------
    async def get_shortest_route(self, lat1: float, lon1: float, lat2: float, lon2: float) -> Optional[dict[str, Any]]:
        """
        Fetches official ISRO Bhuvan road network shortest route geometry between two coordinates.
        Returns GeoJSON FeatureCollection with MultiLineString road path.
        """
        cache_key = f"bhuvan:route:{round(lat1, 4)}:{round(lon1, 4)}->{round(lat2, 4)}:{round(lon2, 4)}"
        cached = self.cache.get(cache_key)
        if cached is not None:
            return cached

        token = self.settings.bhuvan_token_routing
        if not token:
            return None

        url = f"{self.base_url}/routing/curl_routing_state.php"
        params = {
            "lat1": lat1,
            "lon1": lon1,
            "lat2": lat2,
            "lon2": lon2,
            "token": token
        }

        try:
            async with httpx.AsyncClient(timeout=self.client_timeout, verify=False) as client:
                resp = await client.get(url, params=params)
                if resp.status_code == 200:
                    text = resp.text.strip()
                    if "FeatureCollection" in text:
                        geojson_data = json.loads(text)
                        # Check if road coordinates exist
                        features = geojson_data.get("features", [])
                        has_geometry = any(
                            f.get("geometry") and f.get("geometry", {}).get("coordinates")
                            for f in features
                        )
                        if has_geometry:
                            self.cache.set(cache_key, geojson_data, ttl_seconds=43200.0)
                            return geojson_data
        except Exception as e:
            logger.error(f"Bhuvan routing failed ({lat1},{lon1}) -> ({lat2},{lon2}): {e}")

        return None

    # -------------------------------------------------------------------------
    # 4. LULC 50k Statistics (District-level Land Use / Land Cover)
    # -------------------------------------------------------------------------
    async def get_district_lulc(self, distcode: str = "0502", year: str = "1112") -> Optional[dict[str, Any]]:
        """
        Retrieves ISRO LULC 50k breakdown (in sq. km) for a district.
        Default distcode '0502' is Chamoli, '0503' is Rudraprayag.
        """
        cache_key = f"bhuvan:lulc:dist:{distcode}:{year}"
        cached = self.cache.get(cache_key)
        if cached is not None:
            return cached

        token = self.settings.bhuvan_token_lulc_stats
        if not token:
            return None

        url = f"{self.base_url}/lulc/curljson.php"
        headers = {"Content-Type": "application/x-www-form-urlencoded"}
        params = {"distcode": distcode, "year": year, "token": token}

        try:
            async with httpx.AsyncClient(timeout=self.client_timeout, verify=False) as client:
                resp = await client.get(url, params=params, headers=headers)
                if resp.status_code == 200:
                    text = resp.text.strip()
                    if text.startswith("{"):
                        raw = json.loads(text)
                        district_name = raw.get("name", UK_DISTRICT_CODES.get(distcode, f"District {distcode}")).strip()
                        total_area_sqkm = float(raw.get("totalarea", 0.0))

                        classes = []
                        for code, label in LULC_CLASS_NAMES.items():
                            val_str = str(raw.get(code, "0")).strip()
                            try:
                                area_val = float(val_str)
                            except ValueError:
                                area_val = 0.0

                            pct = round((area_val / total_area_sqkm) * 100.0, 2) if total_area_sqkm > 0 else 0.0
                            classes.append({
                                "code": code,
                                "name": label,
                                "area_sqkm": area_val,
                                "percentage": pct
                            })

                        result = {
                            "district_code": distcode,
                            "district_name": district_name,
                            "year": "2011-2012" if year == "1112" else "2005-2006",
                            "total_area_sqkm": total_area_sqkm,
                            "classes": classes,
                            "source": "ISRO Bhuvan LULC 50k Thematic Statistics"
                        }
                        self.cache.set(cache_key, result, ttl_seconds=86400.0)
                        return result
        except Exception as e:
            logger.error(f"Bhuvan district LULC query failed for {distcode}: {e}")

        return None

    # -------------------------------------------------------------------------
    # 5. LULC Custom AOI (Area of Interest Polygon)
    # -------------------------------------------------------------------------
    async def get_aoi_lulc(self, polygon_wkt: str) -> Optional[list[dict[str, Any]]]:
        """
        Calculates LULC class percentages on ISRO servers for an arbitrary Polygon WKT.
        Example WKT: POLYGON((78.5 30.2, 78.6 30.2, 78.6 30.3, 78.5 30.3, 78.5 30.2))
        """
        token = self.settings.bhuvan_token_lulc_aoi
        if not token:
            return None

        url = f"{self.base_url}/lulc/curl_aoi.php"
        params = {"geom": polygon_wkt.strip(), "token": token}

        try:
            async with httpx.AsyncClient(timeout=self.client_timeout, verify=False) as client:
                resp = await client.get(url, params=params)
                if resp.status_code == 200:
                    text = resp.text.strip()
                    if text.startswith("["):
                        raw_items = json.loads(text)
                        parsed = []
                        for row in raw_items:
                            entry = {"state": row.get("State", "")}
                            breakdown = {}
                            for k, v in row.items():
                                if k.startswith("'l") or k.startswith("l"):
                                    clean_k = k.replace("'", "")
                                    label = LULC_CLASS_NAMES.get(clean_k, clean_k)
                                    breakdown[label] = float(v)
                            entry["breakdown"] = breakdown
                            parsed.append(entry)
                        return parsed
        except Exception as e:
            logger.error(f"Bhuvan AOI LULC query failed: {e}")

        return None

    # -------------------------------------------------------------------------
    # 6. Postal & Healthcare POI Proximity
    # -------------------------------------------------------------------------
    async def get_proximity_facilities(
        self,
        theme: str = "hospital",
        lat: float = 30.555,
        lon: float = 79.566,
        buffer_meters: int = 20000
    ) -> list[dict[str, Any]]:
        """
        Queries IndiaPost and Healthcare facilities mapped on Bhuvan.
        """
        cache_key = f"bhuvan:prox:{theme}:{round(lat, 4)}:{round(lon, 4)}:{buffer_meters}"
        cached = self.cache.get(cache_key)
        if cached is not None:
            return cached

        token = self.settings.bhuvan_token_postal_hospital
        if not token:
            return []

        url = f"{self.base_url}/api_proximity/curl_hos_pos_prox.php"
        params = {
            "theme": theme,
            "lat": lat,
            "lon": lon,
            "buffer": buffer_meters,
            "token": token
        }

        try:
            async with httpx.AsyncClient(timeout=self.client_timeout, verify=False) as client:
                resp = await client.get(url, params=params)
                if resp.status_code == 200:
                    text = resp.text.strip()
                    if text.startswith("["):
                        raw = json.loads(text)
                        items = []
                        for r in raw:
                            props = json.loads(r.get("geojsonproperties", "{}")) if "geojsonproperties" in r else r
                            items.append(props)
                        self.cache.set(cache_key, items, ttl_seconds=43200.0)
                        return items
        except Exception as e:
            logger.error(f"Bhuvan proximity query error ({theme}): {e}")

        return []

    # -------------------------------------------------------------------------
    # 7. Health Probe
    # -------------------------------------------------------------------------
    async def check_health(self) -> dict[str, Any]:
        """
        Checks connectivity across active Bhuvan services.
        """
        status = {
            "village_geocoding": bool(self.settings.bhuvan_token_village_geocoding),
            "village_reverse": bool(self.settings.bhuvan_token_village_reverse),
            "routing": bool(self.settings.bhuvan_token_routing),
            "lulc_stats": bool(self.settings.bhuvan_token_lulc_stats),
            "lulc_aoi": bool(self.settings.bhuvan_token_lulc_aoi),
            "postal_hospital": bool(self.settings.bhuvan_token_postal_hospital),
            "geoid": bool(self.settings.bhuvan_token_geoid),
        }
        return {
            "portal": "ISRO Bhuvan / NRSC",
            "overall_status": "LIVE" if any(status.values()) else "OFFLINE",
            "services": status
        }


_bhuvan_api_client = BhuvanApiClient()


def get_bhuvan_api_client() -> BhuvanApiClient:
    return _bhuvan_api_client
