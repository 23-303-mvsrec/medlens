"""
MedLens Clinical Conflict & Inconsistency Radar
================================================
Deterministic clinical correlation engine that cross-references:
1. Patient-reported conditions vs objective laboratory findings
2. Self-reported medications vs metabolic/renal organ indicators
3. Documented drug allergies vs active pharmacotherapy
4. Patient symptoms vs extracted biomarker abnormalities

Zero-Diagnostic Guardrail:
- Highlights discrepancies for clinician review.
- Never renders a medical diagnosis or alters patient therapy.
"""

import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from ..schemas.medlens_schema import (
    PatientIntake,
    ReviewItem
)


class ConflictRadar:
    """
    Deterministic clinical discrepancy and conflict detection engine.
    Cross-references intake statements with laboratory findings.
    """

    @staticmethod
    def detect_conflicts(
        intake: PatientIntake,
        findings: List[Dict[str, Any]],
        report_id: Optional[str] = None
    ) -> List[ReviewItem]:
        """
        Executes deterministic rules over patient intake and extracted findings.
        Returns prioritized ReviewItems for clinician resolution in Review Center.
        """
        review_items: List[ReviewItem] = []
        now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M")
        patient_name = intake.full_name or "Patient"

        # Normalize intake for matching
        conditions_lower = [c.lower() for c in intake.chronic_conditions]
        meds_lower = [m.name.lower() for m in intake.current_medications]
        symptoms_lower = [s.lower() for s in intake.symptoms]

        # Index findings by normalized test name
        finding_map: Dict[str, Dict[str, Any]] = {}
        for f in findings:
            name_norm = f.get("test_name", "").strip().lower()
            finding_map[name_norm] = f

        def get_val(test_keywords: List[str]) -> Optional[float]:
            for kw in test_keywords:
                for name, data in finding_map.items():
                    if kw in name:
                        val = data.get("numeric_value")
                        if val is not None:
                            return val
                        try:
                            return float(data.get("value"))
                        except (ValueError, TypeError):
                            pass
            return None

        def get_finding(test_keywords: List[str]) -> Optional[Dict[str, Any]]:
            for kw in test_keywords:
                for name, data in finding_map.items():
                    if kw in name:
                        return data
            return None

        # ---------------------------------------------------------------------
        # Rule 1: Glycemic Discrepancy (Undiagnosed Diabetes Risk)
        # ---------------------------------------------------------------------
        glucose_val = get_val(["fasting blood glucose", "fasting glucose", "blood glucose", "glucose, fasting", "glucose"])
        hba1c_val = get_val(["hba1c", "glycated hemoglobin", "hemoglobin a1c"])
        has_diabetes_history = any("diabet" in c for c in conditions_lower)

        if not has_diabetes_history:
            if glucose_val is not None and glucose_val >= 140.0:
                f = get_finding(["fasting blood glucose", "fasting glucose", "glucose"])
                review_items.append(ReviewItem(
                    id=f"rev-{uuid.uuid4().hex[:8]}",
                    patient_id=intake.patient_id or "P-101",
                    patient_name=patient_name,
                    type="CONFLICT",
                    severity="CRITICAL",
                    title="Elevated Fasting Blood Glucose Without Documented Diabetes",
                    description=(
                        f"Patient intake lists no history of diabetes mellitus, but laboratory report shows "
                        f"significantly elevated Fasting Blood Glucose of {glucose_val} mg/dL. "
                        f"Requires clinician verification."
                    ),
                    sources=[f"Intake: No diabetes documented", f"Lab: Glucose {glucose_val} mg/dL (Ref: {f.get('reference_range', '70.0 - 99.0')})"],
                    status="UNRESOLVED",
                    related_entity_id=f.get("id") if f else None,
                    created_at=now_str
                ))

            if hba1c_val is not None and hba1c_val >= 6.5:
                f = get_finding(["hba1c", "glycated hemoglobin", "hemoglobin a1c"])
                review_items.append(ReviewItem(
                    id=f"rev-{uuid.uuid4().hex[:8]}",
                    patient_id=intake.patient_id or "P-101",
                    patient_name=patient_name,
                    type="CONFLICT",
                    severity="CRITICAL",
                    title="Elevated Glycated Hemoglobin (HbA1c) Without Documented History",
                    description=(
                        f"Patient reports no chronic glycemic disorder, but HbA1c is {hba1c_val}%, "
                        f"exceeding standard diagnostic reference thresholds (>= 6.5%)."
                    ),
                    sources=[f"Intake: No diabetes", f"Lab: HbA1c {hba1c_val}% (Ref: {f.get('reference_range', '< 5.7')})"],
                    status="UNRESOLVED",
                    related_entity_id=f.get("id") if f else None,
                    created_at=now_str
                ))

        # ---------------------------------------------------------------------
        # Rule 2: NSAID Nephrotoxicity Risk (Medication vs Renal Function)
        # ---------------------------------------------------------------------
        has_nsaid = any(any(n in m for n in ["ibuprofen", "naproxen", "diclofenac", "meloxicam", "ketorolac"]) for m in meds_lower)
        creatinine_val = get_val(["creatinine", "serum creatinine"])
        egfr_val = get_val(["egfr", "estimated gfr", "glomerular filtration"])

        if has_nsaid:
            if (creatinine_val is not None and creatinine_val > 1.3) or (egfr_val is not None and egfr_val < 60.0):
                f = get_finding(["creatinine", "egfr"])
                nsaid_name = next((m for m in meds_lower if any(n in m for n in ["ibuprofen", "naproxen", "diclofenac", "meloxicam"])), "NSAID")
                review_items.append(ReviewItem(
                    id=f"rev-{uuid.uuid4().hex[:8]}",
                    patient_id=intake.patient_id or "P-101",
                    patient_name=patient_name,
                    type="CONFLICT",
                    severity="CRITICAL",
                    title="Active NSAID Use with Elevated Renal Biomarkers",
                    description=(
                        f"Patient is self-reporting active NSAID use ({nsaid_name.title()}), while renal panel indicates "
                        f"impaired renal function (Creatinine: {creatinine_val or 'N/A'}, eGFR: {egfr_val or 'N/A'}). "
                        f"Potential nephrotoxic interaction."
                    ),
                    sources=[f"Intake: {nsaid_name.title()} PRN", f"Lab: Creatinine {creatinine_val} mg/dL, eGFR {egfr_val}"],
                    status="UNRESOLVED",
                    related_entity_id=f.get("id") if f else None,
                    created_at=now_str
                ))

        # ---------------------------------------------------------------------
        # Rule 3: Dyslipidemia with Cardiovascular History
        # ---------------------------------------------------------------------
        ldl_val = get_val(["ldl", "ldl cholesterol", "cholesterol, ldl"])
        has_cardio = any(any(c in cond for c in ["hypertension", "coronary", "cad", "angina", "stroke"]) for cond in conditions_lower)
        if has_cardio and ldl_val is not None and ldl_val >= 160.0:
            f = get_finding(["ldl", "ldl cholesterol"])
            review_items.append(ReviewItem(
                id=f"rev-{uuid.uuid4().hex[:8]}",
                patient_id=intake.patient_id or "P-101",
                patient_name=patient_name,
                type="WARNING",
                severity="WARNING",
                title="Marked Atherogenic LDL in Patient with Cardiovascular History",
                description=(
                    f"Patient has documented cardiovascular history (Hypertension/CAD), but LDL cholesterol is {ldl_val} mg/dL. "
                    f"Suggests sub-optimal lipid management."
                ),
                sources=[f"Intake: Cardiovascular history documented", f"Lab: LDL {ldl_val} mg/dL (Ref: {f.get('reference_range', '< 100')})"],
                status="UNRESOLVED",
                related_entity_id=f.get("id") if f else None,
                created_at=now_str
            ))

        # ---------------------------------------------------------------------
        # Rule 4: Symptom-Biomarker Correlation (Fatigue vs Anemia)
        # ---------------------------------------------------------------------
        has_fatigue = any(any(w in s for w in ["fatigue", "tired", "weakness", "lethargy"]) for s in symptoms_lower)
        hb_val = get_val(["hemoglobin", "haemoglobin", "hgb"])
        if has_fatigue and hb_val is not None and hb_val < 11.5:
            f = get_finding(["hemoglobin", "haemoglobin", "hgb"])
            review_items.append(ReviewItem(
                id=f"rev-{uuid.uuid4().hex[:8]}",
                patient_id=intake.patient_id or "P-101",
                patient_name=patient_name,
                type="INFO",
                severity="INFO",
                title="Self-Reported Fatigue Correlates with Low Hemoglobin",
                description=(
                    f"Patient presents with chronic fatigue. Laboratory panel confirms low Hemoglobin ({hb_val} g/dL), "
                    f"providing objective etiology for reported symptoms."
                ),
                sources=[f"Intake Symptom: Fatigue", f"Lab: Hemoglobin {hb_val} g/dL (Ref: {f.get('reference_range', '12.0 - 15.5')})"],
                status="UNRESOLVED",
                related_entity_id=f.get("id") if f else None,
                created_at=now_str
            ))

        return review_items


# Singleton instance
conflict_radar = ConflictRadar()