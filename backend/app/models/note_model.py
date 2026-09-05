from datetime import datetime
from typing import Annotated, Optional
from pydantic import BaseModel, Field, BeforeValidator
from bson import ObjectId

# Represents an ObjID from MongoDB as a str for Pydantic
PyObjectId = Annotated[str, BeforeValidator(str)]

class NoteDB(BaseModel):
    """Represents a clinical note document in the 'notes' collection."""
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    patient_id: PyObjectId
    doctor_id: PyObjectId
    document_id: Optional[PyObjectId] = None
    note_type: str = "general"  # "general" | "document"
    content: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}
