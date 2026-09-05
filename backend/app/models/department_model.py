from datetime import datetime
from typing import Annotated, Optional
from pydantic import BaseModel, Field
from bson import ObjectId

# Represents a MongoDB ObjectId as a plain string for Pydantic / JSON serialisation
PyObjectId = Annotated[str, Field(default=None)]


class DepartmentDB(BaseModel):
    """Represents a department document as stored in MongoDB."""

    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    name: str
    code: str                         # Must be unique across the collection
    floor: Optional[str] = ""
    hod_id: Optional[str] = None      # ObjectId of the assigned doctor (stored as str)
    hod_name: Optional[str] = None    # Denormalised name for fast UI rendering
    total_beds: int = 0
    available_beds: int = 0
    icu_slots: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True         # Allow both field name and alias
        arbitrary_types_allowed = True  # Allow ObjectId in validators if needed
