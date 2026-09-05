from datetime import datetime
from typing import Annotated, Optional, List
from pydantic import BaseModel, Field, BeforeValidator, EmailStr
from bson import ObjectId

# Represents an ObjID from MongoDB as a str for Pydantic
PyObjectId = Annotated[str, BeforeValidator(str)]

class DoctorDB(BaseModel):
    """Represents a doctor document in the 'doctors' collection."""
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    name: str
    email: EmailStr
    password: str  # Hashed
    specialization: str
    sub_specialization: Optional[str] = None
    qualifications: List[str] = []
    experience_years: int
    registration_number: str
    consultation_fee: float
    followup_fee: float
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}

class DoctorDepartmentDB(BaseModel):
    """Represents a doctor-department mapping in 'doctor_departments' collection."""
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    doctor_id: PyObjectId
    department_id: PyObjectId
    is_primary: bool = False

    class Config:
        populate_by_name = True

class DoctorAvailabilityDB(BaseModel):
    """Represents doctor availability in 'doctor_availability' collection."""
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    doctor_id: PyObjectId
    day_of_week: str  # Monday, Tuesday, etc.
    start_time: str   # HH:MM
    end_time: str     # HH:MM
    consultation_duration: int  # in minutes
    is_leave: bool = False

    class Config:
        populate_by_name = True
