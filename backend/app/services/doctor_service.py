from fastapi import HTTPException, status
from bson import ObjectId
from typing import List, Optional
from datetime import datetime
from ..config.db import get_database
from ..models.doctor_model import DoctorDB, DoctorDepartmentDB, DoctorAvailabilityDB
from ..schemas.doctor_schema import DoctorCreate, DoctorUpdate, DoctorResponse, AvailabilitySchema, DepartmentInfo
from ..utils.password import hash_password

class DoctorService:
    async def create_doctor(self, data: DoctorCreate) -> DoctorResponse:
        db = get_database()
        
        # 1. Validate Email Unique
        existing_doc = await db.doctors.find_one({"email": data.email})
        existing_user = await db.users.find_one({"email": data.email})
        if existing_doc or existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # 2. Validate Departments Exist
        dept_ids = [data.primary_department_id] + data.secondary_department_ids
        for d_id in dept_ids:
            if not await db.departments.find_one({"_id": ObjectId(d_id)}):
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Department {d_id} not found"
                )
        
        # 3. Create Doctor Record
        doctor_dict = data.model_dump(exclude={"primary_department_id", "secondary_department_ids"})
        doctor_dict["password"] = hash_password(data.password)
        doctor_dict["created_at"] = datetime.utcnow()
        
        new_doctor = await db.doctors.insert_one(doctor_dict)
        doctor_id = str(new_doctor.inserted_id)
        
        # 4. Create User Record for Login
        user_record = {
            "name": data.name,
            "email": data.email,
            "password": doctor_dict["password"],
            "role": "doctor",
            "doctor_id": doctor_id,
            "created_at": doctor_dict["created_at"]
        }
        await db.users.insert_one(user_record)
        
        # 5. Create Department Mappings
        mappings = []
        # Primary
        mappings.append({
            "doctor_id": ObjectId(doctor_id),
            "department_id": ObjectId(data.primary_department_id),
            "is_primary": True
        })
        # Secondary
        for s_id in data.secondary_department_ids:
            mappings.append({
                "doctor_id": ObjectId(doctor_id),
                "department_id": ObjectId(s_id),
                "is_primary": False
            })
        
        if mappings:
            await db.doctor_departments.insert_many(mappings)
            
        return await self.get_doctor_by_id(doctor_id)

    async def get_doctors(self, name: str = "", specialization: str = "", department_id: str = "") -> List[DoctorResponse]:
        db = get_database()
        query = {}
        if name:
            query["name"] = {"$regex": name, "$options": "i"}
        if specialization:
            query["specialization"] = {"$regex": specialization, "$options": "i"}
            
        # If department filter, we need to join or find IDs first
        if department_id:
            mappings = await db.doctor_departments.find({"department_id": ObjectId(department_id)}).to_list(None)
            doctor_ids = [m["doctor_id"] for m in mappings]
            query["_id"] = {"$in": doctor_ids}
            
        cursor = db.doctors.find(query)
        doctors = await cursor.to_list(None)
        
        responses = []
        for doc in doctors:
            responses.append(await self._format_doctor_response(doc))
        return responses

    async def get_doctor_by_id(self, doctor_id: str) -> DoctorResponse:
        db = get_database()
        doc = await db.doctors.find_one({"_id": ObjectId(doctor_id)})
        if not doc:
            raise HTTPException(status_code=404, detail="Doctor not found")
        return await self._format_doctor_response(doc)

    async def update_doctor(self, doctor_id: str, data: DoctorUpdate) -> DoctorResponse:
        db = get_database()
        update_data = {k: v for k, v in data.model_dump().items() if v is not None}
        if "password" in update_data:
            update_data["password"] = hash_password(update_data["password"])
            
        if update_data:
            await db.doctors.update_one({"_id": ObjectId(doctor_id)}, {"$set": update_data})
            # Sync to users collection if email or name or password changed
            user_update = {}
            if "name" in update_data: user_update["name"] = update_data["name"]
            if "email" in update_data: user_update["email"] = update_data["email"]
            if "password" in update_data: user_update["password"] = update_data["password"]
            if user_update:
                await db.users.update_one({"doctor_id": doctor_id}, {"$set": user_update})
                
        return await self.get_doctor_by_id(doctor_id)

    async def delete_doctor(self, doctor_id: str):
        db = get_database()
        await db.doctors.delete_one({"_id": ObjectId(doctor_id)})
        await db.users.delete_one({"doctor_id": doctor_id})
        await db.doctor_departments.delete_many({"doctor_id": ObjectId(doctor_id)})
        await db.doctor_availability.delete_many({"doctor_id": ObjectId(doctor_id)})

    async def add_availability(self, doctor_id: str, data: AvailabilitySchema):
        db = get_database()
        
        # Validation: start < end
        if data.start_time >= data.end_time:
            raise HTTPException(status_code=400, detail="Start time must be before end time")
            
        # Validation: Overlap check
        # Existing slots for same doctor and same day
        existing_slots = await db.doctor_availability.find({
            "doctor_id": ObjectId(doctor_id),
            "day_of_week": data.day_of_week,
            "is_leave": False
        }).to_list(None)
        
        if not data.is_leave:
            for slot in existing_slots:
                # Overlap if max(start1, start2) < min(end1, end2)
                if max(data.start_time, slot["start_time"]) < min(data.end_time, slot["end_time"]):
                    raise HTTPException(status_code=400, detail="Time slot overlaps with an existing one")
        
        avail_dict = data.model_dump()
        avail_dict["doctor_id"] = ObjectId(doctor_id)
        
        new_slot = await db.doctor_availability.insert_one(avail_dict)
        return {**avail_dict, "id": str(new_slot.inserted_id), "doctor_id": str(doctor_id)}

    async def get_availability(self, doctor_id: str):
        db = get_database()
        cursor = db.doctor_availability.find({"doctor_id": ObjectId(doctor_id)})
        slots = await cursor.to_list(None)
        return [{**s, "id": str(s["_id"]), "doctor_id": str(s["doctor_id"])} for s in slots]

    async def delete_availability_slot(self, slot_id: str):
        db = get_database()
        await db.doctor_availability.delete_one({"_id": ObjectId(slot_id)})

    async def _format_doctor_response(self, doc_db: dict) -> DoctorResponse:
        db = get_database()
        doctor_id = doc_db["_id"]
        
        # Get departments
        mappings = await db.doctor_departments.find({"doctor_id": doctor_id}).to_list(None)
        dept_infos = []
        for m in mappings:
            dept = await db.departments.find_one({"_id": m["department_id"]})
            if dept:
                dept_infos.append(DepartmentInfo(
                    id=str(dept["_id"]),
                    name=dept["name"],
                    is_primary=m["is_primary"]
                ))
        
        return DoctorResponse(
            id=str(doctor_id),
            name=doc_db["name"],
            email=doc_db["email"],
            specialization=doc_db["specialization"],
            sub_specialization=doc_db.get("sub_specialization"),
            qualifications=doc_db.get("qualifications", []),
            experience_years=doc_db["experience_years"],
            registration_number=doc_db["registration_number"],
            consultation_fee=doc_db["consultation_fee"],
            followup_fee=doc_db["followup_fee"],
            departments=dept_infos,
            created_at=doc_db["created_at"]
        )

doctor_service = DoctorService()
