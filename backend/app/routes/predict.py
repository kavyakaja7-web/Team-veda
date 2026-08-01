import os
import joblib
import pandas as pd
import numpy as np
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/api/predict", tags=["Prediction"])

MODEL_PATH = "models/gvp_model.pkl"

# Global variable to cache the loaded model so it doesn't reload on every request
_model_cache = None
_features_cache = None

def load_model():
    global _model_cache, _features_cache
    if _model_cache is None:
        if not os.path.exists(MODEL_PATH):
            raise HTTPException(status_code=500, detail="Trained model not found. Run train_model.py first.")
        try:
            model_data = joblib.load(MODEL_PATH)
            _model_cache = model_data["model"]
            _features_cache = model_data["features"]
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to load model: {str(e)}")

def get_risk_level(score: float) -> str:
    if score >= 0.75:
        return "High"
    elif score >= 0.45:
        return "Medium"
    else:
        return "Low"

class PredictionRequest(BaseModel):
    gvp_id: str
    lat: float
    lon: float
    ward: int
    near_market: bool
    near_school: bool
    complaint_count: int
    days_since_cleanup: int

@router.post("/", summary="Predict GVP recurrence risk using the trained Gradient Boosting model")
def predict_gvp_risk(payload: PredictionRequest):
    load_model()
    
    # Map the simplified API payload to the exact features the model was trained on.
    # We use sensible defaults for features that aren't provided in the payload.
    mapped_features = {
        "distance_to_market_m": 50 if payload.near_market else 500,
        "distance_to_bin_m": 150,  # Default
        "collection_frequency_per_week": 2, # Default
        "days_since_last_cleanup": payload.days_since_cleanup,
        "near_school_num": 1 if payload.near_school else 0,
        "near_bus_stop_num": 0, # Default
        "population_density_num": 1, # Default (Medium)
        "cluster_avg_recurrence_rate": 0.8, # Default baseline
        "cluster_size": 10 # Default
    }
    
    # Create DataFrame with exact feature order
    df = pd.DataFrame([mapped_features], columns=_features_cache)
    
    try:
        raw_pred = _model_cache.predict(df)[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")
        
    # Scale roughly to 0-100 format
    risk_score = int(np.clip(raw_pred * 100, 0, 100))
    risk_level = get_risk_level(risk_score / 100.0)
    
    return {
        "gvp_id": payload.gvp_id,
        "risk_score": risk_score,
        "risk_level": risk_level
    }
