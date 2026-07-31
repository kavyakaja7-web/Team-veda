"""
scripts/import_cleanups.py — Import cleanups from CSV into MongoDB.

Usage (run from the `backend/` directory):
    python scripts/import_cleanups.py

The script is idempotent: re-running will upsert documents by `_id`
so no duplicates are ever created.

Expected CSV columns:
    cleanup_id, gvp_id, cleaned_date, team, waste_collected_kg, duration_hours
    (or variations like date, id)
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
DATA_FILE = BACKEND_DIR / "data" / "cleanups.csv"
ENV_FILE = BACKEND_DIR / ".env"

load_dotenv(dotenv_path=ENV_FILE)

MONGO_URI: str = os.getenv("MONGO_URI", "mongodb://localhost:27017/gvmc_pilot")
_DB_NAME: str = MONGO_URI.rstrip("/").split("/")[-1] or "gvmc_pilot"


# ---------------------------------------------------------------------------
# Helper utilities
# ---------------------------------------------------------------------------

def safe_float(val, field: str, row_id: str) -> float:
    """Parse val as float; raises ValueError with context on failure."""
    try:
        if pd.isna(val):
            return 0.0
        return float(val)
    except (ValueError, TypeError) as exc:
        raise ValueError(f"[{row_id}] Field '{field}' is not a valid number: {val!r}") from exc


# ---------------------------------------------------------------------------
# Row → MongoDB document
# ---------------------------------------------------------------------------

def row_to_doc(row: pd.Series, columns_mapping: dict) -> dict:
    """
    Convert a DataFrame row to the MongoDB Cleanup document shape.
    """
    # Extract IDs
    cleanup_id_col = columns_mapping.get("cleanup_id")
    row_id = str(row[cleanup_id_col]).strip() if cleanup_id_col else "UNKNOWN"
    
    gvp_id_col = columns_mapping.get("gvp_id")
    gvp_id = str(row[gvp_id_col]).strip() if gvp_id_col else ""

    if not row_id or row_id == "nan":
        raise ValueError("Missing or invalid cleanup_id")
    if not gvp_id or gvp_id == "nan":
        raise ValueError("Missing or invalid gvp_id")

    # Cleaned_by mapping
    cleaned_by_col = columns_mapping.get("cleaned_by")
    cleaned_by = str(row[cleaned_by_col]).strip() if cleaned_by_col else "Default Team"
    if not cleaned_by or cleaned_by == "nan":
        cleaned_by = "Default Team"

    # Date handling
    cleaned_date_col = columns_mapping.get("cleaned_date")
    cleaned_date = str(row[cleaned_date_col]).strip() if cleaned_date_col else None
    if not cleaned_date or cleaned_date == "nan":
        raise ValueError("Missing or invalid cleaned_date")

    # Numeric fields
    waste_col = columns_mapping.get("waste_collected_kg")
    waste_collected_kg = safe_float(row[waste_col], "waste_collected_kg", row_id) if waste_col else 0.0

    duration_col = columns_mapping.get("duration_hours")
    duration_hours = safe_float(row[duration_col], "duration_hours", row_id) if duration_col else 0.0

    return {
        "_id": row_id,
        "gvp_id": gvp_id,
        "cleaned_date": cleaned_date,
        "cleaned_by": cleaned_by,
        "waste_collected_kg": waste_collected_kg,
        "duration_hours": duration_hours,
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

    # --- Identify and map columns dynamically ---
    cols = list(df.columns)
    mapping = {}
    
    # cleanup_id mapping
    for c in ("cleanup_id", "id", "_id"):
        if c in cols:
            mapping["cleanup_id"] = c
            break
    
    # gvp_id mapping
    if "gvp_id" in cols:
        mapping["gvp_id"] = "gvp_id"

    # cleaned_date mapping
    for c in ("cleaned_date", "date"):
        if c in cols:
            mapping["cleaned_date"] = c
            break

    # cleaned_by mapping
    if "cleaned_by" in cols:
        mapping["cleaned_by"] = "cleaned_by"
    elif "team" in cols:
        mapping["cleaned_by"] = "team"

    # waste_collected_kg mapping
    for c in ("waste_collected_kg", "waste", "waste_kg"):
        if c in cols:
            mapping["waste_collected_kg"] = c
            break

    # duration_hours mapping
    for c in ("duration_hours", "duration", "hours"):
        if c in cols:
            mapping["duration_hours"] = c
            break

    # Verify minimum required columns for mapping
    required_keys = {"cleanup_id", "gvp_id", "cleaned_date"}
    missing_mappings = required_keys - set(mapping.keys())
    if missing_mappings:
        print(f"[ERROR] Could not resolve columns in CSV. Missing mappings for: {missing_mappings}", file=sys.stderr)
        print(f"Available columns in CSV: {cols}", file=sys.stderr)
        sys.exit(1)

    print(f"[INFO] Column mappings identified: {mapping}")

    # --- Connect ---
    client = MongoClient(MONGO_URI)
    collection = client[_DB_NAME]["cleanups"]

    # --- Build upsert operations, skipping invalid rows ---
    ops: list[UpdateOne] = []
    skipped = 0

    for idx, row in df.iterrows():
        try:
            doc = row_to_doc(row, mapping)
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
