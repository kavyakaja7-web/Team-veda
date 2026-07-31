"""
models/gvp.py — Pydantic models for Garbage Vulnerable Points (GVPs).
"""

from datetime import date
from typing import Literal, List
from pydantic import BaseModel, Field


class GeoJSONPoint(BaseModel):
    type: Literal["Point"] = "Point"
    coordinates: List[float] = Field(
        ...,
        description="[longitude, latitude] in WGS-84",
        min_length=2,
        max_length=2,
    )


class GVPModel(BaseModel):
    id: str = Field(..., alias="_id", description="Unique GVP identifier, e.g. GVP001")
    ward: int = Field(..., description="Municipal ward number")
    location: GeoJSONPoint = Field(..., description="GeoJSON Point (lon, lat)")
    near_market: bool
    near_school: bool
    near_bus_stop: bool
    distance_to_bin_m: int = Field(..., description="Distance to nearest bin in metres")
    bin_count_within_100m: int = Field(..., description="Number of bins within 100 m")
    collection_frequency_per_week: int = Field(..., description="Collections per week")
    road_type: Literal["main", "interior"]
    zone_type: Literal["residential", "commercial", "mixed"]
    population_density: Literal["low", "medium", "high"]
    first_reported_date: date = Field(..., description="ISO-8601 date of first report")
    original_black_spot: bool = Field(
        ..., description="True if this was an original black-spot before remediation"
    )
    risk_level: Literal["Low", "Medium", "High"]

    model_config = {
        "populate_by_name": True,       # allow both `_id` and `id`
        "json_schema_extra": {
            "example": {
                "_id": "GVP001",
                "ward": 12,
                "location": {"type": "Point", "coordinates": [83.3012, 17.7231]},
                "near_market": True,
                "near_school": False,
                "near_bus_stop": True,
                "distance_to_bin_m": 180,
                "bin_count_within_100m": 1,
                "collection_frequency_per_week": 3,
                "road_type": "main",
                "zone_type": "commercial",
                "population_density": "high",
                "first_reported_date": "2025-02-10",
                "original_black_spot": True,
                "risk_level": "High",
            }
        },
    }
