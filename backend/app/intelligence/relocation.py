"""
Relocation site suitability scoring.
Evaluates candidate sites against multiple criteria.
"""
from __future__ import annotations
from dataclasses import dataclass


@dataclass
class RelocationInput:
    slope_degree: float = 0.0
    hazard_exposure: float = 0.0       # 0-1
    distance_from_affected: float = 0.0 # km
    road_accessibility: float = 0.0     # 0-1
    water_availability: float = 0.0     # 0-1
    infrastructure_proximity: float = 0.0  # 0-1
    usable_land_area: float = 0.0       # hectares
    carrying_capacity: int = 0


@dataclass
class RelocationScore:
    suitability: float  # 0-1
    level: str          # HIGH, MODERATE, LOW
    capacity: int
    constraints_met: int
    constraints_total: int
    details: dict[str, float]


def compute_relocation_suitability(inputs: RelocationInput) -> RelocationScore:
    """
    Score a candidate relocation site.

    Criteria weights:
      - Slope suitability: 0.20
      - Hazard safety: 0.25
      - Accessibility: 0.20
      - Water: 0.15
      - Infrastructure: 0.10
      - Capacity: 0.10
    """
    # Slope score (lower is better, 0-5° ideal)
    if inputs.slope_degree <= 5:
        slope_score = 1.0
    elif inputs.slope_degree <= 10:
        slope_score = 0.7
    elif inputs.slope_degree <= 15:
        slope_score = 0.4
    else:
        slope_score = 0.1

    # Hazard safety (inverse of exposure)
    hazard_safety = 1.0 - inputs.hazard_exposure

    # Distance penalty (ideal: 2-10 km, too far is bad)
    if 2 <= inputs.distance_from_affected <= 10:
        distance_score = 1.0
    elif inputs.distance_from_affected < 2:
        distance_score = 0.5  # too close to affected area
    elif inputs.distance_from_affected <= 25:
        distance_score = 0.6
    else:
        distance_score = 0.3

    # Capacity score
    if inputs.carrying_capacity >= 5000:
        capacity_score = 1.0
    elif inputs.carrying_capacity >= 2000:
        capacity_score = 0.7
    elif inputs.carrying_capacity >= 500:
        capacity_score = 0.4
    else:
        capacity_score = 0.1

    details = {
        "slope": round(slope_score, 2),
        "hazard_safety": round(hazard_safety, 2),
        "road_access": round(inputs.road_accessibility, 2),
        "water": round(inputs.water_availability, 2),
        "infrastructure": round(inputs.infrastructure_proximity, 2),
        "capacity": round(capacity_score, 2),
    }

    # Weighted composite
    suitability = (
        0.20 * slope_score +
        0.25 * hazard_safety +
        0.20 * inputs.road_accessibility +
        0.15 * inputs.water_availability +
        0.10 * inputs.infrastructure_proximity +
        0.10 * capacity_score
    )

    # Constraints check
    constraints = [
        slope_score >= 0.5,
        hazard_safety >= 0.5,
        inputs.road_accessibility >= 0.5,
        inputs.water_availability >= 0.5,
        inputs.infrastructure_proximity >= 0.3,
        capacity_score >= 0.4,
    ]

    if suitability >= 0.7:
        level = "HIGH"
    elif suitability >= 0.5:
        level = "MODERATE"
    else:
        level = "LOW"

    return RelocationScore(
        suitability=round(suitability, 3),
        level=level,
        capacity=inputs.carrying_capacity,
        constraints_met=sum(constraints),
        constraints_total=len(constraints),
        details=details,
    )
