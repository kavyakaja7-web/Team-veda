"""
models/complaint.py — Pydantic models for Complaints.
"""

from datetime import date
from typing import Literal, Optional
from pydantic import BaseModel, Field


class ComplaintModel(BaseModel):
    id: str = Field(..., alias="_id", description="Unique complaint identifier, e.g. COM001")
    gvp_id: str = Field(..., description="Referenced GVP identifier, e.g. GVP001")
    ward: Optional[int] = Field(None, description="Municipal ward number")
    status: str = Field(..., description="Status of complaint (Open | In Progress | Resolved | Pending)")
    category: str = Field(..., description="Category of complaint (e.g., Overflow, Odor, Dumping)")
    description: Optional[str] = Field(None, description="Detailed description of the complaint")
    reported_date: date = Field(..., description="ISO-8601 date of the report")
    resolved_date: Optional[date] = Field(None, description="ISO-8601 date of resolution")

    model_config = {
        "populate_by_name": True,
        "json_schema_extra": {
            "example": {
                "_id": "COM001",
                "gvp_id": "GVP001",
                "ward": 18,
                "status": "Open",
                "category": "Overflow",
                "description": "Garbage overflowing near the market",
                "reported_date": "2025-02-15",
                "resolved_date": None,
            }
        },
    }


class ComplaintCreate(BaseModel):
    id: Optional[str] = Field(None, alias="_id", description="Optional unique complaint identifier. Generated if not provided.")
    gvp_id: str = Field(..., description="Referenced GVP identifier, e.g. GVP001")
    ward: Optional[int] = Field(None, description="Municipal ward number")
    status: str = Field("Open", description="Status of complaint")
    category: str = Field(..., description="Category of complaint (e.g., Overflow, Odor, Dumping)")
    description: Optional[str] = Field(None, description="Detailed description of the complaint")
    reported_date: date = Field(..., description="ISO-8601 date of the report")
    resolved_date: Optional[date] = Field(None, description="ISO-8601 date of resolution")

    model_config = {
        "populate_by_name": True,
        "json_schema_extra": {
            "example": {
                "_id": "COM001",
                "gvp_id": "GVP001",
                "ward": 18,
                "status": "Open",
                "category": "Overflow",
                "description": "Garbage overflowing near the market",
                "reported_date": "2025-02-15",
                "resolved_date": None,
            }
        },
    }


class ComplaintUpdate(BaseModel):
    gvp_id: Optional[str] = Field(None, description="Referenced GVP identifier, e.g. GVP001")
    ward: Optional[int] = Field(None, description="Municipal ward number")
    status: Optional[str] = Field(None, description="Status of complaint")
    category: Optional[str] = Field(None, description="Category of complaint (e.g., Overflow, Odor, Dumping)")
    description: Optional[str] = Field(None, description="Detailed description of the complaint")
    reported_date: Optional[date] = Field(None, description="ISO-8601 date of the report")
    resolved_date: Optional[date] = Field(None, description="ISO-8601 date of resolution")

    model_config = {
        "populate_by_name": True,
        "json_schema_extra": {
            "example": {
                "status": "In Progress",
                "description": "Assigned to ward sanitary inspector",
            }
        },
    }
