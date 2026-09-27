"""
Disaster Historical Event Registry & Pipeline.
Stores structured, documented historical disaster events for Himalayan pilot districts
(Chamoli and Rudraprayag, Uttarakhand), replacing arbitrary hardcoded conditionals.
Provides historical frequency, severity index, and documented disaster archives.
"""
from __future__ import annotations
from typing import Optional
from app.schemas import DisasterHistoricalEvent, HazardType

HISTORICAL_DISASTER_ARCHIVE: list[DisasterHistoricalEvent] = [
    DisasterHistoricalEvent(
        id="disaster-2023-joshimath-subsidence",
        name="2023 Joshimath Land Subsidence & Creep Crisis",
        year=2023,
        event_type=HazardType.LANDSLIDE,
        affected_district="Chamoli",
        affected_habitations=["hab-joshimath", "hab-marwari", "hab-sunil"],
        description="Widespread rotational slope creep, subsurface piping, and building structural fractures across Sunil and Marwari wards.",
        severity_index=0.92,
        source="NDMA / CBRI / NGRI Subsidence Joint Assessment Report 2023",
    ),
    DisasterHistoricalEvent(
        id="disaster-2021-chamoli-glof-avalanche",
        name="2021 Chamoli Rock/Ice Avalanche & Flash Flood",
        year=2021,
        event_type=HazardType.GLOF,
        affected_district="Chamoli",
        affected_habitations=["hab-reni", "hab-joshimath", "hab-marwari"],
        description="Ronti peak wedge detachment triggered flash flood along Rishiganga and Dhauliganga valleys, destroying downstream hydel installations.",
        severity_index=0.95,
        source="Wadia Institute of Himalayan Geology (WIHG) & ISRO Remote Sensing Report",
    ),
    DisasterHistoricalEvent(
        id="disaster-2013-kedarnath-flash-floods",
        name="2013 Kedarnath Chorabari Moraine Breach & Deluge",
        year=2013,
        event_type=HazardType.FLOOD,
        affected_district="Rudraprayag",
        affected_habitations=["hab-kedarnath-base", "hab-augustmuni"],
        description="Multi-day torrential cloudburst triggered Chorabari glacial lake outburst (GLOF) and massive debris torrent down Mandakini river.",
        severity_index=0.98,
        source="National Institute of Disaster Management (NIDM) 2013 Comprehensive Study",
    ),
    DisasterHistoricalEvent(
        id="disaster-1999-chamoli-earthquake",
        name="1999 Chamoli Mw 6.8 Earthquake",
        year=1999,
        event_type=HazardType.EARTHQUAKE,
        affected_district="Chamoli",
        affected_habitations=["hab-joshimath", "hab-reni", "hab-auli"],
        description="Shallow crustal thrust faulting along Main Central Thrust (MCT) induced slope instability and rockfalls.",
        severity_index=0.78,
        source="Geological Survey of India (GSI) Seismotectonic Atlas",
    ),
    DisasterHistoricalEvent(
        id="disaster-2022-mandakini-overflow",
        name="2022 Mandakini Monsoon Flash Inundation",
        year=2022,
        event_type=HazardType.FLOOD,
        affected_district="Rudraprayag",
        affected_habitations=["hab-augustmuni"],
        description="Intense localized convective cloudburst leading to river bank toe erosion and inundation of market terraces.",
        severity_index=0.65,
        source="Uttarakhand State Disaster Management Authority (USDMA) Bulletin",
    ),
]


class DisasterHistoryService:
    def __init__(self):
        self._archive = HISTORICAL_DISASTER_ARCHIVE

    def get_all_events(self) -> list[DisasterHistoricalEvent]:
        return list(self._archive)

    def get_events_for_habitation(self, habitation_id: str) -> list[DisasterHistoricalEvent]:
        hab_id_clean = habitation_id.strip().lower()
        return [
            ev for ev in self._archive
            if any(h.lower() == hab_id_clean for h in ev.affected_habitations)
        ]

    def get_event_count_for_habitation(self, habitation_id: str) -> int:
        return len(self.get_events_for_habitation(habitation_id))

    def get_historical_severity_index(self, habitation_id: str) -> float:
        events = self.get_events_for_habitation(habitation_id)
        if not events:
            return 0.15  # baseline regional background frequency
        max_sev = max(ev.severity_index for ev in events)
        # Scaled composite based on frequency and maximum severity
        freq_factor = min(len(events) * 0.15, 0.45)
        return min(round(max_sev * 0.7 + freq_factor, 2), 1.0)


_history_service = DisasterHistoryService()


def get_disaster_history_service() -> DisasterHistoryService:
    return _history_service
