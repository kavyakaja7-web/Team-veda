"""
scripts/import_complaints.py — Import complaints from CSV into MongoDB.

Usage (run from the `backend/` directory):
    python scripts/import_complaints.py

The script is idempotent: re-running will upsert documents by `_id`
so no duplicates are ever created.

Expected CSV columns:
    complaint_id, gvp_id, ward, status, category, description, reported_date, resolved_date
    (or variations like ward_id, first_reported_date)
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
DATA_FILE = BACKEND_DIR / "data" / "complaints.csv"
ENV_FILE = BACKEND_DIR / ".env"

load_dotenv(dotenv_path=ENV_FILE)

MONGO_URI: str = os.getenv("MONGO_URI", "mongodb://localhost:27017/gvmc_pilot")
_DB_NAME: str = MONGO_URI.rstrip("/").split("/")[-1] or "gvmc_pilot"

VALID_STATUSES = {"Open", "In Progress", "Resolved"}


# ---------------------------------------------------------------------------
# Helper utilities
# ---------------------------------------------------------------------------

def safe_int(val, field: str, row_id: str) -> int:
    """Parse val as int; raises ValueError with context on failure."""
    try:
        return int(float(val))  # float() first handles "3.0" strings
    except (ValueError, TypeError) as exc:
        raise ValueError(f"[{row_id}] Field '{field}' is not a valid integer: {val!r}") from exc


def clean_status(status_str: str) -> str:
    """Standardize status strings to matching casing."""
    status_lower = status_str.strip().lower()
    if status_lower in ("open", "o"):
        return "Open"
    elif status_lower in ("in progress", "in_progress", "ip"):
        return "In Progress"
    elif status_lower in ("resolved", "r"):
        return "Resolved"
    else:
        return status_str.strip().title()


# ---------------------------------------------------------------------------
# Row → MongoDB document
# ---------------------------------------------------------------------------

def row_to_doc(row: pd.Series, columns_mapping: dict) -> dict:
    """
    Convert a DataFrame row to the MongoDB Complaint document shape.
    """
    # Extract IDs
    complaint_id_col = columns_mapping.get("complaint_id")
    row_id = str(row[complaint_id_col]).strip() if complaint_id_col else "UNKNOWN"
    
    gvp_id_col = columns_mapping.get("gvp_id")
    gvp_id = str(row[gvp_id_col]).strip() if gvp_id_col else ""

    if not row_id or row_id == "nan":
        raise ValueError("Missing or invalid complaint_id")
    if not gvp_id or gvp_id == "nan":
        raise ValueError("Missing or invalid gvp_id")

    # Ward mapping
    ward_col = columns_mapping.get("ward")
    ward = safe_int(row[ward_col], "ward", row_id)

    # Status mapping
    status_col = columns_mapping.get("status")
    status_val = clean_status(str(row[status_col])) if status_col else "Open"
    if status_val not in VALID_STATUSES:
        raise ValueError(f"Invalid status '{status_val}'. Expected one of: {VALID_STATUSES}")

    # Category, description
    cat_col = columns_mapping.get("category")
    category = str(row[cat_col]).strip() if cat_col else "Others"
    if not category or category == "nan":
        category = "Others"

    desc_col = columns_mapping.get("description")
    description = str(row[desc_col]).strip() if desc_col and pd.notna(row[desc_col]) else None
    if description == "nan":
        description = None

    # Date handling
    rep_date_col = columns_mapping.get("reported_date")
    reported_date = str(row[rep_date_col]).strip() if rep_date_col else None
    if not reported_date or reported_date == "nan":
        raise ValueError("Missing or invalid reported_date")

    res_date_col = columns_mapping.get("resolved_date")
    resolved_date = str(row[res_date_col]).strip() if res_date_col and pd.notna(row[res_date_col]) else None
    if resolved_date == "nan":
        resolved_date = None

    return {
        "_id": row_id,
        "gvp_id": gvp_id,
        "ward": ward,
        "status": status_val,
        "category": category,
        "description": description,
        "reported_date": reported_date,
        "resolved_date": resolved_date,
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
    
    # complaint_id mapping
    for c in ("complaint_id", "id", "_id"):
        if c in cols:
            mapping["complaint_id"] = c
            break
    
    # gvp_id mapping
    if "gvp_id" in cols:
        mapping["gvp_id"] = "gvp_id"

    # ward mapping
    for c in ("ward", "ward_id"):
        if c in cols:
            mapping["ward"] = c
            break

    # status mapping
    if "status" in cols:
        mapping["status"] = "status"

    # category mapping
    if "category" in cols:
        mapping["category"] = "category"

    # description mapping
    if "description" in cols:
        mapping["description"] = "description"

    # reported_date mapping
    for c in ("reported_date", "first_reported_date", "date"):
        if c in cols:
            mapping["reported_date"] = c
            break

    # resolved_date mapping
    if "resolved_date" in cols:
        mapping["resolved_date"] = "resolved_date"

    # Verify minimum required columns for mapping
    required_keys = {"complaint_id", "gvp_id", "ward", "reported_date"}
    missing_mappings = required_keys - set(mapping.keys())
    if missing_mappings:
        print(f"[ERROR] Could not resolve columns in CSV. Missing mappings for: {missing_mappings}", file=sys.stderr)
        print(f"Available columns in CSV: {cols}", file=sys.stderr)
        sys.exit(1)

    print(f"[INFO] Column mappings identified: {mapping}")

    # --- Connect ---
    client = MongoClient(MONGO_URI)
    collection = client[_DB_NAME]["complaints"]

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
