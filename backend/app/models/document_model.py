from datetime import datetime
from typing import Annotated, Optional
from pydantic import BaseModel, Field, BeforeValidator
from bson import ObjectId

# Represents an ObjID from MongoDB as a str for Pydantic
PyObjectId = Annotated[str, BeforeValidator(str)]

class DocumentDB(BaseModel):
    """Represents a document document in the 'documents' collection."""
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    patient_id: PyObjectId
    file_url: str
    file_name: str
    file_type: str  # X-ray, MRI, CT, etc.
    
    # New structured fields
    scan_date: Optional[datetime] = None
    body_part: Optional[str] = None
    department: Optional[str] = None
    referring_doctor_id: Optional[PyObjectId] = None
    
    findings: Optional[str] = None
    impression: Optional[str] = None
    
    symptoms: Optional[str] = None
    clinical_history: Optional[str] = None
    reason_for_scan: Optional[str] = None
    doctor_notes: Optional[str] = None
    
    notes: Optional[str] = None # Legacy field
    uploaded_by: PyObjectId  # User ID of the uploader
    created_at: datetime = Field(default_factory=datetime.utcnow)


class DocumentStudyDB(BaseModel):
    """Represents a grouped document study (e.g. one MRI session)."""
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    patient_id: PyObjectId
    study_type: str  # X-ray, MRI, CT, etc.
    body_part: Optional[str] = None
    scan_date: Optional[datetime] = None
    department: Optional[str] = None
    referring_doctor_id: Optional[PyObjectId] = None
    
    findings: Optional[str] = None
    impression: Optional[str] = None
    
    symptoms: Optional[str] = None
    clinical_history: Optional[str] = None
    reason_for_scan: Optional[str] = None
    doctor_notes: Optional[str] = None
    
    uploaded_by: PyObjectId
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}

class StudyFileDB(BaseModel):
    """Represents an individual file belonging to a study."""
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    study_id: PyObjectId
    file_url: str
    file_name: str
    file_format: str  # jpg, pdf, png, etc.
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}

