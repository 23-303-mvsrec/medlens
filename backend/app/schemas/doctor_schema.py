from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from datetime import datetime

class AvailabilitySchema(BaseModel):
    day_of_week: str
    start_time: str
    end_time: str
    consultation_duration: int
    is_leave: bool = False

class DoctorCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    specialization: str
    sub_specialization: Optional[str] = None
    qualifications: List[str]
    experience_years: int
    registration_number: str
    consultation_fee: float
    followup_fee: float
    primary_department_id: str
    secondary_department_ids: List[str] = []

class DoctorUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    specialization: Optional[str] = None
    sub_specialization: Optional[str] = None
    qualifications: Optional[List[str]] = None
    experience_years: Optional[int] = None
    registration_number: Optional[str] = None
    consultation_fee: Optional[float] = None
    followup_fee: Optional[float] = None

class DepartmentInfo(BaseModel):
    id: str
    name: str
    is_primary: bool

class DoctorResponse(BaseModel):
    id: str
    name: str
    email: EmailStr
    specialization: str
    sub_specialization: Optional[str] = None
    qualifications: List[str]
    experience_years: int
    registration_number: str
    consultation_fee: float
    followup_fee: float
    departments: List[DepartmentInfo]
    created_at: datetime

class DoctorAvailabilityResponse(AvailabilitySchema):
    id: str
    doctor_id: str
