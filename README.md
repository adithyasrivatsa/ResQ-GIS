# ResQ-GIS

**AI/GIS Decision-Support Platform for Proactive Disaster Relocation**

## Core Workflow
```
Hazard → Exposure → Vulnerability → Relocation Sites → Capacity → Priority → Decision
```

## Quick Start

### Frontend
```bash
cd frontend
npm install
npm run dev
# Opens at http://localhost:3000
```

### Backend
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env  # Edit with your configuration
uvicorn app.main:app --reload --port 8000
# API docs at http://localhost:8000/api/docs
```

## Architecture

| Layer | Stack |
|-------|-------|
| Frontend | React + Vite + TypeScript + CesiumJS + Tailwind |
| Backend | Python + FastAPI + Pydantic |
| Database | PostgreSQL + PostGIS (when configured) |
| Map | CesiumJS 3D Globe with terrain |

## Pilot Region
Chamoli + Rudraprayag, Uttarakhand

## Data Sources
- **IMD** — India Meteorological Department (official API)
- **NDMA/SACHET** — National Disaster Management Authority (CAP feeds)
- **CWC** — Central Water Commission
- **ISRO/Bhuvan** — Satellite imagery
- **OpenStreetMap** — Base geographic data

## Key Features
- 3D terrain globe (CesiumJS)
- Habitation risk profiling
- Vulnerability Index (HVI) breakdown
- Relocation site suitability scoring
- TOPSIS multi-criteria prioritization
- Live alert feeds (IMD, NDMA, CWC)
- Layer-based hazard visualization
- Demo mode with clearly marked mock data

## Project Structure
```
SIH2ndPS/
├── frontend/          # React + CesiumJS UI
│   ├── src/
│   │   ├── app/       # Main app component
│   │   ├── cesium/    # Globe, camera, entities, interaction
│   │   ├── components/# Layout, panels, map
│   │   ├── data/      # Demo data
│   │   ├── services/  # API client
│   │   ├── store/     # Zustand state
│   │   └── types/     # TypeScript types
│   └── ...
├── backend/           # FastAPI server
│   └── app/
│       ├── api/       # REST endpoints
│       ├── ingestion/ # IMD, NDMA, CWC clients
│       ├── intelligence/ # Hazard, vulnerability, relocation, TOPSIS
│       ├── services/  # Demo data, business logic
│       └── ...
└── README.md
```

> ⚠️ **DEMO MODE**: The application runs in demo mode by default with simulated data. Demo data is never presented as live government information.
