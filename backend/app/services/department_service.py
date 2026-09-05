from fastapi import HTTPException, status
from bson import ObjectId
from datetime import datetime

from ..config.db import get_database
from ..schemas.department_schema import (
    DepartmentCreate,
    DepartmentUpdate,
    AssignHODSchema,
    DepartmentResponse,
)


def _serialize_department(doc: dict) -> DepartmentResponse:
    """Convert a raw MongoDB document to a DepartmentResponse.

    Handles ObjectId → str conversion so the response is always JSON-safe.
    """
    return DepartmentResponse(
        id=str(doc["_id"]),
        name=doc["name"],
        code=doc["code"],
        floor=doc.get("floor", ""),
        hod_id=str(doc["hod_id"]) if doc.get("hod_id") else None,
        hod_name=doc.get("hod_name"),
        total_beds=doc.get("total_beds", 0),
        available_beds=doc.get("available_beds", 0),
        icu_slots=doc.get("icu_slots", 0),
        created_at=doc["created_at"],
        updated_at=doc["updated_at"],
    )


async def create_department(data: DepartmentCreate) -> DepartmentResponse:
    """Insert a new department.  Raises 400 if the code already exists."""
    db = get_database()

    # Enforce unique code constraint at the application level
    existing = await db.departments.find_one({"code": data.code.upper()})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Department with code '{data.code.upper()}' already exists.",
        )

    hod_id = None
    hod_name = None

    if data.hod_id:
        if not ObjectId.is_valid(data.hod_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid doctor ID format.",
            )
        doctor = await db.doctors.find_one({"_id": ObjectId(data.hod_id)})
        if not doctor:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Doctor not found.",
            )
        hod_id = ObjectId(data.hod_id)
        hod_name = doctor["name"]

    now = datetime.utcnow()
    department_doc = {
        "name": data.name,
        "code": data.code.upper(),
        "floor": data.floor or "",
        "hod_id": hod_id,
        "hod_name": hod_name,
        "total_beds": data.total_beds,
        "available_beds": data.total_beds,   # Starts fully available
        "icu_slots": data.icu_slots,
        "created_at": now,
        "updated_at": now,
    }

    result = await db.departments.insert_one(department_doc)
    created = await db.departments.find_one({"_id": result.inserted_id})
    return _serialize_department(created)


async def get_departments(search: str = "") -> list[DepartmentResponse]:
    """Return all departments, optionally filtered by a search term.

    The search is case-insensitive and matches against name and code.
    """
    db = get_database()

    query: dict = {}
    if search:
        # MongoDB regex for case-insensitive partial match
        query = {
            "$or": [
                {"name": {"$regex": search, "$options": "i"}},
                {"code": {"$regex": search, "$options": "i"}},
            ]
        }

    cursor = db.departments.find(query)
    departments = await cursor.to_list(length=None)
    return [_serialize_department(dept) for dept in departments]


async def get_department_by_id(department_id: str) -> DepartmentResponse:
    """Fetch a single department by its MongoDB ObjectId string."""
    if not ObjectId.is_valid(department_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid department ID format.",
        )

    db = get_database()
    doc = await db.departments.find_one({"_id": ObjectId(department_id)})
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department not found.",
        )
    return _serialize_department(doc)


async def update_department(department_id: str, data: DepartmentUpdate) -> DepartmentResponse:
    """Partially update a department's fields (PATCH semantics)."""
    if not ObjectId.is_valid(department_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid department ID format.",
        )

    db = get_database()

    # Only include fields that were explicitly set by the caller
    update_fields = data.model_dump(exclude_none=True)

    if not update_fields:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid fields provided for update.",
        )

    # Normalise code to uppercase if it's being updated
    if "code" in update_fields:
        # Ensure new code is not already taken by another department
        clash = await db.departments.find_one(
            {"code": update_fields["code"].upper(), "_id": {"$ne": ObjectId(department_id)}}
        )
        if clash:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Department code '{update_fields['code'].upper()}' is already in use.",
            )
        update_fields["code"] = update_fields["code"].upper()

    update_fields["updated_at"] = datetime.utcnow()

    result = await db.departments.find_one_and_update(
        {"_id": ObjectId(department_id)},
        {"$set": update_fields},
        return_document=True,  # Motor returns the updated document
    )

    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department not found.",
        )

    return _serialize_department(result)


async def delete_department(department_id: str) -> dict:
    """Hard-delete a department by ID."""
    if not ObjectId.is_valid(department_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid department ID format.",
        )

    db = get_database()
    result = await db.departments.delete_one({"_id": ObjectId(department_id)})

    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department not found.",
        )

    return {"message": "Department deleted successfully."}


async def assign_hod(department_id: str, data: AssignHODSchema) -> DepartmentResponse:
    """Assign a doctor as Head of Department.

    Business rules:
    - The doctor must exist in the users collection.
    - The doctor must have role = 'doctor'.
    - A department can only have one HOD at a time (overwrites previous).
    """
    if not ObjectId.is_valid(department_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid department ID format.",
        )

    if not ObjectId.is_valid(data.doctor_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid doctor ID format.",
        )

    db = get_database()

    # Verify doctor exists
    doctor = await db.doctors.find_one({"_id": ObjectId(data.doctor_id)})
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found.",
        )

    # Persist hod_id (as ObjectId) and hod_name (denormalised string) for fast reads
    updated = await db.departments.find_one_and_update(
        {"_id": ObjectId(department_id)},
        {
            "$set": {
                "hod_id": ObjectId(data.doctor_id),
                "hod_name": doctor["name"],
                "updated_at": datetime.utcnow(),
            }
        },
        return_document=True,
    )

    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department not found.",
        )

    return _serialize_department(updated)
