"""
TOPSIS-based habitation prioritization.
Transparent multi-criteria decision method.

Ranks habitations for relocation priority.
"""
from __future__ import annotations
import math
from dataclasses import dataclass


@dataclass
class PrioritizationInput:
    habitation_id: str
    name: str
    hvi: float                    # vulnerability index
    hazard_exposure: float         # composite hazard
    population_exposed: int
    historical_frequency: int      # number of past events
    structural_vulnerability: float # 0-1
    relocation_feasibility: float   # 0-1


@dataclass
class PrioritizationResult:
    rank: int
    habitation_id: str
    name: str
    score: float
    reason: str


def topsis_prioritize(
    inputs: list[PrioritizationInput],
    weights: list[float] | None = None,
) -> list[PrioritizationResult]:
    """
    Apply TOPSIS (Technique for Order of Preference by Similarity to Ideal Solution)
    to rank habitations for relocation priority.

    Default weights:
      HVI: 0.25
      Hazard: 0.20
      Population: 0.20
      Historical: 0.10
      Structural: 0.15
      Feasibility: 0.10
    """
    if not inputs:
        return []

    if weights is None:
        weights = [0.25, 0.20, 0.20, 0.10, 0.15, 0.10]

    # Build decision matrix
    n = len(inputs)
    matrix = []
    for inp in inputs:
        max_pop = max(i.population_exposed for i in inputs) or 1
        matrix.append([
            inp.hvi,
            inp.hazard_exposure,
            inp.population_exposed / max_pop,  # normalize
            min(inp.historical_frequency / 5, 1.0),  # normalize
            inp.structural_vulnerability,
            inp.relocation_feasibility,
        ])

    # Step 1: Normalize matrix
    m = len(weights)
    col_norms = []
    for j in range(m):
        s = math.sqrt(sum(matrix[i][j] ** 2 for i in range(n))) or 1.0
        col_norms.append(s)

    normalized = [
        [matrix[i][j] / col_norms[j] for j in range(m)]
        for i in range(n)
    ]

    # Step 2: Weighted normalized matrix
    weighted = [
        [normalized[i][j] * weights[j] for j in range(m)]
        for i in range(n)
    ]

    # Step 3: Ideal and negative-ideal solutions
    # All criteria are "higher = more urgent" (benefit criteria for prioritization)
    ideal = [max(weighted[i][j] for i in range(n)) for j in range(m)]
    neg_ideal = [min(weighted[i][j] for i in range(n)) for j in range(m)]

    # Step 4: Distance to ideal and negative-ideal
    scores = []
    for i in range(n):
        d_plus = math.sqrt(sum((weighted[i][j] - ideal[j]) ** 2 for j in range(m)))
        d_minus = math.sqrt(sum((weighted[i][j] - neg_ideal[j]) ** 2 for j in range(m)))
        closeness = d_minus / (d_plus + d_minus) if (d_plus + d_minus) > 0 else 0
        scores.append(closeness)

    # Step 5: Rank
    indexed = [(scores[i], inputs[i]) for i in range(n)]
    indexed.sort(key=lambda x: x[0], reverse=True)

    results = []
    for rank, (score, inp) in enumerate(indexed, 1):
        reasons = []
        if inp.hvi >= 0.7:
            reasons.append("High vulnerability")
        if inp.hazard_exposure >= 0.7:
            reasons.append("High hazard exposure")
        if inp.population_exposed >= 1000:
            reasons.append(f"{inp.population_exposed} people exposed")
        if inp.historical_frequency >= 2:
            reasons.append("Recurrent disasters")
        if inp.structural_vulnerability >= 0.7:
            reasons.append("Structurally vulnerable")

        results.append(PrioritizationResult(
            rank=rank,
            habitation_id=inp.habitation_id,
            name=inp.name,
            score=round(score, 4),
            reason="; ".join(reasons) if reasons else "Standard monitoring",
        ))

    return results
