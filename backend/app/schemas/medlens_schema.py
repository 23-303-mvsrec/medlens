from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class ProvenanceType(str, Enum):
    PATIENT_PROVIDED = "PATIENT_PROVIDED"
    DOCUMENT_EXTRACTED = "DOCUMENT_EXTRACTED"
    AI_GENERATED = "AI_GENERATED"
    SYSTEM_COMPUTED = "SYSTEM_COMPUTED"
    HUMAN_VERIFIED = "HUMAN_VERIFIED"

class VerificationStatus(str, Enum):
    PENDING = "PENDING"
    VERIFIED = "VERIFIED"
    EDITED = "EDITED"
    REJECTED = "REJECTED"

class ReferenceStatus(str, Enum):
    LOW = "LOW"
    NORMAL = "NORMAL"
    HIGH = "HIGH"
    NOT_DETERMINED = "NOT_DETERMINED"

class MedicationItem(BaseModel):
    id: Optional[str] = None
    name: str
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    source: str = "PATIENT_PROVIDED"
    verified: bool = True

class PatientIntake(BaseModel):
    patient_id: Optional[str] = None
    mrn: Optional[str] = None
    full_name: str
    age: int
    gender: str
    dob: Optional[str] = None
    symptoms: List[str] = Field(default_factory=list)
    chronic_conditions: List[str] = Field(default_factory=list)
    allergies: List[str] = Field(default_factory=list)
    current_medications: List[MedicationItem] = Field(default_factory=list)
    intake_date: Optional[str] = None
    provenance: str = ProvenanceType.PATIENT_PROVIDED.value
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class LabFinding(BaseModel):
    id: str
    report_id: str
    patient_id: str
    test_name: str
    category: str = "General Chemistry"
    value: str
    numeric_value: Optional[float] = None
    unit: str = ""
    reference_range: str = "NOT_DETERMINED"
    ref_min: Optional[float] = None
    ref_max: Optional[float] = None
    status: ReferenceStatus = ReferenceStatus.NOT_DETERMINED
    status_reason: Optional[str] = None
    source_type: str = ProvenanceType.DOCUMENT_EXTRACTED.value
    source_document: str = ""
    source_page: int = 1
    confidence: float = 0.95
    verification_status: VerificationStatus = VerificationStatus.PENDING
    verified_by: Optional[str] = None
    verified_at: Optional[str] = None
    raw_evidence: Optional[str] = None
    observation: Optional[str] = None
    date: str = ""

class ReviewItem(BaseModel):
    id: str
    patient_id: str
    patient_name: str
    type: str  # CONFLICT, MISSING_RANGE, LOW_CONFIDENCE, CHANGED_VALUE, UNVERIFIED
    severity: str  # CRITICAL, WARNING, INFO
    title: str
    description: str
    sources: List[str] = Field(default_factory=list)
    status: str = "UNRESOLVED"  # UNRESOLVED, RESOLVED, DISMISSED
    resolution_note: Optional[str] = None
    related_entity_id: Optional[str] = None
    created_at: str = ""

class TimelineEvent(BaseModel):
    id: str
    patient_id: str
    event_type: str  # INTAKE, REPORT_UPLOAD, FINDING_EXTRACTED, HUMAN_VERIFICATION, REVIEW_RESOLVED, COMPARISON
    title: str
    description: str
    timestamp: str
    source: str
    entity_id: Optional[str] = None

class BiomarkerComparison(BaseModel):
    test_name: str
    category: str
    unit: str
    reference_range: str
    previous_val: float
    previous_status: ReferenceStatus
    previous_date: str
    previous_source: str
    current_val: float
    current_status: ReferenceStatus
    current_date: str
    current_source: str
    delta: float
    delta_percent: float
    trend: str  # up, down, stable
    note: str

class MedLensReportAnalysis(BaseModel):
    report_id: str
    patient_id: str
    patient_name: str
    report_title: str
    report_date: str
    laboratory_name: str = "Clinical Diagnostic Laboratory"
    file_name: Optional[str] = None
    file_url: Optional[str] = None
    extracted_tests: List[LabFinding] = Field(default_factory=list)
    review_items: List[ReviewItem] = Field(default_factory=list)
    plain_summary: str = ""
    key_findings: List[str] = Field(default_factory=list)
    questions_for_doctor: List[str] = Field(default_factory=list)
    safety_disclaimer: str = (
        "MedLens is an AI-powered clinical information intelligence tool designed solely for organizing, tracing, "
        "and reviewing medical records. It does NOT provide medical diagnosis, prescribe treatments, or recommend dosage changes. "
        "All findings reflect source document information and must be evaluated by a licensed medical practitioner."
    )
    created_at: Optional[str] = None

class VerifyFindingRequest(BaseModel):
    finding_id: str
    action: str = "VERIFY"  # VERIFY, EDIT, REJECT
    corrected_value: Optional[str] = None
    corrected_status: Optional[ReferenceStatus] = None
    reviewer_note: Optional[str] = None

class ResolveReviewItemRequest(BaseModel):
    item_id: Optional[str] = None
    review_item_id: Optional[str] = None
    resolution_note: str
    resolved_by: Optional[str] = None

class DashboardStats(BaseModel):
    total_patients: int
    total_reports: int
    total_findings: int
    needs_review: int
    within_provided_range: int
    outside_provided_range: int
    not_determined: int
    verified_findings: int
    recent_activity: List[TimelineEvent] = Field(default_factory=list)
