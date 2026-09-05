from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class NoteBase(BaseModel):
    content: str
    patient_id: str
    doctor_id: Optional[str] = None
    document_id: Optional[str] = None
    note_type: str = "general"

class NoteCreate(NoteBase):
    pass

class NoteResponse(NoteBase):
    id: str
    doctor_id: str
    created_at: datetime

    class Config:
        from_attributes = True
