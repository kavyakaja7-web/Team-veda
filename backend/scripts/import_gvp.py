"""
scripts/import_gvp.py — Import GVP locations from CSV into MongoDB.

Usage (run from the `backend/` directory):
    python scripts/import_gvp.py

The script is idempotent: re-running will upsert documents by `_id`
so no duplicates are ever created.

Expected CSV columns (updated schema):
    gvp_id, ward_id, lat, lon,
    distance_to_market_m, distance_to_nearest_bin_m,
    bin_count_within_100m, collection_frequency_per_week,
    road_type, zone_type, population_density,
    near_school, near_bus_stop, near_drainage,
    first_reported_date, original_black_spot, risk_level

Column mapping applied by this script:
    ward_id                  → ward
    distance_to_nearest_bin_m → distance_to_bin_m
    distance_to_market_m     → near_market (True if <= 100 m) +
                               distance_to_market_m (stored as-is for ML)
    near_drainage            → near_drainage (new field, stored in MongoDB)
"""

import os
import sys
from pathlib import Path

import pandas as pd
from dotenv import load_dotenv
from pymongo import MongoClient, UpdateOne

# ---------------------------------------------------------------------------
# Paths — works whether called from repo root or backend/
# ---------------------------------------------------------------------------
SCRIPT_DIR = Path(__file__).resolve().parent   # backend/scripts/
BACKEND_DIR = SCRIPT_DIR.parent                # backend/
DATA_FILE = BACKEND_DIR / "data" / "gvp_locations.csv"
ENV_FILE = BACKEND_DIR / ".env"

load_dotenv(dotenv_path=ENV_FILE)

MONGO_URI: str = os.getenv("MONGO_URI", "mongodb://localhost:27017/gvmc_pilot")
_DB_NAME: str = MONGO_URI.rstrip("/").split("/")[-1] or "gvmc_pilot"

# ---------------------------------------------------------------------------
# Threshold for near_market derivation
# ---------------------------------------------------------------------------
NEAR_MARKET_THRESHOLD_M = 100

# ---------------------------------------------------------------------------
# Required CSV columns in the new schema
# ---------------------------------------------------------------------------
REQUIRED_COLS = {
    "gvp_id",
    "ward_id",
    "lat",
    "lon",
    "distance_to_market_m",
    "distance_to_nearest_bin_m",
    "bin_count_within_100m",
    "collection_frequency_per_week",
    "road_type",
    "zone_type",
    "population_density",
    "near_school",
    "near_bus_stop",
    "near_drainage",
    "first_reported_date",
    "original_black_spot",
    "risk_level",
}

VALID_RISK_LEVELS = {"Low", "Medium", "High"}
VALID_ROAD_TYPES = {"main", "interior"}
VALID_ZONE_TYPES = {"residential", "commercial", "mixed"}
VALID_DENSITIES = {"low", "medium", "high"}


# ---------------------------------------------------------------------------
# Helper utilities
# ---------------------------------------------------------------------------

def parse_bool(val) -> bool:
    """Convert common truthy string representations to Python bool."""
    if isinstance(val, bool):
        return val
    return str(val).strip().lower() in ("true", "1", "yes", "y")


def safe_int(val, field: str, row_id: str) -> int:
    """Parse val as int; raises ValueError with context on failure."""
    try:
        return int(float(val))  # float() first handles "3.0" strings
    except (ValueError, TypeError) as exc:
        raise ValueError(f"[{row_id}] Field '{field}' is not a valid integer: {val!r}") from exc


def safe_float(val, field: str, row_id: str) -> float:
    """Parse val as float; raises ValueError with context on failure."""
    try:
        return float(val)
    except (ValueError, TypeError) as exc:
        raise ValueError(f"[{row_id}] Field '{field}' is not a valid number: {val!r}") from exc


# ---------------------------------------------------------------------------
# Row → MongoDB document
# ---------------------------------------------------------------------------

