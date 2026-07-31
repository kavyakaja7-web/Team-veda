"""
routes/analytics.py — Analytics & feature-engineering endpoints.

Exposes ward-level cleanliness scores, risk distributions, recurrence stats,
and the raw feature matrix from the features service.
"""

import os
from typing import Optional

import pandas as pd
from fastapi import APIRouter, HTTPException, Query

from app.database import db
from app.services.features import get_recurrence_features

from app.routes.risk import _load_final_data

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


def _safe_float(val, default=0.0):
    """Convert a value to float safely."""
    try:
        f = float(val)
        return f if pd.notna(f) else default
    except (TypeError, ValueError):
        return default


# ---------------------------------------------------------------------------
# GET /api/analytics/features — ward-level scores + raw feature rows
# ---------------------------------------------------------------------------
@router.get("/features", summary="Get ward-level cleanliness scores and per-GVP features")
def get_analytics_features(
    ward: Optional[str] = Query(None, description="Filter by ward name"),
):
    """
    Computes ward-level cleanliness scores derived from recurrence rates,
    complaint frequency, and cleanup intervals.  Also returns per-GVP rows
    so the frontend can render scatter plots and detail tables.
    """
    try:
        df = _load_final_data()
    except Exception:
        df = get_recurrence_features()

    if df.empty:
        return {
            "available": True,
            "generatedAt": None,
            "wardScores": [],
            "riskDistribution": {"high": 0, "medium": 0, "low": 0},
            "features": [],
            "topHotspots": [],
        }

    # Normalize risk tier column name
    risk_col = None
    for candidate in ("computed_risk_tier", "risk_level"):
        if candidate in df.columns:
            risk_col = candidate
            break

    # Ward filter
    if ward:
        ward_cols = [c for c in df.columns if "ward" in c.lower()]
        if ward_cols:
            df = df[df[ward_cols[0]].astype(str).str.lower() == ward.lower()]

    # --- Ward cleanliness scores ---
    # Score formula: 100 − (recurrence_rate × 50 + normalized_complaint_freq × 50)
    recurrence_col = None
    for c in ("rf_predicted_recurrence_rate", "recurrence_rate"):
        if c in df.columns:
            recurrence_col = c
            break

    ward_scores = []
    if recurrence_col:
        max_complaints = max(df.get("total_complaints", pd.Series([1])).max(), 1)
        df["_norm_complaints"] = df.get("total_complaints", pd.Series([0])) / max_complaints
        df["_ward_score"] = (
            100
            - df[recurrence_col].fillna(0).clip(0, 1) * 50
            - df["_norm_complaints"].fillna(0).clip(0, 1) * 50
        ).round(1)

        # If there's a ward column, group by it
        ward_cols = [c for c in df.columns if "ward" in c.lower() and c not in ("_ward_score",)]
        if ward_cols:
            grouped = df.groupby(ward_cols[0])["_ward_score"].mean().round(1)
            ward_scores = [
                {"ward": str(w), "score": _safe_float(s)}
                for w, s in grouped.items()
            ]
        else:
            # Treat each GVP as its own entry
            ward_scores = [
                {"ward": str(row.get("gvp_id", f"GVP-{i}")), "score": _safe_float(row.get("_ward_score", 50))}
                for i, row in df.iterrows()
            ]
        ward_scores.sort(key=lambda x: x["score"])

    # --- Risk distribution ---
    risk_distribution = {"high": 0, "medium": 0, "low": 0}
    if risk_col:
        counts = df[risk_col].str.lower().value_counts().to_dict()
        risk_distribution = {
            "high": int(counts.get("high", 0)),
            "medium": int(counts.get("medium", 0)),
            "low": int(counts.get("low", 0)),
        }

    # --- Top hotspots (highest recurrence) ---
    top_hotspots = []
    if recurrence_col:
        hotspot_df = df.nlargest(8, recurrence_col)
        hotspot_cols = ["gvp_id", recurrence_col, "total_complaints", "risk_score"]
        if risk_col:
            hotspot_cols.append(risk_col)
        available_cols = [c for c in hotspot_cols if c in hotspot_df.columns]
        top_hotspots = hotspot_df[available_cols].to_dict(orient="records")
        # Convert numpy types
        for row in top_hotspots:
            for k, v in row.items():
                if hasattr(v, "item"):
                    row[k] = v.item()

    # --- Feature insights (averages by risk tier) ---
    feature_insights = {}
    insight_cols = [
        "distance_to_bin_m", "distance_to_market_m",
        "collection_frequency_per_week", "average_days_between_complaints",
        "average_cleanup_interval",
    ]
    if risk_col:
        for col in insight_cols:
            if col in df.columns:
                by_tier = df.groupby(risk_col)[col].mean().round(2).to_dict()
                feature_insights[col] = {
                    str(k).lower(): _safe_float(v) for k, v in by_tier.items()
                }

    # --- Raw feature rows (for detail views / scatter plots) ---
    feature_rows = []
    export_cols = [c for c in df.columns if not c.startswith("_")]
    for _, row in df.head(100).iterrows():
        record = {}
        for c in export_cols:
            val = row[c]
            if hasattr(val, "item"):
                val = val.item()
            if pd.isna(val):
                val = None
            record[c] = val
        feature_rows.append(record)

    return {
        "available": True,
        "totalGvps": len(df),
        "wardScores": ward_scores,
        "riskDistribution": risk_distribution,
        "topHotspots": top_hotspots,
        "featureInsights": feature_insights,
        "features": feature_rows,
    }


# ---------------------------------------------------------------------------
# GET /api/analytics/summary — high-level aggregated stats
# ---------------------------------------------------------------------------
@router.get("/summary", summary="Get high-level analytics summary")
def get_analytics_summary():
    """Quick overview stats for dashboard cards."""
    try:
        df = _load_final_data()
    except Exception:
        df = get_recurrence_features()

    if df.empty:
        return {
            "totalGvps": 0,
            "avgRiskScore": 0,
            "avgRecurrenceRate": 0,
            "highRiskCount": 0,
            "mediumRiskCount": 0,
            "lowRiskCount": 0,
            "totalComplaints": 0,
            "totalCleanups": 0,
            "groqModel": os.getenv("GROQ_MODEL", "not configured"),
            "groqConfigured": bool(os.getenv("GROQ_API_KEY")),
        }

    risk_col = None
    for c in ("computed_risk_tier", "risk_level"):
        if c in df.columns:
            risk_col = c
            break

    recurrence_col = None
    for c in ("rf_predicted_recurrence_rate", "recurrence_rate"):
        if c in df.columns:
            recurrence_col = c
            break

    tier_counts = {}
    if risk_col:
        tier_counts = df[risk_col].str.lower().value_counts().to_dict()

    avg_risk = _safe_float(df["risk_score"].mean()) if "risk_score" in df.columns else 0
    avg_recurrence = _safe_float(df[recurrence_col].mean()) if recurrence_col else 0

    total_complaints = int(db["complaints"].count_documents({}))
    total_cleanups = int(db["cleanups"].count_documents({}))

    return {
        "totalGvps": len(df),
        "avgRiskScore": round(avg_risk, 3),
        "avgRecurrenceRate": round(avg_recurrence, 3),
        "highRiskCount": int(tier_counts.get("high", 0)),
        "mediumRiskCount": int(tier_counts.get("medium", 0)),
        "lowRiskCount": int(tier_counts.get("low", 0)),
        "totalComplaints": total_complaints,
        "totalCleanups": total_cleanups,
        "groqModel": os.getenv("GROQ_MODEL", "not configured"),
        "groqConfigured": bool(os.getenv("GROQ_API_KEY")),
    }
