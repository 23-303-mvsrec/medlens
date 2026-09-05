"""
MedLens Provenance & Audit Trail Engine
=======================================
Tracks the origin, state transitions, and clinician verification lifecycle
for every clinical data point.

Core Provenance Origins:
- PATIENT_PROVIDED: Self-reported intake (allergies, symptoms, conditions, meds)
- DOCUMENT_EXTRACTED: Raw entities extracted from uploaded diagnostic reports
- SYSTEM_COMPUTED: Deterministic range evaluations, delta shifts, conflict flags
- AI_GENERATED: Plain-language synthesis and clarifying questions
- HUMAN_VERIFIED: Clinician-reviewed, confirmed, or manually amended findings
"""

import uuid
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from ..schemas.medlens_schema import (
    ProvenanceType,
    VerificationStatus,
    TimelineEvent
)


class ProvenanceEngine:
    """
    Guarantees end-to-end traceability of clinical data.
    Every fact maintains evidence pointers back to its original source.
    """

    @staticmethod
    def now_iso() -> str:
        """Returns current UTC ISO timestamp."""
        return datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M")

    @staticmethod
    def create_timeline_event(
        patient_id: str,
        event_type: str,
        title: str,
        description: str,
        provenance: str = ProvenanceType.SYSTEM_COMPUTED.value,
        source_ref: Optional[str] = None
    ) -> TimelineEvent:
        """Generates an immutable audit timeline record."""
        return TimelineEvent(
            id=f"evt-{uuid.uuid4().hex[:8]}",
            patient_id=patient_id,
            timestamp=datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M"),
            event_type=event_type,
            title=title,
            description=description,
            provenance=provenance,
            source_ref=source_ref
        )

    @staticmethod
    def apply_verification(
        finding_dict: Dict[str, Any],
        new_status: VerificationStatus,
        verified_by: str = "Clinical Reviewer",
        adjusted_value: Optional[str] = None,
        notes: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Transitions a finding through the human-in-the-loop verification pipeline.
        Updates verification status, records reviewer attribution, and maintains provenance.
        """
        updated = dict(finding_dict)
        updated["verification_status"] = new_status.value
        updated["verified_by"] = verified_by
        updated["verified_at"] = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M")
        
        if notes:
            updated["clinician_notes"] = notes

        if new_status == VerificationStatus.EDITED and adjusted_value is not None:
            updated["original_extracted_value"] = finding_dict.get("value")
            updated["value"] = adjusted_value
            try:
                updated["numeric_value"] = float(adjusted_value)
            except (ValueError, TypeError):
                pass
            updated["provenance"] = ProvenanceType.HUMAN_VERIFIED.value

        elif new_status == VerificationStatus.VERIFIED:
            updated["provenance"] = ProvenanceType.HUMAN_VERIFIED.value

        return updated


# Singleton instance
provenance_engine = ProvenanceEngine()