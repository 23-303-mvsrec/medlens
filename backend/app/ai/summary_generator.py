"""
MedLens Responsible AI Clinical Summary Generator
==================================================
Produces patient-friendly, 8th-grade readability summaries and clarifying questions.

Strict Non-Diagnostic Guardrails:
- Never diagnoses diseases or conditions.
- Never prescribes or alters medication dosages.
- Never fabricates facts or invents reference ranges.
- Presents clear, objective information with source attribution.
"""

import os
import json
import urllib.request
from typing import Dict, Any, List
from ..core.cache import summary_cache


class ClinicalSummaryGenerator:
    """
    Synthesizes structured findings into plain language summaries for patient comprehension.
    """

    def __init__(self):
        self.api_key = os.environ.get("GEMINI_API_KEY", "")

    def generate_summary(
        self,
        patient_name: str,
        findings: List[Dict[str, Any]],
        intake_context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Generates structured plain-language summary and 3 recommended clinician questions.
        Caches output to prevent redundant LLM invocations.
        """
        cache_key = f"summary:{intake_context.get('patient_id', 'p')}:{len(findings)}"
        cached = summary_cache.get(cache_key)
        if cached:
            return cached

        # Separate findings by status
        abnormal = [f for f in findings if f.get("status") in ["HIGH", "LOW"]]
        normal = [f for f in findings if f.get("status") == "NORMAL"]
        undetermined = [f for f in findings if f.get("status") == "NOT_DETERMINED"]

        # Default clinical fallback generator (reliable, zero API dependency)
        summary_obj = self._build_deterministic_summary(patient_name, abnormal, normal, undetermined, intake_context)

        # Try Gemini if key available
        if self.api_key:
            try:
                ai_summary = self._generate_with_gemini(patient_name, abnormal, normal, intake_context)
                if ai_summary:
                    summary_obj = ai_summary
            except Exception as e:
                print(f"[SummaryGenerator] Gemini call failed, using deterministic summary: {e}")

        summary_cache.set(cache_key, summary_obj)
        return summary_obj

    def _build_deterministic_summary(
        self,
        patient_name: str,
        abnormal: List[Dict[str, Any]],
        normal: List[Dict[str, Any]],
        undetermined: List[Dict[str, Any]],
        intake: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Deterministic, evidence-grounded summary generation.
        Strictly factual, non-diagnostic.
        """
        high_items = [f"{f['test_name']} ({f['value']} {f.get('unit','')}, Ref: {f.get('reference_range','N/A')})" for f in abnormal if f.get("status") == "HIGH"]
        low_items = [f"{f['test_name']} ({f['value']} {f.get('unit','')}, Ref: {f.get('reference_range','N/A')})" for f in abnormal if f.get("status") == "LOW"]

        summary_text = (
            f"This diagnostic summary organizes the results from your recent clinical laboratory panel. "
            f"A total of {len(abnormal) + len(normal) + len(undetermined)} individual biomarkers were analyzed against "
            f"the reference standards calibrated by the testing laboratory.\n\n"
        )

        if high_items:
            summary_text += f"• Elevated Findings: {len(high_items)} test(s) exceeded the laboratory's printed reference range: {', '.join(high_items)}.\n"
        if low_items:
            summary_text += f"• Below-Range Findings: {len(low_items)} test(s) were lower than the printed minimum: {', '.join(low_items)}.\n"
        if normal:
            summary_text += f"• Within Expected Range: {len(normal)} biomarker(s) were within standard reference intervals.\n"
        if undetermined:
            summary_text += f"• Reference Range Unavailable: {len(undetermined)} test(s) did not have reference limits printed on the report.\n"

        summary_text += (
            "\nNote: Lab values must always be interpreted in the context of your personal health history, symptoms, "
            "and clinical physical examination by your licensed healthcare provider."
        )

        # 3 Recommended questions tailored to findings
        questions = [
            f"What do my specific abnormal biomarker levels (such as {abnormal[0]['test_name'] if abnormal else 'my panel'}) indicate for my overall health plan?",
            "Are any repeat laboratory tests or specialized follow-up panels recommended in the next 3 to 6 months?",
            "Should any of my current daily medications or dietary habits be reviewed based on these objective laboratory results?"
        ]

        return {
            "summary": summary_text,
            "key_highlights": [
                f"{len(abnormal)} biomarker(s) flagged outside source reference ranges.",
                f"{len(normal)} biomarker(s) confirmed within normal laboratory bounds.",
                "All numerical evaluations were calculated deterministically against the source report."
            ],
            "clarifying_questions": questions,
            "disclaimer": (
                "MedLens is an informational clinical intelligence system. It does NOT provide medical diagnoses, "
                "prescriptions, or treatment plans. Consult your physician for medical decisions."
            ),
            "provenance": "AI_GENERATED",
            "reading_level": "8th Grade (Accessible Plain Language)"
        }

    def _generate_with_gemini(
        self,
        patient_name: str,
        abnormal: List[Dict[str, Any]],
        normal: List[Dict[str, Any]],
        intake: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Calls Gemini with strict non-diagnostic instructions."""
        abnormal_summary = [{"name": f["test_name"], "val": f["value"], "range": f.get("reference_range")} for f in abnormal]
        prompt = f"""You are MedLens Responsible AI Summary Generator.
Write a patient-friendly summary for {patient_name} based ONLY on these laboratory findings:
Abnormal findings: {json.dumps(abnormal_summary)}
Normal count: {len(normal)}
Patient Reported Conditions: {json.dumps(intake.get('chronic_conditions', []))}

MANDATORY SAFETY GUARDRAILS:
1. NEVER diagnose a medical condition (do NOT say 'you have diabetes' or 'you suffer from anemia').
2. NEVER prescribe treatments, medications, or dosage modifications.
3. Write at an accessible 8th-grade reading level.
4. Provide exactly 3 clear, actionable questions the patient should ask their doctor.

Return ONLY a JSON object:
{{
  "summary": "plain language explanation...",
  "key_highlights": ["point 1", "point 2", "point 3"],
  "clarifying_questions": ["question 1", "question 2", "question 3"]
}}
"""
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={self.api_key}"
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.2,
                "response_mime_type": "application/json"
            }
        }
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=10) as response:
            result = json.loads(response.read().decode("utf-8"))
            content = result["candidates"][0]["content"]["parts"][0]["text"]
            clean = json.loads(content)
            clean["disclaimer"] = (
                "MedLens is an informational clinical intelligence system. It does NOT provide medical diagnoses, "
                "prescriptions, or treatment plans. Consult your physician for medical decisions."
            )
            clean["provenance"] = "AI_GENERATED"
            clean["reading_level"] = "8th Grade (Accessible Plain Language)"
            return clean


# Singleton instance
summary_generator = ClinicalSummaryGenerator()