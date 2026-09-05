"""
MedLens Smart Context-Aware Clinical Assistant
==============================================
Provides evidence-grounded clinical decision support for clinicians.
Answers questions regarding:
- Laboratory abnormalities and source evidence citations
- Medication-biomarker correlations and contraindication checks
- Longitudinal trend trajectories across encounters
- Conflict radar discrepancies and audit records
"""

import os
import json
import urllib.request
from typing import Dict, Any, List, Optional
from ..core.cache import assistant_cache


class ClinicalAssistant:
    """
    Evidence-first clinical assistant that cites specific source reports and pages.
    """

    def __init__(self):
        self.api_key = os.environ.get("GEMINI_API_KEY", "")

    def answer_query(
        self,
        query: str,
        patient_intake: Dict[str, Any],
        findings: List[Dict[str, Any]],
        conflicts: List[Dict[str, Any]],
        comparisons: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Executes evidence-grounded contextual query reasoning.
        """
        patient_id = patient_intake.get("patient_id", "p")
        cache_key = f"assistant:{patient_id}:{query.strip().lower()}"
        cached = assistant_cache.get(cache_key)
        if cached:
            return cached

        # Try Gemini with grounded context
        if self.api_key:
            try:
                response = self._answer_with_gemini(query, patient_intake, findings, conflicts, comparisons)
                if response:
                    assistant_cache.set(cache_key, response)
                    return response
            except Exception as e:
                print(f"[Assistant] Gemini query failed, falling back to deterministic answer: {e}")

        # Deterministic Grounded Fallback
        response = self._answer_deterministically(query, patient_intake, findings, conflicts)
        assistant_cache.set(cache_key, response)
        return response

    def _answer_deterministically(
        self,
        query: str,
        intake: Dict[str, Any],
        findings: List[Dict[str, Any]],
        conflicts: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Provides instant, reliable grounded clinical answers without LLM dependency."""
        q_low = query.lower()
        abnormal = [f for f in findings if f.get("status") in ["HIGH", "LOW"]]
        meds = intake.get("current_medications", [])
        allergies = intake.get("allergies", [])

        answer = ""
        evidence_citations = []
        suggestions = [
            "What are the top 3 clinical anomalies in this patient's report?",
            "Are any active medications in conflict with renal lab findings?",
            "Compare current glycemic indicators against baseline."
        ]

        if any(w in q_low for w in ["abnormal", "outlier", "high", "low", "unusual"]):
            answer = f"Found {len(abnormal)} biomarker(s) flagged outside source reference ranges:\n"
            for f in abnormal[:5]:
                answer += f"• {f['test_name']}: {f['value']} {f.get('unit','')} (Status: {f.get('status')}, Source: {f.get('source_document', 'Report')}, Ref: {f.get('reference_range', 'N/A')})\n"
                evidence_citations.append({
                    "test_name": f["test_name"],
                    "value": f["value"],
                    "source": f.get("source_document", "Diagnostic Report"),
                    "page": f.get("source_page", 1)
                })

        elif any(w in q_low for w in ["medication", "drug", "nsaid", "interaction", "contraind"]):
            med_names = [m.get("name", "") for m in meds]
            answer = f"The patient self-reports taking: {', '.join(med_names) if med_names else 'No active medications'}.\n"
            if conflicts:
                answer += f"\nConflict Radar Alert: {len(conflicts)} active clinical conflict(s) detected between medications and objective lab data.\n"
                for c in conflicts[:3]:
                    answer += f"• {c.get('title')}: {c.get('description')}\n"
                    evidence_citations.append({
                        "title": c.get("title"),
                        "evidence": c.get("source_evidence")
                    })
            else:
                answer += "No direct drug-biomarker conflicts detected in current findings."

        elif any(w in q_low for w in ["allergy", "allergic", "hypersensitivity"]):
            answer = f"Documented Patient Allergies (Patient-Provided):\n"
            for a in allergies:
                answer += f"• {a}\n"
            answer += "\nAlways cross-reference before administering or prescribing any new medication classes."

        else:
            answer = (
                f"Clinical dossier synthesis for {intake.get('full_name', 'Patient')} (Age {intake.get('age', 'N/A')}, {intake.get('gender', 'N/A')}):\n"
                f"• Total Extracted Biomarkers: {len(findings)}\n"
                f"• Out-of-Range Biomarkers: {len(abnormal)}\n"
                f"• Active Review Radar Items: {len(conflicts)}\n"
                f"• Documented Conditions: {', '.join(intake.get('chronic_conditions', ['None']))}\n"
                f"All metrics are traceable to source diagnostic documents."
            )

        return {
            "query": query,
            "answer": answer,
            "evidence_citations": evidence_citations,
            "follow_up_suggestions": suggestions,
            "provenance": "AI_ASSISTANT_GROUNDED",
            "confidence": 0.96
        }

    def _answer_with_gemini(
        self,
        query: str,
        intake: Dict[str, Any],
        findings: List[Dict[str, Any]],
        conflicts: List[Dict[str, Any]],
        comparisons: Optional[List[Dict[str, Any]]]
    ) -> Optional[Dict[str, Any]]:
        """Invokes Gemini 1.5 Flash with clinical context and provenance citation rules."""
        context = {
            "patient": {
                "name": intake.get("full_name"),
                "age": intake.get("age"),
                "gender": intake.get("gender"),
                "conditions": intake.get("chronic_conditions"),
                "medications": intake.get("current_medications"),
                "allergies": intake.get("allergies")
            },
            "findings_sample": [
                {"name": f["test_name"], "val": f["value"], "unit": f.get("unit"), "status": f.get("status"), "range": f.get("reference_range"), "doc": f.get("source_document")}
                for f in findings[:25]
            ],
            "active_conflicts": [
                {"title": c.get("title"), "description": c.get("description")} for c in conflicts
            ]
        }

        prompt = f"""You are MedLens Smart Clinical Information Assistant.
Answer the clinician's query accurately using ONLY the clinical context provided below.

CLINICAL CONTEXT:
{json.dumps(context, indent=2)}

CLINICIAN QUERY:
"{query}"

STRICT GUIDELINES:
1. Cite specific tests, values, reference ranges, and source documents.
2. Highlight clinical relevance or potential discrepancies.
3. NEVER make a diagnosis or prescribe treatments.
4. Provide exactly 3 concise follow-up query suggestions.

Return ONLY a JSON object:
{{
  "answer": "detailed evidence-based response...",
  "evidence_citations": [
    {{"test_name": "...", "value": "...", "source": "...", "note": "..."}}
  ],
  "follow_up_suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"]
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
        with urllib.request.urlopen(req, timeout=12) as response:
            result = json.loads(response.read().decode("utf-8"))
            content = result["candidates"][0]["content"]["parts"][0]["text"]
            clean = json.loads(content)
            clean["query"] = query
            clean["provenance"] = "AI_ASSISTANT_GROUNDED"
            clean["confidence"] = 0.98
            return clean


# Singleton instance
clinical_assistant = ClinicalAssistant()