from __future__ import annotations

from datetime import datetime
from typing import Any, List, Optional

from bson import ObjectId
from pydantic import BaseModel, model_validator


def _strip_object_ids(value: Any) -> Any:
    """Cosmos/Mongo may store ObjectIds in fields typed as str; jsonable_encoder cannot handle them."""
    if value is None:
        return None
    if isinstance(value, ObjectId):
        return str(value)
    if getattr(type(value), "__name__", None) == "ObjectId":
        return str(value)
    if isinstance(value, dict):
        return {k: _strip_object_ids(v) for k, v in value.items()}
    if isinstance(value, list):
        return [_strip_object_ids(v) for v in value]
    if isinstance(value, tuple):
        return tuple(_strip_object_ids(v) for v in value)
    return value

class DocumentResponse(BaseModel):
    id: str
    patient_id: str
    file_url: str
    file_name: str
    file_type: str
    
    scan_date: Optional[datetime] = None
    body_part: Optional[str] = None
    department: Optional[str] = None
    referring_doctor_id: Optional[str] = None
    
    findings: Optional[str] = None
    impression: Optional[str] = None
    
    symptoms: Optional[str] = None
    clinical_history: Optional[str] = None
    reason_for_scan: Optional[str] = None
    doctor_notes: Optional[str] = None
    
    notes: Optional[str] = None
    uploaded_by: str
    created_at: datetime


class RepositoryItem(BaseModel):
    app_id: str
    patient_name: str
    mrn: str
    department: str
    document_types: List[str]
    files_count: int
    latest_activity: datetime
    patient_id: str

class RepositoryResponse(BaseModel):
    data: List[RepositoryItem]
    total: int


class StudyFileResponse(BaseModel):
    id: str
    study_id: str
    file_url: str
    file_name: str
    file_format: str
    created_at: datetime

    @model_validator(mode="before")
    @classmethod
    def _strip_bson(cls, data: Any) -> Any:
        if isinstance(data, dict):
            return _strip_object_ids(data)
        return data


class StudyResponse(BaseModel):
    id: str
    patient_id: str
    study_type: str
    body_part: Optional[str] = None
    scan_date: Optional[datetime] = None
    department: Optional[str] = None
    referring_doctor_id: Optional[str] = None
    
    findings: Optional[str] = None
    impression: Optional[str] = None
    
    symptoms: Optional[str] = None
    clinical_history: Optional[str] = None
    reason_for_scan: Optional[str] = None
    doctor_notes: Optional[str] = None
    
    uploaded_by: str
    created_at: datetime

    files: List[StudyFileResponse] = []

    @model_validator(mode="before")
    @classmethod
    def _strip_bson(cls, data: Any) -> Any:
        if isinstance(data, dict):
            return _strip_object_ids(data)
        return data
