from fastapi import APIRouter, Depends, status, HTTPException, Query
from typing import List
from ..schemas.prescription_schema import PrescriptionCreate, PrescriptionResponse
from ..services.prescription_service import prescription_service
from ..utils.dependencies import require_doctor, require_role

router = APIRouter(prefix="/prescriptions", tags=["Prescriptions"])

@router.post("/", response_model=PrescriptionResponse, status_code=status.HTTP_201_CREATED)
async def create_prescription(
    data: PrescriptionCreate,
    current_user: dict = Depends(require_doctor)
):
    """Create a new prescription."""
    doctor_id = current_user.get("doctor_id")
    
    # If user is an admin without a doctor_id, they must provide one in the request
    if not doctor_id:
        if data.doctor_id:
            doctor_id = data.doctor_id
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current user is not associated with a doctor profile. Please provide a doctor_id."
            )
            
    row = await prescription_service.create_prescription(data, doctor_id)
    return PrescriptionResponse.model_validate(row)

@router.get("/", response_model=List[PrescriptionResponse])
async def get_prescriptions(
    patient_id: str = Query(...),
    current_user: dict = Depends(require_doctor)
):
    """Get all prescriptions for a specific patient."""
    rows = await prescription_service.get_patient_prescriptions(patient_id)
    return [PrescriptionResponse.model_validate(r) for r in rows]

@router.get("/{id}", response_model=PrescriptionResponse)
async def get_prescription(
    id: str,
    current_user: dict = Depends(require_doctor)
):
    """Get a specific prescription by ID."""
    prescription = await prescription_service.get_prescription(id)
    if not prescription:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prescription not found")
    return PrescriptionResponse.model_validate(prescription)
