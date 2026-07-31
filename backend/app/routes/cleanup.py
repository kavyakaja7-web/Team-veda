"""
routes/cleanup.py — Cleanup API endpoints.

Endpoints:
  GET    /api/cleanups              — List cleanups with optional filtering
  GET    /api/cleanups/{id}         — Get a single cleanup activity by ID
  POST   /api/cleanups              — Record a new cleanup activity
  PUT    /api/cleanups/{id}         — Update a cleanup activity
  DELETE /api/cleanups/{id}         — Delete a cleanup activity
"""

import uuid
from datetime import date, datetime
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, status

from app.database import db
from app.models.cleanup import CleanupModel, CleanupCreate, CleanupUpdate

router = APIRouter(prefix="/api/cleanups", tags=["Cleanups"])

COLLECTION = db["cleanups"]


def _doc_to_cleanup(doc: dict) -> dict:
    """Convert a raw MongoDB document to a CleanupModel-compatible dict."""
    if not doc:
        return doc
    
    # Handle cleaned_date conversion
    if "cleaned_date" in doc:
        val = doc["cleaned_date"]
        if isinstance(val, (datetime, date)):
            doc["cleaned_date"] = val.strftime("%Y-%m-%d")
        else:
            doc["cleaned_date"] = str(val).strip()

    return doc


# ---------------------------------------------------------------------------
# GET /api/cleanups  — list / filter
# ---------------------------------------------------------------------------
@router.get(
    "",
    response_model=List[CleanupModel],
    summary="List all cleanups",
    description="Returns all cleanup records. Optionally filter by gvp_id, cleaned_by, and cleaned_date range.",
)
def list_cleanups(
    gvp_id: Optional[str] = Query(None, description="Filter by GVP ID"),
    cleaned_by: Optional[str] = Query(None, description="Filter by cleanup team name"),
    start_date: Optional[date] = Query(None, description="Start date of cleaned_date range (inclusive)"),
    end_date: Optional[date] = Query(None, description="End date of cleaned_date range (inclusive)"),
):
    query: dict = {}
    if gvp_id:
        query["gvp_id"] = gvp_id
    if cleaned_by:
        query["cleaned_by"] = cleaned_by

    # Date range filtering on cleaned_date
    if start_date or end_date:
        date_filter = {}
        if start_date:
            date_filter["$gte"] = start_date.strftime("%Y-%m-%d")
        if end_date:
            date_filter["$lte"] = end_date.strftime("%Y-%m-%d")
        query["cleaned_date"] = date_filter

    docs = [_doc_to_cleanup(doc) for doc in COLLECTION.find(query)]
    return [CleanupModel(**doc) for doc in docs]


# ---------------------------------------------------------------------------
# GET /api/cleanups/{cleanup_id}  — single cleanup
# ---------------------------------------------------------------------------
@router.get(
    "/{cleanup_id}",
    response_model=CleanupModel,
    summary="Get a single cleanup activity by ID",
)
def get_cleanup(cleanup_id: str):
    doc = COLLECTION.find_one({"_id": cleanup_id})
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cleanup record '{cleanup_id}' not found",
        )
    return CleanupModel(**_doc_to_cleanup(doc))


# ---------------------------------------------------------------------------
# POST /api/cleanups  — create
# ---------------------------------------------------------------------------
@router.post(
    "",
    response_model=CleanupModel,
    status_code=status.HTTP_201_CREATED,
    summary="Record a new cleanup activity",
)
def create_cleanup(cleanup_in: CleanupCreate):
    # Convert model to dict
    doc = cleanup_in.model_dump(by_alias=True)

    # Generate _id if not provided
    if not doc.get("_id"):
        doc["_id"] = f"CLN-{uuid.uuid4().hex[:8].upper()}"

    # Ensure dates are stored as string ISO format (YYYY-MM-DD)
    if isinstance(doc.get("cleaned_date"), (date, datetime)):
        doc["cleaned_date"] = doc["cleaned_date"].strftime("%Y-%m-%d")

    # Check if duplicate ID exists
    if COLLECTION.find_one({"_id": doc["_id"]}):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cleanup record with ID '{doc['_id']}' already exists",
        )

    # Insert into database
    COLLECTION.insert_one(doc)
    
    # Retrieve and return
    inserted_doc = COLLECTION.find_one({"_id": doc["_id"]})
    return CleanupModel(**_doc_to_cleanup(inserted_doc))


# ---------------------------------------------------------------------------
# PUT /api/cleanups/{cleanup_id}  — update
# ---------------------------------------------------------------------------
@router.put(
    "/{cleanup_id}",
    response_model=CleanupModel,
    summary="Update a cleanup activity by ID",
)
def update_cleanup(cleanup_id: str, cleanup_in: CleanupUpdate):
    # Check if document exists
    existing = COLLECTION.find_one({"_id": cleanup_id})
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cleanup record '{cleanup_id}' not found",
        )

    # Filter out fields that are None
    update_data = {k: v for k, v in cleanup_in.model_dump(exclude_unset=True).items() if v is not None}

    # Format dates to string
    if "cleaned_date" in update_data and isinstance(update_data["cleaned_date"], (date, datetime)):
        update_data["cleaned_date"] = update_data["cleaned_date"].strftime("%Y-%m-%d")

    if update_data:
        COLLECTION.update_one({"_id": cleanup_id}, {"$set": update_data})

    updated_doc = COLLECTION.find_one({"_id": cleanup_id})
    return CleanupModel(**_doc_to_cleanup(updated_doc))


# ---------------------------------------------------------------------------
# DELETE /api/cleanups/{cleanup_id}  — delete
# ---------------------------------------------------------------------------
@router.delete(
    "/{cleanup_id}",
    summary="Delete a cleanup activity by ID",
)
def delete_cleanup(cleanup_id: str):
    result = COLLECTION.delete_one({"_id": cleanup_id})
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cleanup record '{cleanup_id}' not found",
        )
    return {"detail": f"Cleanup record '{cleanup_id}' deleted successfully"}
