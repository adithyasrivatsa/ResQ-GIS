# ResQ-GIS Frontend

**High-Performance Tactical Operator Dashboard for Disaster Relocation Intelligence**

The ResQ-GIS frontend is a dual-engine spatial analysis interface built with **React**, **TypeScript**, **Vite**, **CesiumJS**, and **Leaflet**. It delivers sub-second situational awareness, multi-criteria relocation matching, live environmental telemetry, and institutional command reporting for emergency operation centers.

---

## 🚀 Key Frontend Features

1. **Dual Spatial Engine**:
   - **2D Leaflet**: Lightweight, tactical GIS mapping with layer stacks, habitation risk pins, relocation markers, river gauge icons, and custom polygon buffers.
   - **3D Cesium Terrain Globe**: True 3D digital elevation models, mountain slope rendering, camera fly-to animations, and altitude controls.
2. **Mainstream Relocation Intelligence Hub**:
   - Institutional safe haven registry across 10 vulnerable Indian states.
   - Live carrying capacity meters (surplus / deficit).
   - Matching vulnerable populations to verified cyclone shelters and stadiums.
3. **National Relocation Operations Memo (Reports)**:
   - NDMA-formatted executive relocation balance sheet.
   - Dynamic fleet calculators (50-seater convoy buses, ALS ambulances, rations tonnage).
   - Instant CSV export and printable formatting.
4. **Unified Multi-State & Multi-Hazard Filter Bar**:
   - State selector spanning 10 disaster-prone states.
   - Dynamic district selector with camera fly-to triggers.
   - Multi-hazard filters: landslides, river floods, GLOF, coastal cyclones, and sinking zones.
5. **Tactical Surveillance & Workspace Folders**:
   - Draw circular and polygon Areas of Interest (AOI).
   - Group regional taskforce assets into persistent workspace folders.

---

## 📂 Directory Structure

```
frontend/src/
├── app/                  # Main App root component & routing
├── cesium/               # CesiumJS 3D engine helpers
│   ├── camera.ts         # Fly-to coordinates for 10 states and districts
│   ├── entities.ts       # Billboard markers & point entities
│   └── viewer.ts         # Cesium viewer initializer
├── components/
│   ├── layout/           # App chrome & persistent controls
│   │   ├── TopBar.tsx    # State/district selectors, hazard filter, Relocation Hub CTA
│   │   ├── LeftNav.tsx   # Operations navigation with highlighted CORE Relocation badge
│   │   ├── BottomDataTable.tsx # Expandable data table for settlements & safe havens
│   │   └── RightOperationsPanel.tsx # Sliding operational drawer
│   ├── map/
│   │   ├── Map2D.tsx     # 2D Leaflet GIS canvas & layer controls
│   │   └── Map3D.tsx     # 3D Cesium globe container
│   └── panels/           # Tactical operational drawers
│       ├── RelocationPanel.tsx # Safe haven registry & capacity balance
│       ├── ReportsPanel.tsx    # National Relocation Operations Memo
│       ├── HabitationPanel.tsx # Settlement risk profiles & HVI index
│       ├── SurveillancePanel.tsx # AOI monitoring sentries
│       ├── AnalysisPanel.tsx   # Situation telemetry & TOPSIS score
│       ├── LayerPanel.tsx      # GIS layer toggles & opacity
│       ├── AlertsPanel.tsx     # CAP weather warnings
│       ├── RiversPanel.tsx     # CWC river gauge monitoring
│       ├── WorkspacesPanel.tsx # Regional taskforce folders
│       ├── DataSourcesPanel.tsx # Live API ingestion telemetry
│       └── SettingsPanel.tsx   # System preferences
├── data/                 # Standardized mock & offline fallback datasets
│   ├── habitations.ts    # 22 settlements across 10 states
│   ├── relocationSites.ts # 21 verified institutional safe refuges
│   ├── alerts.ts         # Disaster warning alerts
│   ├── rivers.ts         # River monitoring stations
│   └── weather.ts        # Open-Meteo forecasts
├── services/
│   └── api.ts            # REST client with automatic fallback
├── store/
│   └── useAppStore.ts    # Zustand global state store
└── types/
    └── index.ts          # TypeScript interfaces for entities & telemetry
```

---

## 🛠️ Development Scripts

```bash
# Install dependencies
npm install

# Start Vite dev server on http://localhost:3000
npm run dev

# Run TypeScript typecheck & Vite production build
npm run build

# Preview production build locally
npm run preview
```

---

## 🎨 Design System

ResQ-GIS follows a dark/light tactical command center theme using CSS custom properties defined in `src/index.css`:
- **Accent Blue**: `#2563eb` (primary command actions)
- **Accent Emerald**: `#10b981` (relocation hub, safe status, surplus capacity)
- **Accent Amber**: `#f59e0b` (moderate risk, advisory alerts)
- **Accent Rose**: `#ef4444` (critical danger, mandatory evacuation)
- **Typography**: Clean system sans-serif with monospace font for coordinates and telemetry metrics.
