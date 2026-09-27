from app.providers.optional.nasa_power import NASAPowerAdapter
from app.providers.optional.pm_gatishakti import PMGatiShaktiAdapter
from app.providers.optional.carto import CartoAdapter
from app.providers.optional.esri import EsriAdapter
from app.providers.optional.google_terrain import GoogleTerrainAdapter
from app.providers.optional.generic_sdma import (
    GenericSDMAAdapter,
    hpsdma_adapter,
    ssma_adapter,
    ksdma_adapter,
    asdma_adapter,
    osdma_adapter,
)

__all__ = [
    "NASAPowerAdapter",
    "PMGatiShaktiAdapter",
    "CartoAdapter",
    "EsriAdapter",
    "GoogleTerrainAdapter",
    "GenericSDMAAdapter",
    "hpsdma_adapter",
    "ssma_adapter",
    "ksdma_adapter",
    "asdma_adapter",
    "osdma_adapter",
]
