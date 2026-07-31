"""
routes/status.py — Citizen-facing GVP status lookup endpoint.
"""

import os
import pandas as pd
from fastapi import APIRouter, HTTPException
from app.database import db

router = APIRouter(prefix="/api/status", tags=["Citizen Portal"])

FINAL_CSV_PATH = "data/gvp_final.csv"

@router.get("/{gvp_id}", summary="Get citizen-friendly status for a GVP spot")
def get_citizen_gvp_status(gvp_id: str):
    # Fetch from database
    gvp_doc = db["gvp_locations"].find_one({"_id": gvp_id})
    if not gvp_doc:
        raise HTTPException(status_code=404, detail=f"GVP location '{gvp_id}' not found.")
        
    # Get latest complaint
    latest_complaint = db["complaints"].find_one(
        {"gvp_id": gvp_id},
        sort=[("reported_date", -1)]
    )
    
    # Get latest cleanup
    latest_cleanup = db["cleanups"].find_one(
        {"gvp_id": gvp_id},
        sort=[("cleaned_date", -1)]
    )
    
    # Check risk tier from finalized CSV data
    risk_tier = gvp_doc.get("risk_level", "Medium")
    recommended_action = "Regular monitoring"
    if os.path.exists(FINAL_CSV_PATH):
        df = pd.read_csv(FINAL_CSV_PATH)
        match = df[df["gvp_id"] == gvp_id]
        if not match.empty:
            risk_tier = match.iloc[0].get("computed_risk_tier", risk_tier)
            recommended_action = match.iloc[0].get("recommended_action", recommended_action)
            
    return {
        "gvp_id": gvp_id,
        "current_risk_level": risk_tier,
        "latest_complaint": {
            "id": latest_complaint.get("_id") if latest_complaint else None,
            "status": latest_complaint.get("status") if latest_complaint else "None",
            "reported_date": str(latest_complaint.get("reported_date")) if latest_complaint else None,
            "category": latest_complaint.get("category") if latest_complaint else None
        },
        "latest_cleanup": {
            "id": latest_cleanup.get("_id") if latest_cleanup else None,
            "cleaned_date": str(latest_cleanup.get("cleaned_date")) if latest_cleanup else None,
            "cleaned_by": latest_cleanup.get("cleaned_by") if latest_cleanup else None
        },
        "action_plan": recommended_action
    }
