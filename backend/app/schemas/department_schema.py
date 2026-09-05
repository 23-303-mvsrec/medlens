from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class DepartmentCreate(BaseModel):
    """Schema for creating a new department (Admin only)."""

    name: str = Field(..., min_length=2, max_length=100)
    code: str = Field(..., min_length=1, max_length=20, description="Unique department code, e.g. CARD")
    floor: Optional[str] = ""
    hod_id: Optional[str] = None
    total_beds: int = Field(default=0, ge=0)
    icu_slots: int = Field(default=0, ge=0)


class DepartmentUpdate(BaseModel):
    """Schema for partial updates — all fields optional."""

    name: Optional[str] = Field(default=None, min_length=2, max_length=100)
    code: Optional[str] = Field(default=None, min_length=1, max_length=20)
    floor: Optional[str] = None
    total_beds: Optional[int] = Field(default=None, ge=0)
    available_beds: Optional[int] = Field(default=None, ge=0)
    icu_slots: Optional[int] = Field(default=None, ge=0)


class AssignHODSchema(BaseModel):
    """Schema for assigning a Head of Department to a department."""

    doctor_id: str = Field(..., description="MongoDB ObjectId of the doctor user")


class DepartmentResponse(BaseModel):
    """Schema returned in API responses — flat, JSON-friendly."""

    id: str
    name: str
    code: str
    floor: Optional[str] = ""
    hod_id: Optional[str] = None
    hod_name: Optional[str] = None
    total_beds: int
    available_beds: int
    icu_slots: int
    created_at: datetime
    updated_at: datetime
