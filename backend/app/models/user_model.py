from datetime import datetime
from typing import Optional, Annotated
from pydantic import BaseModel, Field, EmailStr, BeforeValidator

# Represents an ObjID from MongoDB as a str for Pydantic
PyObjectId = Annotated[str, BeforeValidator(str)]

class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: str = Field(..., description="'admin' or 'doctor'")
    doctor_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserDB(UserBase):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    password: str

    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "name": "Dr. Smith",
                "email": "smith@apexcare.com",
                "role": "doctor",
                "doctor_id": "DOC001",
                "password": "hashed_password",
                "created_at": "2023-10-27T10:00:00"
            }
        }
