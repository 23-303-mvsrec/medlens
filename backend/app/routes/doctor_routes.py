from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from ..services.doctor_service import doctor_service
from ..schemas.doctor_schema import DoctorCreate, DoctorUpdate, DoctorResponse, AvailabilitySchema, DoctorAvailabilityResponse
from ..utils.dependencies import get_current_user

router = APIRouter(prefix="/doctors", tags=["Doctors"])

async def admin_required(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user

async def doctor_or_admin_required(doctor_id: str, current_user: dict = Depends(get_current_user)):
    # Admin can access anything
    if current_user.get("role") == "admin":
        return current_user
    # Doctor can only access their own profile
    if current_user.get("role") == "doctor" and current_user.get("doctor_id") == doctor_id:
        return current_user
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="You do not have permission to access this resource"
    )

@router.post("", response_model=DoctorResponse, status_code=status.HTTP_201_CREATED)
async def create_doctor(data: DoctorCreate, _: dict = Depends(admin_required)):
    """Create a new doctor (Admin only)."""
    return await doctor_service.create_doctor(data)

@router.get("", response_model=List[DoctorResponse])
async def get_doctors(
    name: Optional[str] = Query(None),
    specialization: Optional[str] = Query(None),
    department_id: Optional[str] = Query(None)
):
    """Get all doctors with optional filters."""
    return await doctor_service.get_doctors(name or "", specialization or "", department_id or "")

@router.get("/{id}", response_model=DoctorResponse)
async def get_doctor(id: str):
    """Get a single doctor by ID."""
    return await doctor_service.get_doctor_by_id(id)

@router.patch("/{id}", response_model=DoctorResponse)
async def update_doctor(id: str, data: DoctorUpdate, current_user: dict = Depends(get_current_user)):
    """Update doctor info (Admin or the Doctor themselves)."""
    await doctor_or_admin_required(id, current_user)
    return await doctor_service.update_doctor(id, data)

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_doctor(id: str, _: dict = Depends(admin_required)):
    """Delete a doctor (Admin only)."""
    await doctor_service.delete_doctor(id)
    return None

# Availability Endpoints

@router.post("/{id}/availability", response_model=DoctorAvailabilityResponse)
async def add_availability(id: str, data: AvailabilitySchema, current_user: dict = Depends(get_current_user)):
    """Add availability slot (Admin or the Doctor themselves)."""
    await doctor_or_admin_required(id, current_user)
    return await doctor_service.add_availability(id, data)

@router.get("/{id}/availability", response_model=List[DoctorAvailabilityResponse])
async def get_availability(id: str):
    """Get availability for a doctor."""
    return await doctor_service.get_availability(id)

# Global Availability endpoint for slot deletion
@router.delete("/availability/{slot_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_availability(slot_id: str, current_user: dict = Depends(get_current_user)):
    """Delete an availability slot (Admin or the Doctor owning the slot)."""
    # For deletion, we'd ideally verify ownership. 
    # To keep it simple but secure, we fetch the slot first to get the doctor_id.
    from ..config.db import get_database
    from bson import ObjectId
    db = get_database()
    slot = await db.doctor_availability.find_one({"_id": ObjectId(slot_id)})
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")
    
    await doctor_or_admin_required(str(slot["doctor_id"]), current_user)
    await doctor_service.delete_availability_slot(slot_id)
    return None
