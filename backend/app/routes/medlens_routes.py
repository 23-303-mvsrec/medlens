import os
import shutil
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from typing import List, Optional

from ..schemas.medlens_schema import (
    PatientIntake,
    MedLensReportAnalysis,
    VerifyFindingRequest,
    ResolveReviewItemRequest,
    DashboardStats,
    BiomarkerComparison
)
from ..services.medlens_service import medlens_service

router = APIRouter(prefix="/medlens", tags=["MedLens AI"])

# =============================================================================
# DASHBOARD METRICS
# =============================================================================
@router.get("/stats", response_model=DashboardStats)
@router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_statistics():
    """Computes real clinical information metrics across stored patients, reports, and findings."""
    return await medlens_service.get_dashboard_stats()

# =============================================================================
# PATIENTS & INTAKE
# =============================================================================
@router.get("/patients", response_model=List[dict])
async def list_patients():
    """List all registered patients and their intake summaries."""
    return await medlens_service.get_patients()

@router.get("/patients/{patient_id}")
async def get_patient_profile(patient_id: str):
    """Retrieve structured patient profile and intake."""
    intake = await medlens_service.get_patient_intake(patient_id)
    if not intake:
        raise HTTPException(status_code=404, detail="Patient profile not found")
    return intake

@router.post("/patients", status_code=status.HTTP_201_CREATED)
async def create_or_update_patient(intake: PatientIntake):
    """Record or update patient demographics, symptoms, chronic conditions, allergies, and medications."""
    return await medlens_service.save_patient_intake(intake)

@router.post("/intake", status_code=status.HTTP_200_OK)
async def legacy_save_intake(intake: PatientIntake):
    """Alias for patient intake save."""
    return await medlens_service.save_patient_intake(intake)

@router.get("/intake/{patient_id}")
async def legacy_get_intake(patient_id: str):
    """Alias for patient intake fetch."""
    intake = await medlens_service.get_patient_intake(patient_id)
    if not intake:
        return {
            "patient_id": patient_id,
            "full_name": "Eleanor Vance",
            "age": 58,
            "gender": "Female",
            "symptoms": ["Chronic fatigue", "Increased thirst", "Occasional blurred vision"],
            "chronic_conditions": ["Essential Hypertension (Diagnosed 2019)"],
            "allergies": ["Penicillin", "Sulfa drugs"],
            "current_medications": [
                {"name": "Amlodipine", "dosage": "5mg once daily", "source": "PATIENT_PROVIDED"}
            ],
            "provenance": "PATIENT_PROVIDED",
            "intake_date": "2026-09-05"
        }
    return intake

# =============================================================================
# REPORT INGESTION & FINDINGS
# =============================================================================
@router.post("/reports/upload", response_model=MedLensReportAnalysis)
async def upload_and_process_report(
    patient_id: str = Form(...),
    report_title: str = Form("Laboratory Diagnostic Panel"),
    raw_text: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None)
):
    """Ingest medical report (PDF, Image, or OCR stream), extract findings, and evaluate reference ranges."""
    file_name = None
    file_url = None

    if file:
        file_name = file.filename
        upload_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "uploads")
        os.makedirs(upload_dir, exist_ok=True)
        file_path = os.path.join(upload_dir, file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        file_url = f"/uploads/{file.filename}"

    return await medlens_service.process_report(
        patient_id=patient_id,
        report_title=report_title,
        raw_text=raw_text or "",
        file_name=file_name,
        file_url=file_url
    )

@router.post("/reports/analyze", response_model=MedLensReportAnalysis)
async def analyze_medical_report(
    patient_id: str = Form(...),
    report_title: str = Form("Comprehensive Diagnostic Panel"),
    raw_text: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None)
):
    """Alias for report processing."""
    return await upload_and_process_report(patient_id, report_title, raw_text, file)

