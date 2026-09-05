from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Union
from datetime import datetime


class EmergencyContactInfo(BaseModel):
    """Structured emergency contact stored in MongoDB for some patient records."""

    name: str
    relation: Optional[str] = None
    phone: str


EmergencyContact = Union[str, EmergencyContactInfo]


class PatientCreate(BaseModel):
    full_name: str
    dob: str
    gender: str
    blood_group: str
    phone: str
    email: Optional[EmailStr] = None
    address: str
    emergency_contact: EmergencyContact
    insurance_info: Optional[str] = None
    assigned_doctor_id: Optional[str] = None

class PatientUpdate(BaseModel):
    full_name: Optional[str] = None
    dob: Optional[str] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    emergency_contact: Optional[EmergencyContact] = None
    insurance_info: Optional[str] = None
    assigned_doctor_id: Optional[str] = None
    status: Optional[str] = None

class PatientStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(active|admitted|discharged|follow-up)$")

class PatientResponse(BaseModel):
    id: str
    mrn: str
    full_name: str
    dob: str
    gender: str
    blood_group: str
    phone: str
    email: Optional[EmailStr] = None
    address: str
    emergency_contact: EmergencyContact
    insurance_info: Optional[str] = None
    assigned_doctor_id: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime

class DuplicatePatientWarning(BaseModel):
    is_duplicate: bool
    existing_mrn: Optional[str] = None
    message: str
    patient_data: PatientResponse
