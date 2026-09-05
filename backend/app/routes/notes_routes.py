from fastapi import APIRouter, Depends, status, HTTPException, Query
from typing import List, Optional
from ..schemas.note_schema import NoteCreate, NoteResponse
from ..services.notes_service import notes_service
from ..utils.dependencies import require_doctor, require_role

router = APIRouter(prefix="/notes", tags=["Notes"])

@router.post("/", response_model=NoteResponse, status_code=status.HTTP_201_CREATED)
async def create_note(
    note_data: NoteCreate,
    current_user: dict = Depends(require_doctor)
):
    """Create a new clinical observation."""
    doctor_id = current_user.get("doctor_id")
    
    # If user is an admin without a doctor_id, they must provide one in the request
    if not doctor_id:
        if note_data.doctor_id:
            doctor_id = note_data.doctor_id
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current user is not associated with a doctor profile. Please provide a doctor_id."
            )
            
    return await notes_service.create_note(note_data, doctor_id)

@router.get("/patient/{patient_id}", response_model=List[NoteResponse])
async def get_notes_by_patient(
    patient_id: str,
    current_user: dict = Depends(require_doctor)
):
    """Get all clinical notes for a specific patient (path param version)."""
    return await notes_service.get_patient_notes(patient_id)

@router.get("/", response_model=List[NoteResponse])
async def get_notes(
    patient_id: str = Query(...),
    current_user: dict = Depends(require_doctor)
):
    """Get all clinical notes for a specific patient (query param version)."""
    return await notes_service.get_patient_notes(patient_id)

@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_note(
    note_id: str,
    current_user: dict = Depends(require_doctor)
):
    """Delete a specific note."""
    doctor_id = current_user.get("doctor_id")
    is_admin = current_user.get("role") == "admin"
    
    # If not admin and no doctor_id, then error
    if not doctor_id and not is_admin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current user is not associated with a doctor profile"
        )
    
    # Admin can delete any note, so we pass None for doctor_id to the service
    # if it's an admin, or we let the service handle the check.
    success = await notes_service.delete_note(note_id, doctor_id if not is_admin else None)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found or you don't have permission to delete it"
        )
    return None