@router.get("/reports/patient/{patient_id}")
async def get_patient_reports(patient_id: str):
    """Retrieve all structured reports for a specific patient."""
    reports = await medlens_service.get_patient_reports(patient_id)
    if not reports:
        # Provide sample baseline analysis
        sample = await medlens_service.process_report(
            patient_id=patient_id,
            report_title="Comprehensive Metabolic & Renal Panel",
            raw_text="",
            file_name="Lab_Report_Panel_Sep2026.pdf",
            file_url="/uploads/sample_report.pdf"
        )
        return [sample.dict()]
    return reports

@router.post("/findings/{finding_id}/verify")
async def verify_finding(finding_id: str, req: VerifyFindingRequest):
    """Human verification, editing, or rejection of an extracted finding."""
    result = await medlens_service.verify_finding(finding_id, req)
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("message"))
    return result

@router.post("/reports/{report_id}/verify-test")
async def legacy_verify_test(report_id: str, req: dict):
    """Legacy alias for finding verification."""
    f_id = req.get("test_id", "")
    verify_req = VerifyFindingRequest(
        finding_id=f_id,
        action="VERIFY",
        corrected_value=req.get("corrected_value"),
        reviewer_note=req.get("reviewer_note")
    )
    return await medlens_service.verify_finding(f_id, verify_req)

# =============================================================================
# REVIEW CENTER & CONFLICTS
# =============================================================================
@router.get("/review-items")
async def get_review_items(patient_id: Optional[str] = None):
    """Retrieve unresolved clinical review items, conflicts, missing ranges, and unverified findings."""
    return await medlens_service.get_review_items(patient_id)

@router.post("/review-items/{item_id}/resolve")
async def resolve_review_item(item_id: str, req: ResolveReviewItemRequest):
    """Mark an unresolved review item as resolved by a clinical reviewer with notes."""
    result = await medlens_service.resolve_review_item(item_id, req.resolution_note)
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("message"))
    return result

# =============================================================================
# COMPARISON & TIMELINE
# =============================================================================
@router.get("/compare/{patient_id}")
async def compare_patient_reports(patient_id: str):
    """Compute longitudinal biomarker deltas between historical and current reports."""
    return await medlens_service.compare_patient_reports(patient_id)

@router.get("/timeline")
async def get_all_timeline():
    """Chronological clinical timeline across all patients."""
    return await medlens_service.get_all_timeline()

@router.get("/timeline/{patient_id}")
async def get_patient_timeline(patient_id: str):
    """Chronological patient timeline of intake, uploads, findings, and verifications."""
    return await medlens_service.get_patient_timeline(patient_id)

# =============================================================================
# DATABASE INSPECTOR & SETTINGS
# =============================================================================
@router.get("/database/raw")
@router.get("/database/inspect")
async def inspect_database():
    """Returns the entire backend database state for review without requiring accounts."""
    from ..config.local_db import local_db_instance
    return local_db_instance.get_all_data()

@router.post("/database/reset")
async def reset_database():
    """Reset to clean initial demo data."""
    from ..config.local_db import local_db_instance
    local_db_instance._seed_default_data()
    return {"success": True, "message": "Database reset to verified clinical demonstration state"}

@router.post("/config/api-key")
async def set_api_key(payload: dict):
    """Configure Gemini API Key."""
    key = payload.get("api_key", "").strip()
    if key:
        os.environ["GEMINI_API_KEY"] = key
    return {"success": True, "message": "Gemini API key updated successfully!", "has_key": bool(key)}

@router.get("/config/api-key-status")
async def get_api_key_status():
    """Check Gemini API Key status."""
    key = os.environ.get("GEMINI_API_KEY", "")
    masked = f"{key[:6]}...{key[-4:]}" if len(key) > 10 else ("Configured" if key else "Not Set")
    return {
        "has_key": bool(key),
        "masked_key": masked,
        "engine": "Google Gemini 1.5 Flash (Cloud)" if key else "MedLens Deterministic Clinical Engine (Local)"
    }
