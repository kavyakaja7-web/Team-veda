"""
services/features.py — Feature engineering service for GVP recurrence prediction.

Computes features per GVP by joining the:
  - gvp_locations collection (geospatial/structural features)
  - complaints collection (historical complaint frequency and timing)
  - cleanups collection (remediation history)
"""

import pandas as pd
from typing import List, Dict, Any
from app.database import db


def get_recurrence_features() -> pd.DataFrame:
    """
    Query MongoDB and construct a feature DataFrame for all GVPs.

    Returns:
        pd.DataFrame: A DataFrame with the following columns:
            - gvp_id (index or column)
            - total_complaints (int)
            - complaints_after_cleanup (int)
            - average_days_between_complaints (float)
            - average_cleanup_interval (float)
            - distance_to_market_m (int)
            - distance_to_bin_m (int)
            - collection_frequency_per_week (int)
            - near_school (bool)
            - near_bus_stop (bool)
            - population_density (str)
            - risk_level (str)
    """
    # 1. Fetch GVPs
    gvp_cursor = db["gvp_locations"].find({})
    gvps = list(gvp_cursor)
    if not gvps:
        return pd.DataFrame()

    # 2. Fetch Complaints
    complaints_cursor = db["complaints"].find({})
    complaints = list(complaints_cursor)
    
    # 3. Fetch Cleanups
    cleanups_cursor = db["cleanups"].find({})
    cleanups = list(cleanups_cursor)

    # Group complaints by GVP ID
    complaints_by_gvp: Dict[str, List[pd.Timestamp]] = {}
    for c in complaints:
        g_id = c.get("gvp_id")
        rep_date = c.get("reported_date")
        if g_id and rep_date:
            try:
                ts = pd.to_datetime(rep_date)
                complaints_by_gvp.setdefault(g_id, []).append(ts)
            except Exception:
                continue

    # Sort dates chronologically
    for g_id in complaints_by_gvp:
        complaints_by_gvp[g_id].sort()

    # Group cleanups by GVP ID
    cleanups_by_gvp: Dict[str, List[pd.Timestamp]] = {}
    for cl in cleanups:
        g_id = cl.get("gvp_id")
        cleaned_date = cl.get("cleaned_date")
        if g_id and cleaned_date:
            try:
                ts = pd.to_datetime(cleaned_date)
                cleanups_by_gvp.setdefault(g_id, []).append(ts)
            except Exception:
                continue

    # Sort dates chronologically
    for g_id in cleanups_by_gvp:
        cleanups_by_gvp[g_id].sort()

    # Build feature row for each GVP
    feature_rows = []
    for gvp in gvps:
        gvp_id = gvp["_id"]

        # Get chronological complaints and cleanups
        gvp_complaints = complaints_by_gvp.get(gvp_id, [])
        gvp_cleanups = cleanups_by_gvp.get(gvp_id, [])

        # Feature A: total complaints
        total_complaints = len(gvp_complaints)

# Feature B: recurrence_count
        # A complaint counts as a "recurrence" if it happened after at least
        # one prior cleanup at this GVP (i.e. it's a repeat, not the first-ever report).
        recurrence_count = sum(
            1 for c_date in gvp_complaints
            if any(cl_date < c_date for cl_date in gvp_cleanups)
        )

        # Feature B2: recurrence_rate — normalized version, better for scoring/ML
        recurrence_rate = (recurrence_count / total_complaints) if total_complaints > 0 else 0.0

        # Feature C: average days between complaints
        if len(gvp_complaints) > 1:
            diffs = [
                (gvp_complaints[i] - gvp_complaints[i - 1]).days
                for i in range(1, len(gvp_complaints))
            ]
            average_days_between_complaints = float(sum(diffs) / len(diffs))
        else:
            average_days_between_complaints = 0.0  # Or None / NaN depending on ML preferences

        # Feature D: average cleanup interval
        if len(gvp_cleanups) > 1:
            diffs = [
                (gvp_cleanups[i] - gvp_cleanups[i - 1]).days
                for i in range(1, len(gvp_cleanups))
            ]
            average_cleanup_interval = float(sum(diffs) / len(diffs))
        else:
            average_cleanup_interval = 0.0  # Or None / NaN

        # GVP Metadata features
        # Note: distance_to_market_m was added in the updated CSV importer.
        # If not present in the document, default to a safe value or compute from near_market.
        distance_to_market = gvp.get("distance_to_market_m")
        if distance_to_market is None:
            distance_to_market = 100 if gvp.get("near_market") else 300

        coords = gvp.get("location", {}).get("coordinates", [None, None])
        row = {
            "gvp_id": gvp_id,
            "lat": coords[1] if len(coords) > 1 else None,
            "lon": coords[0] if len(coords) > 0 else None,
            "total_complaints": total_complaints,
            "recurrence_count": recurrence_count,
            "recurrence_rate": recurrence_rate,
            "average_days_between_complaints": average_days_between_complaints,
            "average_cleanup_interval": average_cleanup_interval,
            "distance_to_market_m": distance_to_market,
            "distance_to_bin_m": gvp.get("distance_to_bin_m", 0),
            "collection_frequency_per_week": gvp.get("collection_frequency_per_week", 0),
            "near_school": bool(gvp.get("near_school", False)),
            "near_bus_stop": bool(gvp.get("near_bus_stop", False)),
            "population_density": gvp.get("population_density", "medium"),
            "risk_level": gvp.get("risk_level", "Medium"),
        }
        feature_rows.append(row)

    # 4. Convert to DataFrame
    df = pd.DataFrame(feature_rows)
    return df
