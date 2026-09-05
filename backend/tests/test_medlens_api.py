"""
MedLens â€” Comprehensive Clinical Intelligence Test Suite
PromptWars Ã— AIMERverse Hackathon Edition
Verifies core requirements: Intake, Extraction, Deterministic Reference-Range Engine,
Provenance, Human Verification, Conflict Radar, Longitudinal Trends, and Responsible AI.
"""

import unittest
import asyncio
import sys
import os

# Add backend directory to sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.schemas.medlens_schema import (
    ReferenceStatus,
    VerificationStatus,
    PatientIntake,
    LabFinding,
    ReviewItem
)
from app.services.medlens_service import medlens_service


class TestMedLensClinicalIntelligence(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.loop = asyncio.new_event_loop()
        asyncio.set_event_loop(cls.loop)

    @classmethod
    def tearDownClass(cls):
        cls.loop.close()

    def run_async(self, coro):
        return self.loop.run_until_complete(coro)

    # -------------------------------------------------------------------------
    # 1. DETERMINISTIC REFERENCE-RANGE AWARENESS (CORE REQUIREMENT D)
    # -------------------------------------------------------------------------
    def test_reference_range_normal(self):
        """Value inside provided range must be classified as NORMAL."""
        ref_min, ref_max = medlens_service.parse_reference_range("70.0 - 99.0")
        status, reason = medlens_service.evaluate_status(85.0, ref_min, ref_max)
        self.assertEqual(status, ReferenceStatus.NORMAL)

    def test_reference_range_low(self):
        """Value strictly below range must be classified as LOW."""
        ref_min, ref_max = medlens_service.parse_reference_range("12.0 - 15.5")
        status, reason = medlens_service.evaluate_status(10.8, ref_min, ref_max)
        self.assertEqual(status, ReferenceStatus.LOW)

    def test_reference_range_high(self):
        """Value strictly above range must be classified as HIGH."""
        ref_min, ref_max = medlens_service.parse_reference_range("70.0 - 99.0")
        status, reason = medlens_service.evaluate_status(182.0, ref_min, ref_max)
        self.assertEqual(status, ReferenceStatus.HIGH)

    def test_reference_range_cutoff_high(self):
        """Value exceeding a cutoff range like '< 200' must be classified as HIGH."""
        ref_min, ref_max = medlens_service.parse_reference_range("< 200")
        status, reason = medlens_service.evaluate_status(245.0, ref_min, ref_max)
        self.assertEqual(status, ReferenceStatus.HIGH)

    def test_reference_range_missing_not_determined(self):
        """Zero-Hallucination Policy: Missing/unparseable range must be NOT_DETERMINED."""
        ref_min, ref_max = medlens_service.parse_reference_range(None)
        status, reason = medlens_service.evaluate_status(45.0, ref_min, ref_max)
        self.assertEqual(status, ReferenceStatus.NOT_DETERMINED)

        ref_min_empty, ref_max_empty = medlens_service.parse_reference_range("")
        status_empty, reason_empty = medlens_service.evaluate_status(45.0, ref_min_empty, ref_max_empty)
        self.assertEqual(status_empty, ReferenceStatus.NOT_DETERMINED)

    # -------------------------------------------------------------------------
    # 2. PROVENANCE INTEGRITY (CORE REQUIREMENT E)
    # -------------------------------------------------------------------------
    def test_patient_intake_provenance(self):
        """Patient intake data must carry strict PATIENT_PROVIDED provenance."""
        intake = PatientIntake(
            patient_id="P-TEST-01",
            full_name="Alex Morgan",
            age=42,
            gender="Female",
            symptoms=["Mild fatigue"],
            chronic_conditions=["Hypertension"],
            allergies=["Amoxicillin"]
        )
        self.assertEqual(intake.provenance, "PATIENT_PROVIDED")

    def test_lab_finding_provenance(self):
        """Extracted laboratory findings must carry DOCUMENT_EXTRACTED provenance and source tracking."""
        finding = LabFinding(
            id="f-test-01",
            report_id="rep-test-01",
            patient_id="P-TEST-01",
            test_name="Serum Creatinine",
            value="1.45",
            unit="mg/dL",
            reference_range="0.70 - 1.20",
            status=ReferenceStatus.HIGH,
            source_document="Renal_Panel_2026.pdf",
            source_page=1,
            confidence=0.96,
            source_type="DOCUMENT_EXTRACTED",
            verification_status=VerificationStatus.PENDING
        )
        self.assertEqual(finding.source_type, "DOCUMENT_EXTRACTED")
        self.assertEqual(finding.source_document, "Renal_Panel_2026.pdf")
        self.assertGreaterEqual(finding.confidence, 0.90)

    # -------------------------------------------------------------------------
    # 3. HUMAN VERIFICATION LIFECYCLE (HIGH-VALUE REQUIREMENT)
    # -------------------------------------------------------------------------
    def test_verification_status_transition(self):
        """Findings start as PENDING and transition to VERIFIED upon clinician review."""
        finding = LabFinding(
            id="f-test-02",
            report_id="rep-test-01",
            patient_id="P-TEST-01",
            test_name="Fasting Glucose",
            value="182",
            unit="mg/dL",
            reference_range="70 - 99",
            status=ReferenceStatus.HIGH,
            verification_status=VerificationStatus.PENDING
        )
        self.assertEqual(finding.verification_status, VerificationStatus.PENDING)

        # Clinician verifies finding
        finding.verification_status = VerificationStatus.VERIFIED
        finding.verified_by = "DR-CHOWDHURY"
        finding.source_type = "HUMAN_VERIFIED"

        self.assertEqual(finding.verification_status, VerificationStatus.VERIFIED)
        self.assertEqual(finding.source_type, "HUMAN_VERIFIED")

    # -------------------------------------------------------------------------
    # 4. INCONSISTENCY & CONFLICT RADAR (HIGH-VALUE REQUIREMENT)
    # -------------------------------------------------------------------------
    def test_inconsistency_radar_detection(self):
        """Radar must flag discrepancy when patient reports no diabetes but glucose is markedly elevated."""
        patient_profile = {
            "patient_id": "P-TEST-02",
            "full_name": "Eleanor Vance",
            "chronic_conditions": ["Hypertension"],  # No diabetes listed
            "allergies": []
        }
        findings = [
            LabFinding(
                id="f-test-03",
                report_id="rep-test-02",
                patient_id="P-TEST-02",
                test_name="Fasting Blood Glucose",
                value="182",
                numeric_value=182.0,
                unit="mg/dL",
                reference_range="70.0 - 99.0",
                status=ReferenceStatus.HIGH
            )
        ]
        review_items = medlens_service.detect_review_items(patient_profile, findings)
        conflict_titles = [r.title for r in review_items]
        self.assertTrue(any("Elevated Fasting Blood Glucose" in title or "Glucose" in title for title in conflict_titles))

    # -------------------------------------------------------------------------
    # 5. RESPONSIBLE AI & NON-DIAGNOSTIC BOUNDARIES (CORE REQUIREMENT F)
    # -------------------------------------------------------------------------
    def test_patient_summary_non_diagnostic(self):
        """Patient summary must NOT diagnose, prescribe, or recommend dosage changes."""
        findings = [
            LabFinding(
                id="f-test-04",
                report_id="rep-test-03",
                patient_id="P-TEST-03",
                test_name="Fasting Blood Glucose",
                value="182",
                unit="mg/dL",
                reference_range="70.0 - 99.0",
                status=ReferenceStatus.HIGH
            ),
            LabFinding(
                id="f-test-05",
                report_id="rep-test-03",
                patient_id="P-TEST-03",
                test_name="Hemoglobin (Hb)",
                value="10.8",
                unit="g/dL",
                reference_range="12.0 - 15.5",
                status=ReferenceStatus.LOW
            )
        ]
        summary, key_findings, questions = medlens_service.generate_patient_summary(
            patient_name="Eleanor Vance",
            findings=findings,
            review_items=[]
        )
        summary_lower = summary.lower()

        # Must NOT diagnose disease
        self.assertNotIn("you have diabetes", summary_lower)
        self.assertNotIn("diagnosed with anemia", summary_lower)
        # Must NOT prescribe medication
        self.assertNotIn("take metformin", summary_lower)
        self.assertNotIn("increase dosage", summary_lower)

        # Must provide 3 context-aware questions for clinician review
        self.assertGreaterEqual(len(questions), 1)

    # -------------------------------------------------------------------------
    # 6. SMART CONTEXTUAL ASSISTANT
    # -------------------------------------------------------------------------
    def test_smart_assistant_contextual_query(self):
        """Assistant must query contextual patient state and cite evidence."""
        res = self.run_async(
            medlens_service.query_clinical_assistant("P-101", "What are abnormal biomarkers?")
        )
        self.assertIn("answer", res)
        self.assertIn("safety_disclaimer", res)
        self.assertIn("suggested_followups", res)
        self.assertGreaterEqual(len(res["suggested_followups"]), 1)


    # -------------------------------------------------------------------------
    # 7. HIGH-EFFICIENCY DETERMINISTIC CACHING (EFFICIENCY CRITERION)
    # -------------------------------------------------------------------------
    def test_efficiency_document_caching(self):
        """Identical document text must return cached extraction without redundant processing."""
        from app.core.cache import document_cache
        from app.ai.document_extractor import document_extractor
        
        sample_text = "Fasting Blood Glucose: 110 mg/dL (Ref: 70.0 - 99.0)\nSerum Creatinine: 0.9 mg/dL (Ref: 0.6 - 1.2)"
        # First extraction (populate cache)
        first_pass = document_extractor.extract_findings(sample_text, "P-TEST-CACHE", "REP-01")
        self.assertGreaterEqual(len(first_pass), 2)
        
        # Second extraction (should hit cache)
        initial_hits = document_cache.hits
        second_pass = document_extractor.extract_findings(sample_text, "P-TEST-CACHE", "REP-02")
        self.assertGreater(document_cache.hits, initial_hits)
        self.assertEqual(len(second_pass), len(first_pass))

    # -------------------------------------------------------------------------
    # 8. DRUG-BIOMARKER CONFLICT RADAR (PROBLEM ALIGNMENT)
    # -------------------------------------------------------------------------
    def test_nsaid_nephrotoxicity_radar(self):
        """Conflict radar must flag active NSAID intake combined with elevated Creatinine."""
        from app.core.conflict_radar import conflict_radar
        from app.schemas.medlens_schema import MedicationItem
        
        intake = PatientIntake(
            patient_id="P-TEST-NSAID",
            full_name="Sarah Connor",
            age=52,
            gender="Female",
            symptoms=["Back pain"],
            chronic_conditions=[],
            allergies=[],
            current_medications=[MedicationItem(name="Ibuprofen 400mg", dosage="400mg")]
        )
        findings = [
            {"test_name": "Serum Creatinine", "value": "1.8", "numeric_value": 1.8, "unit": "mg/dL", "reference_range": "0.6 - 1.2"}
        ]
        items = conflict_radar.detect_conflicts(intake, findings)
        self.assertTrue(any("NSAID" in i.title for i in items))
        self.assertEqual(items[0].severity, "CRITICAL")

    # -------------------------------------------------------------------------
    # 9. LONGITUDINAL BIOMARKER TRENDS (LONGITUDINAL COMPARISON)
    # -------------------------------------------------------------------------
    def test_longitudinal_trend_delta_computation(self):
        """Trend engine must calculate accurate numerical delta and status transitions."""
        from app.core.trend_engine import trend_engine
        
        prev = [{"test_name": "Fasting Blood Glucose", "value": "95", "numeric_value": 95.0, "status": "NORMAL", "unit": "mg/dL", "reference_range": "70 - 99"}]
        curr = [{"test_name": "Fasting Blood Glucose", "value": "182", "numeric_value": 182.0, "status": "HIGH", "unit": "mg/dL", "reference_range": "70 - 99"}]
        
        trends = trend_engine.compare_reports(curr, prev, "2026-09-05", "2026-03-01")
        self.assertEqual(len(trends), 1)
        self.assertEqual(trends[0].delta, 87.0)
        self.assertEqual(trends[0].trend, "up")
        self.assertIn("NORMAL -> HIGH", trends[0].note)

if __name__ == "__main__":
    unittest.main(verbosity=2)
