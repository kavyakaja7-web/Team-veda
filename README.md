# Team Veda — GVMC GVP Recurrence Prediction

> A decision-support pilot that helps the Greater Visakhapatnam Municipal Corporation (GVMC) identify Garbage Vulnerable Points (GVPs) likely to recur after cleanup, explain contributing factors, and plan preventive action.

## Overview

GVMC currently responds to garbage black spots after they are reported. Team Veda adds an evidence-based prevention layer by combining GVP infrastructure data, citizen complaints, and cleanup history to rank locations by recurrence risk.

The system produces a prioritized risk list, root-cause tags, recommended actions, an interactive map, and REST APIs for an operator dashboard or citizen-facing application.

## Capabilities

- Import GVP, complaint, and cleanup CSV datasets into MongoDB
- Generate recurrence and infrastructure features per GVP
- Detect spatial hotspots using DBSCAN clustering
- Calculate High, Medium, and Low risk tiers
- Predict recurrence rate with a Random Forest model
- Identify likely root causes and recommended preventive actions
- Generate an interactive Folium risk map
- Serve results through FastAPI endpoints

## Technology

| Area | Tools |
|---|---|
| Backend API | FastAPI, Uvicorn |
| Data store | MongoDB |
| Data processing | Pandas |
| ML and clustering | scikit-learn, Random Forest, DBSCAN |
| Map | Folium |

## Repository Structure

```text
Team-veda/
├── README.md
└── backend/
    ├── app/                 # FastAPI routes, models, and services
    ├── data/                # Input CSVs and generated outputs
    ├── models/              # Saved trained ML model
    ├── scripts/             # Imports, training, validation, map creation
    ├── .env                 # MongoDB configuration
    └── requirements.txt     # Python dependencies
```

## Prerequisites

- Python 3.10 or later
- MongoDB Community Server running locally, or a MongoDB Atlas database
- PowerShell on Windows

## Setup

Open PowerShell and move to the backend directory:

```powershell
cd C:\Users\girib\Desktop\Giri\team-veda\Team-veda\backend
```

Create the virtual environment and install dependencies:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

For future sessions, only activate the environment:

```powershell
.\.venv\Scripts\Activate.ps1
```

If PowerShell blocks activation:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1
```

## Configure MongoDB

Set the connection string in `backend/.env`.

Local MongoDB:

```env
MONGO_URI=mongodb://localhost:27017/gvmc_pilot
```

For MongoDB Atlas, replace it with your Atlas connection string. Do not commit real credentials.

## Input Datasets

Store these files in `backend/data/`.

| File | Purpose | Core Columns |
|---|---|---|
| `gvp_locations.csv` | GVP location and infrastructure information | `gvp_id`, `ward_id`, `lat`, `lon`, bin/market distances, collection frequency |
| `complaints.csv` | Citizen complaint history | `complaint_id`, `gvp_id`, `reported_date`, `status`, `category` |
| `cleanups.csv` | Field cleanup history | `cleanup_id`, `gvp_id`, `cleaned_date`, `team`, `waste_collected_kg` |

### Required GVP Columns

```text
gvp_id, ward_id, lat, lon, distance_to_market_m,
distance_to_nearest_bin_m, bin_count_within_100m,
collection_frequency_per_week, road_type, zone_type,
population_density, near_school, near_bus_stop, near_drainage,
first_reported_date, original_black_spot, risk_level
```

`complaints.csv` and `cleanups.csv` must reference valid `gvp_id` values from `gvp_locations.csv`.

## Run the Complete Data and ML Pipeline

Run all commands below from the `backend/` folder after changing the raw CSV files:

```powershell
python scripts\import_gvp.py
python scripts\import_complaints.py
python scripts\import_cleanups.py
python scripts\generate_features.py
python scripts\cluster_and_score.py
python scripts\train_model.py
python scripts\generate_map.py
python scripts\backtest.py
```

The import scripts are idempotent: records with existing IDs are updated instead of duplicated.

## Pipeline Stages and Outputs

| Stage | Command | Output |
|---|---|---|
| Import GVP locations | `python scripts\import_gvp.py` | MongoDB `gvp_locations` collection |
| Import complaints | `python scripts\import_complaints.py` | MongoDB `complaints` collection |
| Import cleanups | `python scripts\import_cleanups.py` | MongoDB `cleanups` collection |
| Generate features | `python scripts\generate_features.py` | `data/gvp_features.csv` |
| Cluster and score | `python scripts\cluster_and_score.py` | `data/gvp_scored.csv` |
| Train model | `python scripts\train_model.py` | `data/gvp_final.csv`, `models/rf_recurrence_model.pkl` |
| Generate map | `python scripts\generate_map.py` | `data/gvp_risk_map.html` |
| Validate model | `python scripts\backtest.py` | Precision, recall, F1 score, confusion matrix |

Open `data/gvp_risk_map.html` in a browser to inspect the interactive risk map.

## Run the Backend API

After the ML pipeline completes:

```powershell
uvicorn app.main:app --reload
```

The service starts at:

```text
http://127.0.0.1:8000
```

| Resource | URL |
|---|---|
| Interactive API documentation | `http://127.0.0.1:8000/docs` |
| Health check | `http://127.0.0.1:8000/health` |
| Prioritized high-risk GVPs | `http://127.0.0.1:8000/api/risk/high-risk?limit=20` |
| Ward summary example | `http://127.0.0.1:8000/api/risk/wards/1/summary` |
| Citizen status example | `http://127.0.0.1:8000/api/status/GVP001` |

## Model Approach

The project uses a `RandomForestRegressor`:

```python
n_estimators=200
max_depth=5
min_samples_leaf=3
```

Random Forest is suitable because this project uses a small tabular dataset containing bin distance, market distance, collection frequency, density, complaints, and cleanup history.

It trains quickly on a normal laptop, handles non-linear patterns, and provides feature importance for explainable results.

It does not use epochs. Epochs are used in neural networks; Random Forest instead builds many decision trees and averages their predictions.

The final dataset includes:

```text
rf_predicted_recurrence_rate
computed_risk_tier
worst_factor
recommended_action
```

## Demo Workflow

1. Start MongoDB and activate the Python environment.
2. Import GVP, complaint, and cleanup datasets.
3. Run the complete ML pipeline.
4. Open the risk map or FastAPI documentation.
5. Select a high-risk GVP.
6. Present the predicted recurrence, root cause, and recommended preventive action.
7. Show complaint and cleanup history through the status or risk-history API.

## Important Validation Note

In `backend/scripts/train_model.py`, use the current date to calculate cleanup recency:

```python
REFERENCE_DATE = pd.Timestamp.now().normalize()
```

This prevents newer cleanup records from being calculated as zero days since cleanup.

Treat model output as pilot decision support. GVMC field officers should validate recommended actions before real-world budget allocation or deployment.