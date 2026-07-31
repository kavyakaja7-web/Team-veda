"""Groq explanation endpoint for model-generated GVP risk results."""

import hashlib
import json
import os
from datetime import datetime, timezone

import pandas as pd
from fastapi import APIRouter, HTTPException, Query

from app.database import db
from app.services.groq_explanations import generate_gvp_explanation, get_groq_model

router = APIRouter(prefix="/api/explanations", tags=["AI Explanations"])
FINAL_CSV_PATH = "data/gvp_final.csv"
CACHE_COLLECTION = db["ai_explanations"]
EXPLANATION_FIELDS = (
    "gvp_id",
    "computed_risk_tier",
    "risk_score",
    "rf_predicted_recurrence_rate",
    "worst_factor",
    "recommended_action",
    "total_complaints",
    "distance_to_bin_m",
    "distance_to_market_m",
    "collection_frequency_per_week",
    "population_density",
    "near_school",
    "near_bus_stop",
    "days_since_last_cleanup",
    "average_days_between_complaints",
)


def _to_native(value):
    """Convert pandas/numpy values to JSON-safe values."""
    return value.item() if hasattr(value, "item") else value


def _model_record(row: pd.Series) -> dict:
    return {field: _to_native(row.get(field)) for field in EXPLANATION_FIELDS}


def _cache_key(record: dict) -> str:
    payload = json.dumps(
        {"model": get_groq_model(), "record": record},
        sort_keys=True,
        default=str,
    )
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


@router.post(
    "/{gvp_id}",
    summary="Generate a cached Groq explanation for a GVP risk prediction",
)
def explain_gvp_risk(
    gvp_id: str,
    refresh: bool = Query(False, description="Generate a new explanation instead of returning a cached one."),
):
    """Generate officer-friendly explanation from existing ML output; never replaces the ML prediction."""
    if not os.path.exists(FINAL_CSV_PATH):
        raise HTTPException(status_code=500, detail="Risk model data not generated yet. Run the training pipeline first.")
    if not os.getenv("GROQ_API_KEY"):
        raise HTTPException(status_code=503, detail="Groq is not configured. Add GROQ_API_KEY to backend/.env.")

    df = pd.read_csv(FINAL_CSV_PATH)
    matches = df[df["gvp_id"].astype(str) == gvp_id]
    if matches.empty:
        raise HTTPException(status_code=404, detail=f"GVP '{gvp_id}' was not found in the final prediction data.")

    record = _model_record(matches.iloc[0])
    key = _cache_key(record)
    cached = CACHE_COLLECTION.find_one({"_id": key})
    if cached and not refresh:
        return {
            "gvp_id": gvp_id,
            "cached": True,
            "model": cached["model"],
            "generated_at": cached["generated_at"],
            "prediction": record,
            "explanation": cached["explanation"],
        }

    try:
        explanation = generate_gvp_explanation(record)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Groq explanation request failed: {exc}") from exc

    generated_at = datetime.now(timezone.utc).isoformat()
    CACHE_COLLECTION.replace_one(
        {"_id": key},
        {
            "_id": key,
            "gvp_id": gvp_id,
            "model": get_groq_model(),
            "generated_at": generated_at,
            "prediction": record,
            "explanation": explanation,
        },
        upsert=True,
    )
    return {
        "gvp_id": gvp_id,
        "cached": False,
        "model": get_groq_model(),
        "generated_at": generated_at,
        "prediction": record,
        "explanation": explanation,
    }
