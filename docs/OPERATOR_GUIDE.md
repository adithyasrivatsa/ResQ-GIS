# ResQ-GIS Operator & User Guide

**Tactical Incident Commander Handbook for Disaster Relocation Operations**

This guide outlines standard operating procedures (SOPs) for disaster management officers, emergency operation center (EOC) analysts, and first responders utilizing the ResQ-GIS platform during impending or active natural disaster events.

---

## 🧭 Navigation & Overview

The ResQ-GIS interface is divided into 4 primary tactical quadrants:

1. **Top Bar**:
   - **Workspace Folder**: Switch between regional command centers or create a new operational folder.
   - **State & District Selector**: Jump between 10 disaster-prone states and their respective administrative districts.
   - **Hazard Filter**: Filter map layers and settlements by hazard typology (Landslide, Riverine Flood, GLOF, Cyclone, or Seismic Sinking).
   - **Relocation Hub (Core CTA)**: Instant jump to the primary safe haven allocation matrix.
   - **Live Alert Ticker**: Real-time CAP alerts from IMD and NDMA Sachet.
   - **Surveillance & Map Mode Switcher**: Toggle 2D Leaflet tactical view or 3D Cesium terrain globe.

2. **Left Navigation Drawer**:
   - `Dashboard`: Multi-feed telemetry, live weather observation, and high-level risk metrics.
   - `Live Situation`: Tactical map canvas with live weather and sensor layers.
   - `Workspaces`: Regional folders and saved operational setups.
   - `Surveillance & AOI`: Custom sentry circles and polygon area-of-interest monitoring.
   - `Habitations`: Directory of vulnerable villages and detailed risk profiles.
   - `Relocation & Havens (CORE)`: Flagship safe haven registry, carrying capacity gauges, and evacuation routing.
   - `Infrastructure`: River monitoring stations, flood stages, and bridge passability.
   - `Hazard Layers`: Toggle GIS overlays (landslide susceptibility, flood inundation, rainfall radar).
   - `Alerts Feed`: Detailed warnings and severity badges.
   - `Reports`: Institutional National Relocation Operations Memo (NDMA format).
   - `Data Sources`: Telemetry health and connection status for external providers.

3. **Center Map Canvas (Dual Engine)**:
   - Interactive settlement risk markers (Critical = Red, High = Orange, Moderate = Amber, Low = Green).
   - Institutional safe haven pins (cyan shelter icons).
   - Evacuation routes (blue lifeline corridors).
   - Layer switcher in the top-right corner.

4. **Bottom Expandable Data Grid**:
   - Tabulated directory of habitations, safe sites, road networks, river gauges, and weather telemetry.
   - Multi-column search, risk filter, and instant CSV export.

---

## 🚨 Standard Operating Procedures

### Scenario 1: Pre-Disaster Early Warning (e.g. Cyclone or Extreme Rainfall)
1. **Select Jurisdiction**: In the Top Bar, select the target State (e.g., *Andhra Pradesh* or *Kerala*) and District (*Konaseema* or *Wayanad*).
2. **Review Sensor Telemetry**: Open the `Dashboard` panel to inspect 24-hour precipitation and CWC river stage warnings.
3. **Inspect Vulnerable Settlements**: Navigate to `Habitations` to identify settlements marked **CRITICAL** or **HIGH**.
4. **Open Relocation Hub**: Click the green **Relocation Hub** CTA in the Top Bar.
   - Verify that the designated Safe Havens have **SURPLUS** bed capacity.
   - Confirm that the lifeline highway corridors (e.g., *NH-16* or *NH-766*) are currently passable.
5. **Generate National Operations Memo**:
   - Open `Reports`.
   - Select the target State and District.
   - Review the calculated requirements: Convoy Buses (50-seater), ALS Ambulances, and 14-day Emergency Rations.
   - Click **Print PDF** or **CSV** to distribute the executive evacuation directive to district magistrates and transit authorities.

### Scenario 2: Active Flash Flood or Landslide Event
1. **Activate Surveillance Mode**: Click **Mark Surveillance** in the Top Bar and define an Area of Interest (AOI) around the impacted river basin or escarpment.
2. **Examine 3D Terrain**: Switch from **2D GIS** to **3D Cesium** in the Top Bar to inspect mountain slopes, valley choke points, and flood elevation clearance.
3. **Execute Route Clearance**: Ensure evacuation convoys transit along roads that possess clearance above the 100-year flood plane (verified in the Safe Haven Registry).
