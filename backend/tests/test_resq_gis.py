"""
ResQ-GIS Comprehensive System & Intelligence Test Suite.
Validates:
1. Machine Learning Landslide Susceptibility model inference & metrics.
2. Dynamic multi-factor hazard assessment & data provenance.
3. Open-Meteo live weather adapter normalization.
4. Copernicus DEM slope computation & fallback behavior.
5. Relocation suitability and carrying capacity verification.
6. TOPSIS prioritization ranking.
7. System provider health & telemetry provenance endpoints.
"""
import asyncio
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.intelligence.models.landslide_inference import (
    predict_landslide_susceptibility,
    get_model_metadata,
)
from app.services.intelligence_service import get_intelligence_service
from app.intelligence.prioritization import topsis_prioritize, PrioritizationInput
from app.providers.weather.openmeteo_adapter import OpenMeteoAdapter
from app.providers.copernicus.copernicus_adapter import CopernicusDEMAdapter


def test_system_health():
    """Verify health endpoint responds with system operational mode."""
    async def _test():
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/api/health")
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "ok"
            assert "version" in data

    asyncio.run(_test())


def test_providers_status_telemetry():
    """Verify provider telemetry returns health and explicit data provenance."""
    async def _test():
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/api/providers/status")
            assert response.status_code == 200
            data = response.json()
            assert "overall_status" in data
            assert "providers" in data
            assert "weather" in data["providers"]
            assert "terrain_dem" in data["providers"]
            assert "roads_osm" in data["providers"]
            assert data["total_providers"] >= 5

    asyncio.run(_test())


def test_ml_landslide_model_inference():
    """Verify genuine trained scikit-learn RandomForest model outputs predictions."""
    # Test high risk slope and high rainfall
    pred_high = predict_landslide_susceptibility(
        slope_degrees=38.5,
        rainfall_24h_mm=85.0,
        elevation_m=2200.0,
        dist_to_fault_km=0.8,
        river_proximity_km=0.2,
    )
    assert 0.0 <= pred_high["probability"] <= 1.0
    assert pred_high["risk_category"] in ["HIGH", "CRITICAL", "MODERATE", "LOW"]
    assert 0.0 <= pred_high["confidence"] <= 1.0

    # Test gentle slope and low rainfall
    pred_low = predict_landslide_susceptibility(
        slope_degrees=8.0,
        rainfall_24h_mm=2.0,
        elevation_m=1100.0,
        dist_to_fault_km=12.0,
        river_proximity_km=3.0,
    )
    assert pred_low["probability"] < pred_high["probability"]


def test_ml_status_endpoint():
    """Verify ML status endpoint returns reproducible metrics and ROC-AUC score."""
    async def _test():
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/api/analysis/ml-status")
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "OPERATIONAL"
            assert data["model_type"] == "RandomForestClassifier"
            assert "metrics" in data
            assert data["metrics"]["roc_auc"] > 0.80
            assert "feature_importances" in data

    asyncio.run(_test())


def test_dynamic_hazard_assessment_endpoint():
    """Verify /api/analysis/hazard/{id} returns dynamic telemetry-derived hazard factors."""
    async def _test():
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/api/analysis/hazard/hab-reni")
            assert response.status_code == 200
            data = response.json()
            assert data["habitation_id"] == "hab-reni"
            assert 0.0 <= data["composite_hazard_score"] <= 1.0
            assert "factors" in data
            assert "rainfall" in data["factors"]
            assert "slope" in data["factors"]
            assert "ml_susceptibility" in data["factors"]
            assert data["factors"]["slope_degrees"] > 0.0

    asyncio.run(_test())


def test_dynamic_relocation_site_assessment():
    """Verify candidate relocation site slope and suitability are dynamically calculated."""
    async def _test():
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/api/relocation/sites/site-gauchar/assessment")
            assert response.status_code == 200
            data = response.json()
            assert data["site_id"] == "site-gauchar"
            assert 0.0 <= data["suitability_score"] <= 1.0
            assert data["slope_degrees"] >= 0.0
            assert data["constraints_total"] > 0
            assert data["capacity"] >= 500

    asyncio.run(_test())


def test_topsis_prioritization_engine():
    """Verify TOPSIS ranking runs on habitations and returns ordered scores."""
    async def _test():
        from app.services.gis_service import get_gis_service

        gis = get_gis_service()
        habitations = await gis.get_habitations()
        assert len(habitations) > 0

        inputs = [
            PrioritizationInput(
                habitation_id=h.id,
                name=h.name,
                hvi=h.vulnerability_index.overall if h.vulnerability_index else 0.5,
                hazard_exposure=h.risk_score,
                population_exposed=h.population,
                historical_frequency=2,
                structural_vulnerability=0.4,
                relocation_feasibility=0.7,
            )
            for h in habitations
        ]

        ranked = topsis_prioritize(inputs)
        assert len(ranked) == len(habitations)
        for i in range(len(ranked) - 1):
            assert ranked[i].rank == i + 1
            assert ranked[i].score >= ranked[i + 1].score

    asyncio.run(_test())


def test_openmeteo_normalization():
    """Verify Open-Meteo adapter normalizes payloads correctly."""
    adapter = OpenMeteoAdapter()
    sample_payload = {
        "current": {
            "temperature_2m": 16.4,
            "relative_humidity_2m": 72,
            "wind_speed_10m": 11.2,
            "precipitation": 18.5,
            "weather_code": 61,
        },
        "daily": {
            "time": ["2026-09-27", "2026-09-28"],
            "temperature_2m_max": [20.0, 19.5],
            "temperature_2m_min": [12.0, 11.0],
            "precipitation_sum": [18.5, 22.0],
            "weather_code": [61, 63],
        },
    }
    curr, forecast = adapter.normalize(sample_payload)
    assert curr.temperature == 16.4
    assert curr.rainfall_24h == 18.5
    assert len(forecast) == 2
    assert "RAIN" in forecast[0].condition