def row_to_doc(row: pd.Series) -> dict:
    """
    Convert a DataFrame row (new schema) to the MongoDB GVP document shape.

    Raises ValueError for any field that fails validation so the caller can
    skip the row with a warning instead of crashing.
    """
    row_id = str(row.get("gvp_id", "UNKNOWN")).strip()

    # --- Coordinates ---
    lat = safe_float(row["lat"], "lat", row_id)
    lon = safe_float(row["lon"], "lon", row_id)

    # --- Integer fields ---
    ward = safe_int(row["ward_id"], "ward_id", row_id)                                  # ward_id → ward
    distance_to_bin_m = safe_int(row["distance_to_nearest_bin_m"],                      # renamed
                                 "distance_to_nearest_bin_m", row_id)
    distance_to_market_m = safe_int(row["distance_to_market_m"],
                                    "distance_to_market_m", row_id)
    bin_count = safe_int(row["bin_count_within_100m"], "bin_count_within_100m", row_id)
    freq = safe_int(row["collection_frequency_per_week"],
                    "collection_frequency_per_week", row_id)

    # --- Derived boolean: near_market ---
    near_market: bool = distance_to_market_m <= NEAR_MARKET_THRESHOLD_M

    # --- Boolean fields ---
    near_school = parse_bool(row["near_school"])
    near_bus_stop = parse_bool(row["near_bus_stop"])
    near_drainage = parse_bool(row["near_drainage"])          # new field
    original_black_spot = parse_bool(row["original_black_spot"])

    # --- Enum-like string fields (validated) ---
    road_type = str(row["road_type"]).strip().lower()
    if road_type not in VALID_ROAD_TYPES:
        raise ValueError(
            f"[{row_id}] Invalid road_type '{road_type}'. Expected: {VALID_ROAD_TYPES}"
        )

    zone_type = str(row["zone_type"]).strip().lower()
    if zone_type not in VALID_ZONE_TYPES:
        raise ValueError(
            f"[{row_id}] Invalid zone_type '{zone_type}'. Expected: {VALID_ZONE_TYPES}"
        )

    population_density = str(row["population_density"]).strip().lower()
    if population_density not in VALID_DENSITIES:
        raise ValueError(
            f"[{row_id}] Invalid population_density '{population_density}'. "
            f"Expected: {VALID_DENSITIES}"
        )

    risk_level = str(row["risk_level"]).strip().capitalize()
    if risk_level not in VALID_RISK_LEVELS:
        raise ValueError(
            f"[{row_id}] Invalid risk_level '{risk_level}'. Expected: {VALID_RISK_LEVELS}"
        )

    return {
        "_id": row_id,
        "ward": ward,
        "location": {
            "type": "Point",
            "coordinates": [lon, lat],          # GeoJSON: [longitude, latitude]
        },
        # --- Proximity flags ---
        "near_market": near_market,             # derived from distance_to_market_m
        "near_school": near_school,
        "near_bus_stop": near_bus_stop,
        "near_drainage": near_drainage,         # new field stored for future use
        # --- Distance / bin metrics ---
        "distance_to_bin_m": distance_to_bin_m,
        "distance_to_market_m": distance_to_market_m,   # kept for ML feature engineering
        "bin_count_within_100m": bin_count,
        "collection_frequency_per_week": freq,
        # --- Categorical ---
        "road_type": road_type,
        "zone_type": zone_type,
        "population_density": population_density,
        # --- Meta ---
        "first_reported_date": str(row["first_reported_date"]).strip(),
        "original_black_spot": original_black_spot,
        "risk_level": risk_level,
    }


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    if not DATA_FILE.exists():
        print(f"[ERROR] CSV not found: {DATA_FILE}", file=sys.stderr)
        sys.exit(1)

    print(f"[INFO] Reading {DATA_FILE} …")
    df = pd.read_csv(DATA_FILE)
    total_rows = len(df)
    print(f"[INFO] {total_rows} rows loaded.")

    # --- Column validation ---
    missing = REQUIRED_COLS - set(df.columns)
    if missing:
        print(f"[ERROR] Missing required columns: {missing}", file=sys.stderr)
        sys.exit(1)

    # --- Connect ---
    client = MongoClient(MONGO_URI)
    collection = client[_DB_NAME]["gvp_locations"]

    # --- Ensure 2dsphere index ---
    collection.create_index([("location", "2dsphere")], background=True)
    print("[INFO] 2dsphere index ensured on 'location'.")

    # --- Build upsert operations, skipping invalid rows ---
    ops: list[UpdateOne] = []
    skipped = 0

    for idx, row in df.iterrows():
        try:
            doc = row_to_doc(row)
        except (ValueError, KeyError) as exc:
            print(f"[WARN] Skipping row {idx + 2}: {exc}")   # +2 = 1-indexed + header
            skipped += 1
            continue

        ops.append(
            UpdateOne(
                filter={"_id": doc["_id"]},
                update={"$set": doc},
                upsert=True,
            )
        )

    if not ops:
        print("[WARN] No valid rows to import — check your CSV and warnings above.")
        client.close()
        return

    # --- Execute ---
    result = collection.bulk_write(ops, ordered=False)
    client.close()

    print(
        f"\n[DONE] {total_rows} rows read | "
        f"{skipped} skipped | "
        f"{result.upserted_count} inserted | "
        f"{result.modified_count} updated."
    )


if __name__ == "__main__":
    main()
