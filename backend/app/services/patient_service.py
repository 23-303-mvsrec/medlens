from datetime import datetime
from typing import List, Optional, Dict, Any
from bson import ObjectId
from fastapi import HTTPException, status
from ..config.db import get_database
from ..schemas.patient_schema import PatientCreate, PatientUpdate, PatientResponse
from ..utils.mrn_generator import generate_mrn


def _normalize_emergency_contact(value):
    """Ensure Mongo subdocuments map to plain dicts for PatientResponse validation."""
    if value is None or isinstance(value, str):
        return value
    if isinstance(value, dict):
        return value
    if hasattr(value, "keys"):
        return dict(value)
    return value


def _strip_mongo_id(doc: Dict[str, Any]) -> None:
    doc.pop("_id", None)


class PatientService:
    def __init__(self):
        self.collection_name = "patients"

    async def create_patient(self, patient_data: PatientCreate) -> Dict[str, Any]:
        db = get_database()
        
        # Check for duplicates: full_name + dob + phone
        existing_patient = await db[self.collection_name].find_one({
            "full_name": patient_data.full_name,
            "dob": patient_data.dob,
            "phone": patient_data.phone
        })
        
        # Generate MRN
        mrn = await generate_mrn()
        
        patient_dict = patient_data.dict()
        patient_dict["mrn"] = mrn
        patient_dict["created_at"] = datetime.utcnow()
        patient_dict["updated_at"] = datetime.utcnow()
        patient_dict["status"] = "active"
        
        # Convert string IDs to ObjectId
        if patient_dict.get("assigned_doctor_id"):
            patient_dict["assigned_doctor_id"] = ObjectId(patient_dict["assigned_doctor_id"])

        result = await db[self.collection_name].insert_one(patient_dict)
        patient_dict["_id"] = result.inserted_id
        
        # Prepare response
        if patient_dict.get("assigned_doctor_id"):
            patient_dict["assigned_doctor_id"] = str(patient_dict["assigned_doctor_id"])
            
        response_data = PatientResponse(
            id=str(patient_dict["_id"]),
            **{k: v for k, v in patient_dict.items() if k not in ["_id"]}
        )
        
        return {
            "is_duplicate": existing_patient is not None,
            "existing_mrn": existing_patient["mrn"] if existing_patient else None,
            "message": "Patient created successfully" if not existing_patient else "Warning: Potential duplicate patient record found.",
            "patient_data": response_data
        }

    async def get_patients(self, filters: Dict[str, Any]) -> List[Dict[str, Any]]:
        db = get_database()
        query = {}
        
        if filters.get("name"):
            query["full_name"] = {"$regex": filters["name"], "$options": "i"}
        if filters.get("mrn"):
            query["mrn"] = {"$regex": filters["mrn"], "$options": "i"}
        if filters.get("phone"):
            query["phone"] = {"$regex": filters["phone"], "$options": "i"}
        if filters.get("status"):
            query["status"] = filters["status"]
        if filters.get("doctor_id"):
            query["assigned_doctor_id"] = ObjectId(filters["doctor_id"])

        patients = await db[self.collection_name].find(query).to_list(1000)
        
        for patient in patients:
            patient["id"] = str(patient["_id"])
            _strip_mongo_id(patient)
            if patient.get("assigned_doctor_id"):
                patient["assigned_doctor_id"] = str(patient["assigned_doctor_id"])
            if "emergency_contact" in patient:
                patient["emergency_contact"] = _normalize_emergency_contact(
                    patient["emergency_contact"]
                )

        return patients

    async def get_patient_by_id(self, patient_id: str) -> Dict[str, Any]:
        db = get_database()
        patient = await db[self.collection_name].find_one({"_id": ObjectId(patient_id)})
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")
        
        patient["id"] = str(patient["_id"])
        _strip_mongo_id(patient)
        if patient.get("assigned_doctor_id"):
            patient["assigned_doctor_id"] = str(patient["assigned_doctor_id"])
        if "emergency_contact" in patient:
            patient["emergency_contact"] = _normalize_emergency_contact(
                patient["emergency_contact"]
            )
        return patient

    async def update_patient(self, patient_id: str, patient_data: PatientUpdate) -> Dict[str, Any]:
        db = get_database()
        update_dict = {k: v for k, v in patient_data.dict().items() if v is not None}
        
        if not update_dict:
            return await self.get_patient_by_id(patient_id)
            
        update_dict["updated_at"] = datetime.utcnow()
        
        if update_dict.get("assigned_doctor_id"):
            update_dict["assigned_doctor_id"] = ObjectId(update_dict["assigned_doctor_id"])

        result = await db[self.collection_name].update_one(
            {"_id": ObjectId(patient_id)},
            {"$set": update_dict}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Patient not found")
            
        return await self.get_patient_by_id(patient_id)

    async def update_patient_status(self, patient_id: str, status: str) -> Dict[str, Any]:
        db = get_database()
        result = await db[self.collection_name].update_one(
            {"_id": ObjectId(patient_id)},
            {"$set": {"status": status, "updated_at": datetime.utcnow()}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Patient not found")
            
        return await self.get_patient_by_id(patient_id)

    async def delete_patient(self, patient_id: str) -> None:
        db = get_database()
        result = await db[self.collection_name].delete_one({"_id": ObjectId(patient_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Patient not found")
            
        # Optional: delete associated documents
        await db["documents"].delete_many({"patient_id": ObjectId(patient_id)})

patient_service = PatientService()
