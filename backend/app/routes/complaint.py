"""
routes/complaint.py — Complaint API endpoints.

Endpoints:
  GET    /api/complaints              — List complaints with optional filtering
  GET    /api/complaints/{id}         — Get a single complaint by ID
  POST   /api/complaints              — Create a new complaint
  PUT    /api/complaints/{id}         — Update a complaint
  DELETE /api/complaints/{id}         — Delete a complaint
"""

import uuid
from datetime import date, datetime
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, status

from app.database import db
from app.models.complaint import ComplaintModel, ComplaintCreate, ComplaintUpdate

router = APIRouter(prefix="/api/complaints", tags=["Complaints"])

COLLECTION = db["complaints"]


def _doc_to_complaint(doc: dict) -> dict:
    """Convert a raw MongoDB document to a ComplaintModel-compatible dict."""
    if not doc:
        return doc
    
    # Handle reported_date conversion
    if "reported_date" in doc:
        val = doc["reported_date"]
        if isinstance(val, (datetime, date)):
            doc["reported_date"] = val.strftime("%Y-%m-%d")
        else:
            doc["reported_date"] = str(val).strip()

    # Handle resolved_date conversion
    if "resolved_date" in doc and doc["resolved_date"] is not None:
        val = doc["resolved_date"]
        if isinstance(val, (datetime, date)):
            doc["resolved_date"] = val.strftime("%Y-%m-%d")
        else:
            doc["resolved_date"] = str(val).strip()

    return doc


# ---------------------------------------------------------------------------
# GET /api/complaints  — list / filter
# ---------------------------------------------------------------------------
@router.get(
    "",
    response_model=List[ComplaintModel],
    summary="List all complaints",
    description="Returns all complaints. Optionally filter by ward, status, category, gvp_id, and reported_date range.",
)
def list_complaints(
    gvp_id: Optional[str] = Query(None, description="Filter by GVP ID"),
    ward: Optional[int] = Query(None, description="Filter by ward number"),
    status: Optional[str] = Query(None, description="Filter by status: Open | In Progress | Resolved"),
    category: Optional[str] = Query(None, description="Filter by category"),
    start_date: Optional[date] = Query(None, description="Start date of reported_date range (inclusive)"),
    end_date: Optional[date] = Query(None, description="End date of reported_date range (inclusive)"),
):
    query: dict = {}
    if gvp_id:
        query["gvp_id"] = gvp_id
    if ward is not None:
        query["ward"] = ward
    if status:
        query["status"] = status
    if category:
        query["category"] = category

    # Date range filtering on reported_date
    if start_date or end_date:
        date_filter = {}
        if start_date:
            date_filter["$gte"] = start_date.strftime("%Y-%m-%d")
        if end_date:
            date_filter["$lte"] = end_date.strftime("%Y-%m-%d")
        query["reported_date"] = date_filter

    docs = [_doc_to_complaint(doc) for doc in COLLECTION.find(query)]
    return [ComplaintModel(**doc) for doc in docs]


# ---------------------------------------------------------------------------
# GET /api/complaints/{complaint_id}  — single complaint
# ---------------------------------------------------------------------------
@router.get(
    "/{complaint_id}",
    response_model=ComplaintModel,
    summary="Get a single complaint by ID",
)
def get_complaint(complaint_id: str):
    doc = COLLECTION.find_one({"_id": complaint_id})
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Complaint '{complaint_id}' not found",
        )
    return ComplaintModel(**_doc_to_complaint(doc))


# ---------------------------------------------------------------------------
# POST /api/complaints  — create
# ---------------------------------------------------------------------------
@router.post(
    "",
    response_model=ComplaintModel,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new complaint",
)
def create_complaint(complaint_in: ComplaintCreate):
    # Convert model to dict
    doc = complaint_in.model_dump(by_alias=True)

    # Generate _id if not provided
    if not doc.get("_id"):
        doc["_id"] = f"COM-{uuid.uuid4().hex[:8].upper()}"

    # Ensure dates are stored as string ISO format (YYYY-MM-DD)
    if isinstance(doc.get("reported_date"), (date, datetime)):
        doc["reported_date"] = doc["reported_date"].strftime("%Y-%m-%d")
    if isinstance(doc.get("resolved_date"), (date, datetime)):
        doc["resolved_date"] = doc["resolved_date"].strftime("%Y-%m-%d")

    # Check if duplicate ID exists
    if COLLECTION.find_one({"_id": doc["_id"]}):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Complaint with ID '{doc['_id']}' already exists",
        )

    # Insert into database
    COLLECTION.insert_one(doc)
    
    # Retrieve and return
    inserted_doc = COLLECTION.find_one({"_id": doc["_id"]})
    return ComplaintModel(**_doc_to_complaint(inserted_doc))


# ---------------------------------------------------------------------------
# PUT /api/complaints/{complaint_id}  — update
# ---------------------------------------------------------------------------
@router.put(
    "/{complaint_id}",
    response_model=ComplaintModel,
    summary="Update a complaint by ID",
)
def update_complaint(complaint_id: str, complaint_in: ComplaintUpdate):
    # Check if document exists
    existing = COLLECTION.find_one({"_id": complaint_id})
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Complaint '{complaint_id}' not found",
        )

    # Filter out fields that are None
    update_data = {k: v for k, v in complaint_in.model_dump(exclude_unset=True).items() if v is not None}

    # Format dates to string
    if "reported_date" in update_data and isinstance(update_data["reported_date"], (date, datetime)):
        update_data["reported_date"] = update_data["reported_date"].strftime("%Y-%m-%d")
    if "resolved_date" in update_data and isinstance(update_data["resolved_date"], (date, datetime)):
        update_data["resolved_date"] = update_data["resolved_date"].strftime("%Y-%m-%d")

    if update_data:
        COLLECTION.update_one({"_id": complaint_id}, {"$set": update_data})

    updated_doc = COLLECTION.find_one({"_id": complaint_id})
    return ComplaintModel(**_doc_to_complaint(updated_doc))


# ---------------------------------------------------------------------------
# DELETE /api/complaints/{complaint_id}  — delete
# ---------------------------------------------------------------------------
@router.delete(
    "/{complaint_id}",
    summary="Delete a complaint by ID",
)
def delete_complaint(complaint_id: str):
    result = COLLECTION.delete_one({"_id": complaint_id})
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Complaint '{complaint_id}' not found",
        )
    return {"detail": f"Complaint '{complaint_id}' deleted successfully"}
