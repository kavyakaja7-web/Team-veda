"""
routes/gvp.py — GVP (Garbage Vulnerable Point) API endpoints.

Endpoints:
  GET  /api/gvps                          — list all GVPs with optional filters
  GET  /api/gvps/near                     — geospatial $near search
  GET  /api/gvps/{gvp_id}                 — fetch single GVP by id
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query

from app.database import db
from app.models.gvp import GVPModel

router = APIRouter(prefix="/api/gvps", tags=["GVPs"])

COLLECTION = db["gvp_locations"]


def _doc_to_gvp(doc: dict) -> dict:
    """Convert a raw MongoDB document to a GVPModel-compatible dict."""
    # Ensure first_reported_date is serialised as a string if it's already a date obj
    if "first_reported_date" in doc and not isinstance(
        doc["first_reported_date"], str
    ):
        doc["first_reported_date"] = str(doc["first_reported_date"])
    return doc


# ---------------------------------------------------------------------------
# GET /api/gvps/near  — must be registered BEFORE /{gvp_id} to avoid clash
# ---------------------------------------------------------------------------
@router.get(
    "/near",
    response_model=List[GVPModel],
    summary="Find GVPs near a coordinate",
    description=(
        "Returns GVPs within `radius_m` metres of the given (lat, lon) point "
        "using a MongoDB `$near` geospatial query. Requires a 2dsphere index."
    ),
)
def get_gvps_near(
    lat: float = Query(..., description="Latitude of the search centre"),
    lon: float = Query(..., description="Longitude of the search centre"),
    radius_m: float = Query(1000.0, ge=1, description="Search radius in metres"),
):
    query = {
        "location": {
            "$near": {
                "$geometry": {"type": "Point", "coordinates": [lon, lat]},
                "$maxDistance": radius_m,
            }
        }
    }
    results = [_doc_to_gvp(doc) for doc in COLLECTION.find(query, {"_id": 1})]
    # Re-fetch full docs so we can use the Pydantic model properly
    ids = [r["_id"] for r in results]
    docs = [_doc_to_gvp(doc) for doc in COLLECTION.find({"_id": {"$in": ids}})]
    return [GVPModel(**doc) for doc in docs]


# ---------------------------------------------------------------------------
# GET /api/gvps  — list / filter
# ---------------------------------------------------------------------------
@router.get(
    "",
    response_model=List[GVPModel],
    summary="List all GVPs",
    description="Returns all GVPs. Optionally filter by ward, risk_level, or zone_type.",
)
def list_gvps(
    ward: Optional[int] = Query(None, description="Filter by ward number"),
    risk_level: Optional[str] = Query(
        None, description="Filter by risk level: Low | Medium | High"
    ),
    zone_type: Optional[str] = Query(
        None, description="Filter by zone type: residential | commercial | mixed"
    ),
):
    query: dict = {}
    if ward is not None:
        query["ward"] = ward
    if risk_level:
        query["risk_level"] = risk_level
    if zone_type:
        query["zone_type"] = zone_type

    docs = [_doc_to_gvp(doc) for doc in COLLECTION.find(query)]
    return [GVPModel(**doc) for doc in docs]


# ---------------------------------------------------------------------------
# GET /api/gvps/{gvp_id}  — single GVP
# ---------------------------------------------------------------------------
@router.get(
    "/{gvp_id}",
    response_model=GVPModel,
    summary="Get a single GVP by ID",
)
def get_gvp(gvp_id: str):
    doc = COLLECTION.find_one({"_id": gvp_id})
    if not doc:
        raise HTTPException(status_code=404, detail=f"GVP '{gvp_id}' not found")
    return GVPModel(**_doc_to_gvp(doc))
