import os
from datetime import datetime
from typing import List, Dict, Any
from bson import ObjectId
from fastapi import HTTPException, UploadFile
from ..config.db import get_database
from ..utils.file_upload import save_upload_file, delete_local_file


def _json_safe(value: Any) -> Any:
    """Recursively turn BSON ObjectIds into strings so FastAPI can JSON-encode responses."""
    if isinstance(value, ObjectId):
        return str(value)
    # Some Cosmos/Motor builds use ObjectId types that don't match bson.ObjectId in isinstance
    if type(value).__name__ == "ObjectId":
        return str(value)
    if isinstance(value, dict):
        return {k: _json_safe(v) for k, v in value.items()}
    if isinstance(value, list):
        return [_json_safe(v) for v in value]
    return value


def _build_study_file_entries(study_id_str: str, files_docs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    rows: List[Dict[str, Any]] = []
    for f in files_docs:
        raw_url = f.get("file_url", "")
        filename = os.path.basename(raw_url.replace("\\", "/"))
        file_url = f"/uploads/{filename}" if filename else raw_url
        fname = f.get("file_name", "") or ""
        fmt = f.get("file_format")
        if not fmt and "." in fname:
            fmt = fname.rsplit(".", 1)[-1].lower()
        fmt = fmt or "unknown"
        rows.append(
            {
                "id": str(f["_id"]),
                "study_id": study_id_str,
                "file_url": file_url,
                "file_name": fname,
                "file_format": fmt,
                "created_at": f["created_at"],
            }
        )
    return rows


def _build_study_response_dict(study: Dict[str, Any], files_docs: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Whitelist fields for the API — avoids leaking raw BSON (ObjectId) into JSON responses."""
    sid = str(study["_id"])
    ref = study.get("referring_doctor_id")
    payload = {
        "id": sid,
        "patient_id": str(study["patient_id"]),
        "study_type": study.get("study_type") or "",
        "body_part": study.get("body_part"),
        "scan_date": study.get("scan_date"),
        "department": study.get("department"),
        "referring_doctor_id": str(ref) if ref is not None else None,
        "findings": study.get("findings"),
        "impression": study.get("impression"),
        "symptoms": study.get("symptoms"),
        "clinical_history": study.get("clinical_history"),
        "reason_for_scan": study.get("reason_for_scan"),
        "doctor_notes": study.get("doctor_notes"),
        "uploaded_by": str(study.get("uploaded_by", "") or ""),
        "created_at": study["created_at"],
        "files": _build_study_file_entries(sid, files_docs),
    }
    return _json_safe(payload)


class DocumentService:
    def __init__(self):
        self.collection_name = "documents"

    async def upload_document(
        self, 
        patient_id: str, 
        file_type: str, 
        notes: str, 
        file: UploadFile, 
        user_id: str,
        scan_date: str = None,
        body_part: str = None,
        department: str = None,
        referring_doctor_id: str = None,
        findings: str = None,
        impression: str = None,
        symptoms: str = None,
        clinical_history: str = None,
        reason_for_scan: str = None,
        doctor_notes: str = None
    ) -> Dict[str, Any]:
        db = get_database()
        
        # Verify patient exists
        patient = await db.patients.find_one({"_id": ObjectId(patient_id)})
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")
            
        # Save file locally
        file_url = await save_upload_file(file)
        
        document_dict = {
            "patient_id": ObjectId(patient_id),
            "file_url": file_url,
            "file_name": file.filename,
            "file_type": file_type,
            "notes": notes,
            "scan_date": datetime.fromisoformat(scan_date.replace('Z', '+00:00')) if scan_date else None,
            "body_part": body_part,
            "department": department,
            "referring_doctor_id": ObjectId(referring_doctor_id) if referring_doctor_id else None,
            "findings": findings,
            "impression": impression,
            "symptoms": symptoms,
            "clinical_history": clinical_history,
            "reason_for_scan": reason_for_scan,
            "doctor_notes": doctor_notes,
            "uploaded_by": ObjectId(user_id),
            "created_at": datetime.utcnow()
        }
        
        result = await db[self.collection_name].insert_one(document_dict)
        document_dict["id"] = str(result.inserted_id)
        document_dict["patient_id"] = str(document_dict["patient_id"])
        document_dict["uploaded_by"] = str(document_dict["uploaded_by"])
        if document_dict.get("referring_doctor_id"):
            document_dict["referring_doctor_id"] = str(document_dict["referring_doctor_id"])
        del document_dict["_id"]
        
        return document_dict


    async def get_patient_documents(self, patient_id: str) -> List[Dict[str, Any]]:
        db = get_database()
        # Fetch without server-side sort to avoid indexing requirements (specifically for Cosmos DB)
        documents = await db[self.collection_name].find({"patient_id": ObjectId(patient_id)}).to_list(1000)
        
        # Sort in memory by created_at descending
        documents.sort(key=lambda x: x.get("created_at", datetime.min), reverse=True)
        
        for doc in documents:
            doc["id"] = str(doc["_id"])
            doc["patient_id"] = str(doc["patient_id"])
            doc["uploaded_by"] = str(doc["uploaded_by"])
            del doc["_id"]

            # Normalize file_url — handle legacy absolute paths stored by old buggy code.
            # Always serve as /uploads/{filename} regardless of what is in the DB.
            raw_url = doc.get("file_url", "")
            filename = os.path.basename(raw_url.replace("\\", "/"))
            doc["file_url"] = f"/uploads/{filename}" if filename else raw_url

        return documents

    async def get_document_repository(self, search: str = None, file_type: str = None, start_date: str = None, end_date: str = None) -> Dict[str, Any]:
        db = get_database()
        
        pipeline = []
        
        # 1. Match documents by type and date
        match_doc = {}
        if file_type and file_type != "all":
            match_doc["file_type"] = file_type
        
        date_query = {}
        if start_date:
            try:
                date_query["$gte"] = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            except: pass
        if end_date:
            try:
                date_query["$lte"] = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            except: pass
            
        if date_query:
            match_doc["created_at"] = date_query
            
        if match_doc:
            pipeline.append({"$match": match_doc})
            
        # 2. Join with Patients
        pipeline.append({
            "$lookup": {
                "from": "patients",
                "localField": "patient_id",
                "foreignField": "_id",
                "as": "patient"
            }
        })
        pipeline.append({"$unwind": "$patient"})
        
        # 3. Filter by search (name or mrn)
        if search:
            pipeline.append({
                "$match": {
                    "$or": [
                        {"patient.full_name": {"$regex": search, "$options": "i"}},
                        {"patient.mrn": {"$regex": search, "$options": "i"}}
                    ]
                }
            })
            
        # 4. Join with Doctors (for department)
        pipeline.append({
            "$lookup": {
                "from": "doctors",
                "localField": "patient.assigned_doctor_id",
                "foreignField": "_id",
                "as": "doctor"
            }
        })
        pipeline.append({"$unwind": {"path": "$doctor", "preserveNullAndEmptyArrays": True}})
        
        # 5. Join with DoctorDepartments to get primary department
        pipeline.append({
            "$lookup": {
                "from": "doctor_departments",
                "localField": "doctor._id",
                "foreignField": "doctor_id",
                "as": "all_depts"
            }
        })
        pipeline.append({
            "$addFields": {
                "dept_mapping": {
                    "$arrayElemAt": [
                        {
                            "$filter": {
                                "input": "$all_depts",
                                "as": "d",
                                "cond": {"$eq": ["$$d.is_primary", True]}
                            }
                        },
                        0
                    ]
                }
            }
        })
        pipeline.append({"$unwind": {"path": "$dept_mapping", "preserveNullAndEmptyArrays": True}})
        
        # 6. Join with Departments to get name
        pipeline.append({
            "$lookup": {
                "from": "departments",
                "localField": "dept_mapping.department_id",
                "foreignField": "_id",
                "as": "dept_info"
            }
        })
        pipeline.append({"$unwind": {"path": "$dept_info", "preserveNullAndEmptyArrays": True}})
        
        # 7. Group by patient
        pipeline.append({
            "$group": {
                "_id": "$patient_id",
                "patient_name": {"$first": "$patient.full_name"},
                "mrn": {"$first": "$patient.mrn"},
                "department": {"$first": {"$ifNull": ["$dept_info.name", "General"]}},
                "document_types": {"$addToSet": "$file_type"},
                "files_count": {"$sum": 1},
                "latest_activity": {"$max": "$created_at"}
            }
        })
        
        # 8. Fetch individual document results
        doc_results = await db[self.collection_name].aggregate(pipeline).to_list(1000)
        
        # 9. Fetch studies and merge
        study_pipeline = []
        
        # Map match_doc filters to studies (file_type -> study_type)
        match_study = {}
        if file_type and file_type != "all":
            match_study["study_type"] = file_type
        if date_query:
            match_study["created_at"] = date_query
            
        if match_study:
            study_pipeline.append({"$match": match_study})
        study_pipeline.append({
            "$lookup": {
                "from": "patients",
                "localField": "patient_id",
                "foreignField": "_id",
                "as": "patient"
            }
        })
        study_pipeline.append({"$unwind": "$patient"})
        study_pipeline.append({
            "$lookup": {
                "from": "study_files",
                "localField": "_id",
                "foreignField": "study_id",
                "as": "files"
            }
        })
        study_pipeline.append({
            "$group": {
                "_id": "$patient_id",
                "patient_name": {"$first": "$patient.full_name"},
                "mrn": {"$first": "$patient.mrn"},
                "department": {"$first": "General"},
                "document_types": {"$addToSet": "$study_type"},
                "files_count": {"$sum": {"$size": "$files"}},
                "latest_activity": {"$max": "$created_at"}
            }
        })
        
        study_results = await db.document_studies.aggregate(study_pipeline).to_list(1000)
        
        # Merge results
        merged_map = {}
        for item in doc_results:
            pid = str(item["_id"])
            merged_map[pid] = item
            
        for item in study_results:
            pid = str(item["_id"])
            if pid in merged_map:
                merged_map[pid]["document_types"] = list(set(merged_map[pid]["document_types"] + item["document_types"]))
                merged_map[pid]["files_count"] += item["files_count"]
                if item["latest_activity"] > merged_map[pid]["latest_activity"]:
                    merged_map[pid]["latest_activity"] = item["latest_activity"]
            else:
                merged_map[pid] = item
        
        results = list(merged_map.values())
        results.sort(key=lambda x: x.get("latest_activity", datetime.min), reverse=True)
        
        # 10. Format response
        formatted_data = []
        for index, item in enumerate(results):
            formatted_data.append({
                "app_id": f"APP-{str(index + 1).zfill(3)}",
                "patient_name": item["patient_name"],
                "mrn": item["mrn"],
                "department": item.get("department", "General"),
                "document_types": item["document_types"],
                "files_count": item["files_count"],
                "latest_activity": item["latest_activity"],
                "patient_id": str(item["_id"])
            })
            
        return {
            "data": formatted_data,
            "total": len(formatted_data)
        }

    async def delete_document(self, document_id: str, user_id: str, user_role: str) -> Dict[str, str]:
        db = get_database()
        document = await db[self.collection_name].find_one({"_id": ObjectId(document_id)})
        
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
            
        # Authorization check: only uploader or admin can delete
        if user_role != "admin" and str(document["uploaded_by"]) != user_id:
            raise HTTPException(status_code=403, detail="Not authorized to delete this document")
            
        # Delete local file
        delete_local_file(document["file_url"])
        
        # Delete from DB
        await db[self.collection_name].delete_one({"_id": ObjectId(document_id)})
        
        return {"message": "Document deleted successfully"}


    async def upload_study(
        self,
        patient_id: str,
        study_type: str,
        files: List[UploadFile],
        user_id: str,
        scan_date: str = None,
        body_part: str = None,
        department: str = None,
        referring_doctor_id: str = None,
        findings: str = None,
        impression: str = None,
        symptoms: str = None,
        clinical_history: str = None,
        reason_for_scan: str = None,
        doctor_notes: str = None
    ) -> Dict[str, Any]:
        db = get_database()
        
        # Verify patient exists
        patient = await db.patients.find_one({"_id": ObjectId(patient_id)})
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")
            
        # 1. Create Document Study
        study_dict = {
            "patient_id": ObjectId(patient_id),
            "study_type": study_type,
            "body_part": body_part,
            "scan_date": datetime.fromisoformat(scan_date.replace('Z', '+00:00')) if scan_date else None,
            "department": department,
            "referring_doctor_id": ObjectId(referring_doctor_id) if referring_doctor_id else None,
            "findings": findings,
            "impression": impression,
            "symptoms": symptoms,
            "clinical_history": clinical_history,
            "reason_for_scan": reason_for_scan,
            "doctor_notes": doctor_notes,
            "uploaded_by": ObjectId(user_id),
            "file_count": len(files),
            "created_at": datetime.utcnow()
        }
        
        study_result = await db.document_studies.insert_one(study_dict)
        study_id = study_result.inserted_id
        
        # 2. Upload and record files
        recorded_files = []
        for file in files:
            file_url = await save_upload_file(file)
            file_format = file.filename.split('.')[-1].lower() if '.' in file.filename else 'unknown'
            
            file_dict = {
                "study_id": study_id,
                "file_url": file_url,
                "file_name": file.filename,
                "file_format": file_format,
                "created_at": datetime.utcnow()
            }
            file_result = await db.study_files.insert_one(file_dict)
            file_dict["id"] = str(file_result.inserted_id)
            file_dict["study_id"] = str(file_dict["study_id"])
            del file_dict["_id"]
            recorded_files.append(file_dict)
            
        study_dict["id"] = str(study_id)
        study_dict["patient_id"] = str(study_dict["patient_id"])
        study_dict["uploaded_by"] = str(study_dict["uploaded_by"])
        if study_dict.get("referring_doctor_id"):
            study_dict["referring_doctor_id"] = str(study_dict["referring_doctor_id"])
        del study_dict["_id"]
        study_dict["files"] = recorded_files
        
        return study_dict

    async def get_patient_studies(self, patient_id: str) -> List[Dict[str, Any]]:
        db = get_database()
        studies = await db.document_studies.find({"patient_id": ObjectId(patient_id)}).to_list(100)
        out: List[Dict[str, Any]] = []
        for study in studies:
            sid = str(study["_id"])
            files_docs = await db.study_files.find({"study_id": ObjectId(sid)}).to_list(100)
            out.append(_build_study_response_dict(study, files_docs))

        out.sort(
            key=lambda x: x.get("scan_date") or x.get("created_at") or datetime.min,
            reverse=True,
        )
        return out

    async def get_study_by_id(self, study_id: str) -> Dict[str, Any]:
        db = get_database()
        study = await db.document_studies.find_one({"_id": ObjectId(study_id)})
        if not study:
            raise HTTPException(status_code=404, detail="Study not found")

        files_docs = await db.study_files.find({"study_id": ObjectId(study_id)}).to_list(100)
        return _build_study_response_dict(study, files_docs)

    async def get_all_studies(self, search: str = None, study_type: str = None) -> List[Dict[str, Any]]:
        db = get_database()
        query = {}
        if study_type and study_type != "all":
            query["study_type"] = study_type
            
        pipeline = []
        if query:
            pipeline.append({"$match": query})
            
        pipeline.append({
            "$lookup": {
                "from": "patients",
                "localField": "patient_id",
                "foreignField": "_id",
                "as": "patient"
            }
        })
        pipeline.append({"$unwind": "$patient"})
        
        if search:
            pipeline.append({
                "$match": {
                    "$or": [
                        {"patient.full_name": {"$regex": search, "$options": "i"}},
                        {"patient.mrn": {"$regex": search, "$options": "i"}}
                    ]
                }
            })
            
        pipeline.append({
            "$lookup": {
                "from": "study_files",
                "localField": "_id",
                "foreignField": "study_id",
                "as": "files"
            }
        })
        
        results = await db.document_studies.aggregate(pipeline).to_list(1000)
        results.sort(key=lambda x: x.get("created_at", datetime.min), reverse=True)
        
        formatted_data = []
        for index, item in enumerate(results):
            formatted_data.append({
                "id": str(item["_id"]),
                "app_id": f"APP-{str(index + 1).zfill(3)}",
                "patient_name": item["patient"]["full_name"],
                "mrn": item["patient"]["mrn"],
                "study_type": item["study_type"],
                "body_part": item.get("body_part", "N/A"),
                "files_count": len(item.get("files", [])),
                "latest_activity": item["created_at"],
                "patient_id": str(item["patient_id"])
            })
            
        return formatted_data

    async def delete_study(self, study_id: str, user_id: str, user_role: str) -> Dict[str, str]:
        db = get_database()
        study = await db.document_studies.find_one({"_id": ObjectId(study_id)})
        
        if not study:
            raise HTTPException(status_code=404, detail="Study not found")
            
        # Authorization check: only uploader or admin can delete
        if user_role != "admin" and str(study["uploaded_by"]) != user_id:
            raise HTTPException(status_code=403, detail="Not authorized to delete this study")
            
        # 1. Fetch all files for this study
        files = await db.study_files.find({"study_id": ObjectId(study_id)}).to_list(100)
        
        # 2. Delete local files
        for file in files:
            delete_local_file(file["file_url"])
            
        # 3. Delete file records
        await db.study_files.delete_many({"study_id": ObjectId(study_id)})
        
        # 4. Delete study record
        await db.document_studies.delete_one({"_id": ObjectId(study_id)})
        
        return {"message": "Study and associated files deleted successfully"}

document_service = DocumentService()
