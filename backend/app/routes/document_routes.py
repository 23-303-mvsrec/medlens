from fastapi import APIRouter, Depends, UploadFile, File, Form, status, Query
from typing import List, Optional
from ..schemas.document_schema import DocumentResponse, RepositoryResponse, StudyResponse
from ..services.document_service import document_service
from ..utils.dependencies import require_doctor, get_current_user

router = APIRouter(prefix="/documents", tags=["Documents"])

@router.get("/repository", response_model=RepositoryResponse)
async def get_document_repository(
    search: Optional[str] = Query(None),
    file_type: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    current_user: dict = Depends(require_doctor)
):
    """Get patient-wise grouped document repository."""
    return await document_service.get_document_repository(
        search=search,
        file_type=file_type,
        start_date=start_date,
        end_date=end_date
    )

@router.get("/patient/{patient_id}", response_model=List[DocumentResponse])
async def get_patient_documents_v2(
    patient_id: str,
    current_user: dict = Depends(require_doctor)
):
    """Get all documents for a specific patient."""
    return await document_service.get_patient_documents(patient_id)

@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    patient_id: str = Form(...),
    file_type: str = Form(...),
    scan_date: Optional[str] = Form(None),
    body_part: Optional[str] = Form(None),
    department: Optional[str] = Form(None),
    referring_doctor_id: Optional[str] = Form(None),
    findings: Optional[str] = Form(None),
    impression: Optional[str] = Form(None),
    symptoms: Optional[str] = Form(None),
    clinical_history: Optional[str] = Form(None),
    reason_for_scan: Optional[str] = Form(None),
    doctor_notes: Optional[str] = Form(None),
    notes: str = Form(None),
    file: UploadFile = File(...),
    current_user: dict = Depends(require_doctor)
):
    """Upload a document for a patient."""
    return await document_service.upload_document(
        patient_id=patient_id,
        file_type=file_type,
        scan_date=scan_date,
        body_part=body_part,
        department=department,
        referring_doctor_id=referring_doctor_id,
        findings=findings,
        impression=impression,
        symptoms=symptoms,
        clinical_history=clinical_history,
        reason_for_scan=reason_for_scan,
        doctor_notes=doctor_notes,
        notes=notes,
        file=file,
        user_id=str(current_user["_id"])
    )


@router.get("/", response_model=List[DocumentResponse])
async def get_patient_documents(
    patient_id: str,
    current_user: dict = Depends(require_doctor)
):
    """Get all documents for a specific patient."""
    return await document_service.get_patient_documents(patient_id)


@router.post("/study/upload", status_code=status.HTTP_201_CREATED)
async def upload_study(
    patient_id: str = Form(...),
    study_type: str = Form(...),
    scan_date: Optional[str] = Form(None),
    body_part: Optional[str] = Form(None),
    department: Optional[str] = Form(None),
    referring_doctor_id: Optional[str] = Form(None),
    findings: Optional[str] = Form(None),
    impression: Optional[str] = Form(None),
    symptoms: Optional[str] = Form(None),
    clinical_history: Optional[str] = Form(None),
    reason_for_scan: Optional[str] = Form(None),
    doctor_notes: Optional[str] = Form(None),
    files: List[UploadFile] = File(...),
    current_user: dict = Depends(require_doctor)
):
    """Upload a medical study containing multiple files."""
    return await document_service.upload_study(
        patient_id=patient_id,
        study_type=study_type,
        scan_date=scan_date,
        body_part=body_part,
        department=department,
        referring_doctor_id=referring_doctor_id,
        findings=findings,
        impression=impression,
        symptoms=symptoms,
        clinical_history=clinical_history,
        reason_for_scan=reason_for_scan,
        doctor_notes=doctor_notes,
        files=files,
        user_id=str(current_user["_id"])
    )

@router.get("/study", response_model=List[dict])
async def get_all_studies(
    search: Optional[str] = Query(None),
    study_type: Optional[str] = Query(None),
    current_user: dict = Depends(require_doctor)
):
    """Get all studies for the repository page."""
    return await document_service.get_all_studies(search=search, study_type=study_type)

@router.get("/study/patient/{patient_id}", response_model=List[StudyResponse])
async def get_patient_studies(
    patient_id: str,
    current_user: dict = Depends(require_doctor)
):
    """Get all studies for a specific patient."""
    rows = await document_service.get_patient_studies(patient_id)
    models = [StudyResponse.model_validate(r) for r in rows]
    # Plain dicts (not BaseModel instances) so jsonable_encoder never sees BSON ObjectId on a model edge-case.
    return [m.model_dump() for m in models]

@router.get("/study/{id}", response_model=StudyResponse)
async def get_study(
    id: str,
    current_user: dict = Depends(require_doctor)
):
    """Get study details by ID."""
    m = StudyResponse.model_validate(await document_service.get_study_by_id(id))
    return m.model_dump()

@router.delete("/{id}")
async def delete_document(
    id: str,
    current_user: dict = Depends(require_doctor)
):
    """Delete a document."""
    return await document_service.delete_document(
        document_id=id,
        user_id=str(current_user["_id"]),
        user_role=current_user["role"]
    )

@router.delete("/study/{id}")
async def delete_study(
    id: str,
    current_user: dict = Depends(require_doctor)
):
    """Delete a study."""
    return await document_service.delete_study(
        study_id=id,
        user_id=str(current_user["_id"]),
        user_role=current_user["role"]
    )
