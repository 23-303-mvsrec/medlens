from datetime import datetime
from typing import Annotated, List, Optional
from pydantic import BaseModel, Field, BeforeValidator
from bson import ObjectId

# Represents an ObjectId from MongoDB as a str for Pydantic
PyObjectId = Annotated[str, BeforeValidator(str)]


class MedicationDB(BaseModel):
    """Represents a single medication row in a prescription."""
    name: str
    dosage: str
    frequency: str
    duration: str
    instructions: str = ""


class PrescriptionDB(BaseModel):
    """Represents a prescription document in the 'prescriptions' collection."""
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    patient_id: PyObjectId
    doctor_id: PyObjectId
    clinical_notes: str = ""
    medications: List[MedicationDB] = Field(default_factory=list)
    additional_notes: str = ""
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}
