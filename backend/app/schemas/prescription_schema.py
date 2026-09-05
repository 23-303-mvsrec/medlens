from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional


class MedicationItem(BaseModel):
    """A single medication row in the prescription."""
    name: str
    dosage: str
    frequency: str
    duration: str
    instructions: str = ""


class PrescriptionCreate(BaseModel):
    """Payload accepted when creating a new prescription."""
    patient_id: str
    doctor_id: Optional[str] = None
    clinical_notes: str = ""
    medications: List[MedicationItem] = Field(default_factory=list)
    additional_notes: str = ""


class PrescriptionResponse(BaseModel):
    """Prescription data returned to the client."""
    id: str
    patient_id: str
    doctor_id: str
    clinical_notes: str
    medications: List[MedicationItem]
    additional_notes: str
    created_at: datetime

    class Config:
        from_attributes = True
