# ResQ-GIS Backend Service

**FastAPI Geospatial Intelligence & Decision-Support Engine**

The ResQ-GIS backend is a high-performance Python FastAPI service providing real-time disaster hazard modeling, settlement vulnerability scoring (HVI), multi-criteria relocation prioritization (TOPSIS), and ingestion pipelines for Indian meteorological and hydrological agencies.

---

## 🏛️ Core Modules

```
backend/app/
├── api/                  # REST API route handlers
│   ├── habitations.py    # Settlement queries & risk profiles
│   ├── relocation.py     # Safe haven registry & capacity balance
│   ├── hazard.py         # Dynamic hazard assessment & telemetry
│   ├── prioritization.py # TOPSIS multi-criteria ranking
│   └── system.py         # Ingestion provider health & status
├── ingestion/            # Live telemetry clients
│   ├── imd.py            # IMD Weather forecasts & CAP alerts
│   ├── cwc.py            # Central Water Commission river stages
│   ├── sachet.py         # NDMA Sachet disaster alerts
│   ├── bhuvan.py         # ISRO Bhuvan satellite vectors
│   └── osm.py            # OpenStreetMap road passability
├── intelligence/         # Computational algorithms
│   ├── topsis.py         # TOPSIS Multi-Criteria Decision Making (MCDM)
│   ├── ml_hazard.py      # RandomForest hazard susceptibility model
│   └── vulnerability.py  # Habitation Vulnerability Index (HVI)
├── database/             # PostgreSQL + PostGIS connections
├── schemas.py            # Pydantic validation schemas
└── main.py               # FastAPI application entrypoint & middleware
```

---

## ⚙️ Environment Configuration

Create a `.env` file in the `backend/` directory:

```env
# Application Settings
APP_NAME=ResQ-GIS
APP_ENV=development
DEBUG=True
PORT=8000
HOST=0.0.0.0

# CORS Origins
CORS_ORIGINS=["http://localhost:3000","http://127.0.0.1:3000"]

# Database (Optional for demo/in-memory mode)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/resq_gis

# External Ingestion APIs
OPEN_METEO_API_URL=https://api.open-meteo.com/v1/forecast
IMD_API_KEY=your_imd_api_key_here
SACHET_FEED_URL=https://sachet.ndma.gov.in/cap_feed
```

---

## 🚀 Running the Backend

```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the uvicorn development server
uvicorn app.main:app --reload --port 8000
```

- **API Documentation (Swagger UI)**: `http://localhost:8000/api/docs`
- **ReDoc Alternative**: `http://localhost:8000/api/redoc`

---

## 🔬 Computational Methodology

### 1. Habitation Vulnerability Index (HVI)
Vulnerability is computed per settlement using normalized indicators:
$$HVI = w_1 \cdot \text{DemographicExposure} + w_2 \cdot \text{KutchaHousingRatio} + w_3 \cdot \text{RoadCutoffRisk} + w_4 \cdot (1 - \text{HealthcareProximity})$$

### 2. TOPSIS Multi-Criteria Relocation Prioritization
The platform ranks threatened settlements for evacuation order using the Technique for Order of Preference by Similarity to Ideal Solution (TOPSIS):
1. **Decision Matrix Normalization**: Normalizes population, slope, rainfall, HVI, and distance to safe havens.
2. **Weighted Matrix Construction**: Applies disaster-specific weights (e.g. higher slope weight in landslide zones, higher rainfall weight in cloudburst corridors).
3. **Ideal Best ($A^*$) and Worst ($A^-$) Solutions**: Determines theoretical extremes.
4. **Relative Closeness**: Generates a composite score between 0.0 and 1.0; settlements with highest closeness receive immediate Phase-1 evacuation directives.

### 3. ML Susceptibility Classifier
A pre-trained scikit-learn `RandomForestClassifier` trained on slope degrees, aspect, 24h precipitation, and lithology predicts hazard probability with associated model confidence.
