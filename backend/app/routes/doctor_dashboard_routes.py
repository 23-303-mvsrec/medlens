from fastapi import APIRouter, Depends, status, HTTPException
from typing import List, Dict, Any
from ..services.doctor_dashboard_service import doctor_dashboard_service
from ..services.notes_service import notes_service
from ..config.db import get_database
from bson import ObjectId
from ..utils.dependencies import require_doctor

router = APIRouter(tags=["Doctor Dashboard"])

@router.get("/doctor/dashboard")
async def get_dashboard(current_user: dict = Depends(require_doctor)):
    """Fetch summary data for the doctor dashboard."""
    doctor_id = current_user.get("doctor_id")
    if not doctor_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current user is not associated with a doctor profile"
        )
    return await doctor_dashboard_service.get_doctor_dashboard(doctor_id)

@router.get("/doctor/patients")
async def get_my_patients(current_user: dict = Depends(require_doctor)):
    """Fetch patients assigned to the logged-in doctor."""
    doctor_id = current_user.get("doctor_id")
    if not doctor_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current user is not associated with a doctor profile"
        )
    return await doctor_dashboard_service.get_doctor_patients(doctor_id)

@router.get("/doctor/patients/{patient_id}")
async def get_patient_detail(
    patient_id: str,
    current_user: dict = Depends(require_doctor)
):
    """Fetch full patient detail including documents and notes (Doctor View)."""
    db = get_database()
    doctor_id = current_user.get("doctor_id")
    
    # Fetch patient
    patient = await db.patients.find_one({"_id": ObjectId(patient_id)})
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")
    
    # RBAC: Doctor can only view their assigned patients (Strict)
    if current_user.get("role") != "admin" and patient.get("assigned_doctor_id") != str(doctor_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Access denied. Patient is not assigned to you."
        )

    patient["id"] = str(patient["_id"])
    del patient["_id"]

    # Fetch documents
    documents = await db.documents.find({"patient_id": str(patient_id)}).to_list(100)
    for doc in documents:
        doc["id"] = str(doc["_id"])
        del doc["_id"]

    # Fetch notes
    notes = await notes_service.get_patient_notes(patient_id)

    return {
        "patient_info": patient,
        "documents": documents,
        "notes": notes
    }

@router.get("/patients/{patient_id}/timeline")
async def get_timeline(
    patient_id: str,
    current_user: dict = Depends(require_doctor)
):
    """Fetch combined chronological data for a patient."""
    # We could add the same assignment check here for strict RBAC
    return await doctor_dashboard_service.get_patient_timeline(patient_id)
