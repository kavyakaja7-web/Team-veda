"""
models/cleanup.py — Pydantic models for Cleanups.
"""

from datetime import date
from typing import Optional
from pydantic import BaseModel, Field


class CleanupModel(BaseModel):
    id: str = Field(..., alias="_id", description="Unique cleanup activity identifier, e.g. CLN001")
    gvp_id: str = Field(..., description="Referenced GVP identifier, e.g. GVP001")
    cleaned_date: date = Field(..., description="ISO-8601 date when cleanup was performed")
    cleaned_by: str = Field(..., description="Name/ID of the cleanup operations team")
    waste_collected_kg: Optional[float] = Field(None, description="Weight of waste collected in kilograms")
    duration_hours: Optional[float] = Field(None, description="Time spent on cleanup in hours")

    model_config = {
        "populate_by_name": True,
        "json_schema_extra": {
            "example": {
                "_id": "CLN001",
                "gvp_id": "GVP001",
                "cleaned_date": "2025-02-18",
                "cleaned_by": "Green Force 1",
                "waste_collected_kg": 150.5,
                "duration_hours": 2.5,
            }
        },
    }


class CleanupCreate(BaseModel):
    id: Optional[str] = Field(None, alias="_id", description="Optional unique cleanup identifier. Generated if not provided.")
    gvp_id: str = Field(..., description="Referenced GVP identifier, e.g. GVP001")
    cleaned_date: date = Field(..., description="ISO-8601 date when cleanup was performed")
    cleaned_by: str = Field(..., description="Name/ID of the cleanup operations team")
    waste_collected_kg: Optional[float] = Field(None, description="Weight of waste collected in kilograms")
    duration_hours: Optional[float] = Field(None, description="Time spent on cleanup in hours")

    model_config = {
        "populate_by_name": True,
        "json_schema_extra": {
            "example": {
                "_id": "CLN001",
                "gvp_id": "GVP001",
                "cleaned_date": "2025-02-18",
                "cleaned_by": "Green Force 1",
                "waste_collected_kg": 150.5,
                "duration_hours": 2.5,
            }
        },
    }


class CleanupUpdate(BaseModel):
    gvp_id: Optional[str] = Field(None, description="Referenced GVP identifier, e.g. GVP001")
    cleaned_date: Optional[date] = Field(None, description="ISO-8601 date when cleanup was performed")
    cleaned_by: Optional[str] = Field(None, description="Name/ID of the cleanup operations team")
    waste_collected_kg: Optional[float] = Field(None, description="Weight of waste collected in kilograms")
    duration_hours: Optional[float] = Field(None, description="Time spent on cleanup in hours")

    model_config = {
        "populate_by_name": True,
        "json_schema_extra": {
            "example": {
                "cleaned_by": "Green Force 2",
                "waste_collected_kg": 200.0,
            }
        },
    }
