from datetime import datetime
from typing import Annotated, Optional
from pydantic import BaseModel, Field, BeforeValidator, EmailStr
from bson import ObjectId

# Represents an ObjID from MongoDB as a str for Pydantic
PyObjectId = Annotated[str, BeforeValidator(str)]

class PatientDB(BaseModel):
    """Represents a patient document in the 'patients' collection."""
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    mrn: str  # Medical Record Number
    full_name: str
    dob: str  # YYYY-MM-DD
    gender: str
    blood_group: str
    phone: str
    email: Optional[EmailStr] = None
    address: str
    emergency_contact: str
    insurance_info: Optional[str] = None
    assigned_doctor_id: Optional[PyObjectId] = None
    status: str = "active"  # active | admitted | discharged | follow-up
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}

class CounterDB(BaseModel):
    """Represents a counter for atomic MRN generation."""
    id: str = Field(alias="_id")
    sequence_value: int

    class Config:
        populate_by_name = True
