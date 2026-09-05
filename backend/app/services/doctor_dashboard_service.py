from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from bson import ObjectId
from ..config.db import get_database

class DoctorDashboardService:
    async def get_doctor_dashboard(self, doctor_id: str) -> Dict[str, Any]:
        db = get_database()
        
        # 1. Doctor Info
        doctor = await db.doctors.find_one({"_id": ObjectId(doctor_id)})
        if doctor:
            doctor["id"] = str(doctor["_id"])
            del doctor["_id"]
            if "password" in doctor:
                del doctor["password"]

        # 2. Today's Patients (assigned to this doctor and created/updated recently or status is active)
        # For simplicity, we'll fetch all active patients assigned to this doctor.
        patients = await db.patients.find({
            "assigned_doctor_id": str(doctor_id),
            "status": {"$in": ["active", "admitted", "follow-up"]}
        }).to_list(20)
        
        for p in patients:
            p["id"] = str(p["_id"])
            del p["_id"]

        # 3. Recent Documents (limit 5) for patients assigned to this doctor
        # This is a bit tricky with MongoDB without a join, but we can get patient IDs first.
        assigned_patient_ids = [str(p["id"]) for p in patients]
        recent_docs = []
        if assigned_patient_ids:
            recent_docs = await db.documents.find({
                "patient_id": {"$in": assigned_patient_ids}
            }).sort("created_at", -1).limit(5).to_list(5)
            
            for d in recent_docs:
                d["id"] = str(d["_id"])
                del d["_id"]

        # 4. Pending Followups (patients with status 'follow-up')
        pending_followups = [p for p in patients if p.get("status") == "follow-up"]

        return {
            "doctor_info": doctor,
            "today_patients": patients[:10], # Limit to 10 for dashboard
            "recent_documents": recent_docs,
            "pending_followups": pending_followups
        }

    async def get_doctor_patients(self, doctor_id: str) -> List[Dict[str, Any]]:
        db = get_database()
        patients = await db.patients.find({
            "assigned_doctor_id": str(doctor_id)
        }).sort("created_at", -1).to_list(100)
        
        for p in patients:
            p["id"] = str(p["_id"])
            del p["_id"]
        return patients

    async def get_patient_timeline(self, patient_id: str) -> List[Dict[str, Any]]:
        db = get_database()
        timeline = []

        # 1. Patient Created
        patient = await db.patients.find_one({"_id": ObjectId(patient_id)})
        if patient:
            timeline.append({
                "type": "patient_created",
                "timestamp": patient["created_at"],
                "data": {
                    "full_name": patient["full_name"],
                    "mrn": patient["mrn"]
                }
            })

        # 2. Documents Uploaded
        docs = await db.documents.find({"patient_id": str(patient_id)}).to_list(100)
        for doc in docs:
            timeline.append({
                "type": "document_uploaded",
                "timestamp": doc["created_at"],
                "data": {
                    "file_name": doc["file_name"],
                    "file_type": doc["file_type"],
                    "file_url": doc["file_url"],
                    "impression": doc.get("impression"),
                    "body_part": doc.get("body_part")
                }
            })

        # 3. Notes Added
        notes = await db.notes.find({"patient_id": ObjectId(patient_id)}).to_list(100)
        for note in notes:
            timeline.append({
                "type": "note_added",
                "timestamp": note["created_at"],
                "data": {
                    "content": note["content"],
                    "note_type": note.get("note_type", "general")
                }
            })

        # 4. Prescriptions Added
        prescriptions = await db.prescriptions.find({"patient_id": ObjectId(patient_id)}).to_list(100)
        for rx in prescriptions:
            med_names = [m.get("name", "") for m in rx.get("medications", [])]
            meds_summary = ", ".join(med_names) if med_names else "No medications"
            timeline.append({
                "type": "prescription_added",
                "timestamp": rx["created_at"],
                "data": {
                    "summary": f"Prescription created with {len(rx.get('medications', []))} medications ({meds_summary})",
                    "clinical_notes": rx.get("clinical_notes", "")
                }
            })

        # Sort combined timeline descending by timestamp
        timeline.sort(key=lambda x: x["timestamp"], reverse=True)
        return timeline

doctor_dashboard_service = DoctorDashboardService()
