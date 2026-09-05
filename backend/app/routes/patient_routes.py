from fastapi import APIRouter, Depends, Query, status
from typing import List, Optional
from ..schemas.patient_schema import PatientCreate, PatientUpdate, PatientResponse, PatientStatusUpdate, DuplicatePatientWarning
from ..services.patient_service import patient_service
from ..utils.dependencies import require_doctor, require_admin

router = APIRouter(prefix="/patients", tags=["Patients"])

@router.post("/", response_model=DuplicatePatientWarning, status_code=status.HTTP_201_CREATED)
async def create_patient(
    patient_data: PatientCreate,
    current_user: dict = Depends(require_doctor)
):
    """Create a new patient with duplicate detection."""
    return await patient_service.create_patient(patient_data)

@router.get("/", response_model=List[PatientResponse])
async def get_patients(
    name: Optional[str] = None,
    mrn: Optional[str] = None,
    phone: Optional[str] = None,
    status: Optional[str] = None,
    doctor_id: Optional[str] = None,
    current_user: dict = Depends(require_doctor)
):
    """Get all patients with filters."""
    filters = {
        "name": name,
        "mrn": mrn,
        "phone": phone,
        "status": status,
        "doctor_id": doctor_id
    }
    
    # If doctor, they might only see their assigned patients?
    # Requirement: "Doctor can view assigned patients"
    if current_user["role"] == "doctor":
        # Check if they should only see their patients
        # For now, let's allow searching all but emphasize their assigned ones if needed
        # Or hard restrict:
        if not current_user.get("doctor_id") and doctor_id:
             filters["doctor_id"] = doctor_id
        elif current_user.get("doctor_id"):
             # Optional: restrict doctors to only their patients unless admin
             # Requirement says "can: view assigned patients"
             # Let's restrict it for doctors if no specific doctor_id is searched
             if not doctor_id:
                filters["doctor_id"] = current_user["doctor_id"]

    return await patient_service.get_patients(filters)

@router.get("/{id}", response_model=PatientResponse)
async def get_patient(
    id: str,
    current_user: dict = Depends(require_doctor)
):
    """Get a single patient by ID."""
    return await patient_service.get_patient_by_id(id)

@router.patch("/{id}", response_model=PatientResponse)
async def update_patient(
    id: str,
    patient_data: PatientUpdate,
    current_user: dict = Depends(require_doctor)
):
    """Update patient details."""
    return await patient_service.update_patient(id, patient_data)

@router.patch("/{id}/status", response_model=PatientResponse)
async def update_patient_status(
    id: str,
    status_data: PatientStatusUpdate,
    current_user: dict = Depends(require_doctor)
):
    """Update patient status (active, admitted, etc.)."""
    return await patient_service.update_patient_status(id, status_data.status)

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_patient(
    id: str,
    current_user: dict = Depends(require_admin)
):
    """Decommission a patient record."""
    await patient_service.delete_patient(id)
    return None
