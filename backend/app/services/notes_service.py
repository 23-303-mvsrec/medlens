from datetime import datetime
from typing import List, Dict, Any, Optional
from bson import ObjectId
from ..config.db import get_database
from ..schemas.note_schema import NoteCreate

class NotesService:
    def __init__(self):
        self.collection_name = "notes"

    async def create_note(self, note_data: NoteCreate, doctor_id: str) -> Dict[str, Any]:
        db = get_database()
        note_dict = note_data.dict()
        note_dict["created_at"] = datetime.utcnow()
        note_dict["patient_id"] = ObjectId(note_dict["patient_id"])
        note_dict["doctor_id"] = ObjectId(doctor_id)
        
        if note_dict.get("document_id"):
            note_dict["document_id"] = ObjectId(note_dict["document_id"])
        
        result = await db[self.collection_name].insert_one(note_dict)
        note_dict["_id"] = result.inserted_id
        
        return self._format_note(note_dict)

    async def get_patient_notes(self, patient_id: str) -> List[Dict[str, Any]]:
        db = get_database()
        # Fetch without server-side sort to avoid CosmosDB index requirements
        notes = await db[self.collection_name].find(
            {"patient_id": ObjectId(patient_id)}
        ).to_list(100)
        # Sort in memory by created_at descending
        notes.sort(key=lambda x: x.get("created_at", datetime.min), reverse=True)
        return [self._format_note(note) for note in notes]

    async def delete_note(self, note_id: str, doctor_id: Optional[str]) -> bool:
        db = get_database()
        
        query = {"_id": ObjectId(note_id)}
        if doctor_id:
            query["doctor_id"] = ObjectId(doctor_id)
            
        result = await db[self.collection_name].delete_one(query)
        return result.deleted_count > 0

    def _format_note(self, note: Dict[str, Any]) -> Dict[str, Any]:
        note["id"] = str(note["_id"])
        note["patient_id"] = str(note["patient_id"])
        if "doctor_id" in note:
            note["doctor_id"] = str(note["doctor_id"])
        else:
            note["doctor_id"] = ""
        if note.get("document_id"):
            note["document_id"] = str(note["document_id"])
        return note

notes_service = NotesService()
