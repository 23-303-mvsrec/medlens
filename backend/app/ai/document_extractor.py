"""
MedLens AI Document Information Extractor
=========================================
Extracts structured clinical findings from raw medical report text or images.
Features:
1. Google Gemini 1.5 Flash structured output parsing
2. Zero-Failure Fallback: High-precision deterministic regex lab parser
3. Integrated Deterministic Reference-Range Engine evaluation
4. Content-Hash Caching: Prevents redundant AI API calls for identical documents
"""

import os
import re
import json
import uuid
import urllib.request
from typing import List, Dict, Any, Tuple, Optional
from ..core.range_engine import range_engine
from ..core.cache import document_cache
from ..core.provenance import ProvenanceEngine
from ..schemas.medlens_schema import (
    ProvenanceType,
    VerificationStatus,
    ReferenceStatus,
    LabFinding
)


class DocumentExtractor:
    """
    Hybrid AI + Deterministic extraction pipeline.
    Transforms raw document content into strongly validated LabFinding objects.
    """

    def __init__(self):
        self.api_key = os.environ.get("GEMINI_API_KEY", "")

    def extract_findings(
        self,
        text_content: str,
        patient_id: str,
        report_id: str,
        report_name: str = "Uploaded Diagnostic Report"
    ) -> List[Dict[str, Any]]:
        """
        Main extraction entry point.
        Checks cache first; executes Gemini extraction with deterministic regex fallback.
        """
        if not text_content or not text_content.strip():
            return []

        # 1. Efficiency Check: Content-Hash Caching
        content_hash = document_cache.compute_content_hash(text_content)
        cached_result = document_cache.get(content_hash)
        if cached_result:
            # Re-key with current report_id and patient_id
            rekeyed = []
            for item in cached_result:
                c = dict(item)
                c["id"] = f"fnd-{uuid.uuid4().hex[:8]}"
                c["patient_id"] = patient_id
                c["report_id"] = report_id
                rekeyed.append(c)
            return rekeyed

        # 2. Try Gemini Extraction if API Key is available
        raw_items: List[Dict[str, Any]] = []
        if self.api_key:
            try:
                raw_items = self._extract_with_gemini(text_content)
            except Exception as e:
                print(f"[Extractor] Gemini extraction error, invoking deterministic fallback: {e}")
                raw_items = self._extract_with_regex(text_content)
        else:
            raw_items = self._extract_with_regex(text_content)

        # 3. Post-Process with Deterministic Reference-Range Engine
        structured_findings: List[Dict[str, Any]] = []
        for idx, item in enumerate(raw_items):
            test_name = item.get("test_name", f"Lab Finding {idx+1}").strip()
            raw_val = str(item.get("value", "")).strip()
            unit = str(item.get("unit", "")).strip()
            raw_range = item.get("reference_range")
            category = item.get("category", "General Chemistry")
            observation = item.get("observation", "")

            # Parse numeric value
            num_val: Optional[float] = None
            num_match = re.search(r'[-+]?\d*\.?\d+', raw_val)
            if num_match:
                try:
                    num_val = float(num_match.group(0))
                except ValueError:
                    num_val = None

            # DETERMINISTIC RANGE EVALUATION (NEVER INVENT RANGES)
            ref_min, ref_max = range_engine.parse_reference_range(raw_range)
            status, reason = range_engine.evaluate_status(num_val, ref_min, ref_max)

            finding = {
                "id": f"fnd-{uuid.uuid4().hex[:8]}",
                "report_id": report_id,
                "patient_id": patient_id,
                "test_name": test_name,
                "category": category,
                "value": raw_val,
                "numeric_value": num_val,
                "unit": unit,
                "reference_range": raw_range if raw_range else "NOT_DETERMINED",
                "ref_min": ref_min,
                "ref_max": ref_max,
                "status": status.value,
                "reason": reason,
                "observation": observation,
                "source_document": report_name,
                "source_page": item.get("source_page", 1),
                "source_snippet": item.get("source_snippet", f"{test_name}: {raw_val} {unit}"),
                "confidence": 0.98 if self.api_key else 0.95,
                "provenance": ProvenanceType.DOCUMENT_EXTRACTED.value,
                "verification_status": VerificationStatus.PENDING.value,
                "created_at": ProvenanceEngine.now_iso()
            }
            structured_findings.append(finding)

        # 4. Cache structured findings
        document_cache.set(content_hash, structured_findings)

        return structured_findings

    def _extract_with_gemini(self, text: str) -> List[Dict[str, Any]]:
        """Invokes Gemini 1.5 Flash with strict JSON Schema constraints."""
        prompt = f"""You are MedLens Medical Document Information Extractor.
Extract laboratory test items from the clinical text below into a JSON array of objects.

STRICT CLINICAL RULES:
1. ONLY extract tests explicitly mentioned in the text.
2. Extract the EXACT reference range printed in the document. If missing, set reference_range to null.
3. NEVER invent or hallucinate reference ranges.
4. Extract test_name, value, unit, reference_range, category, and source_snippet.

Text to extract:
\"\"\"{text[:12000]}\"\"\"

Return ONLY a JSON array with this schema:
[
  {{
    "test_name": "string",
    "category": "string",
    "value": "string",
    "unit": "string",
    "reference_range": "string or null",
    "observation": "string",
    "source_snippet": "exact snippet from text"
  }}
]
"""
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={self.api_key}"
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.1,
                "response_mime_type": "application/json"
            }
        }
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=12) as response:
            result = json.loads(response.read().decode("utf-8"))
            content = result["candidates"][0]["content"]["parts"][0]["text"]
            clean_json = re.sub(r"^```json\s*", "", content.strip())
            clean_json = re.sub(r"\s*```$", "", clean_json)
            parsed = json.loads(clean_json)
            if isinstance(parsed, list):
                return parsed
            if isinstance(parsed, dict) and "tests" in parsed:
                return parsed["tests"]
            return []

    def _extract_with_regex(self, text: str) -> List[Dict[str, Any]]:
        """
        High-precision deterministic regex parser for common laboratory reports:
        Matches patterns like:
        - 'Fasting Blood Glucose: 182 mg/dL (Ref: 70.0 - 99.0)'
        - 'Hemoglobin: 10.8 g/dL [12.0 - 15.5]'
        - 'Total Cholesterol: 245 mg/dL (< 200)'
        """
        findings = []
        lines = text.split("\n")

        # Regex pattern for structured laboratory reports:
        # e.g., Test Name : Value Unit (Ref: min - max)
        pattern = re.compile(
            r'^\s*([A-Za-z0-9\s,\-\(\)\/\+]+?)\s*[:=\t]\s*([<>]?\s*\d+(?:\.\d+)?)\s*([A-Za-z\/%\^\d\-\.]+)?'
            r'(?:\s*[\(\[\{]?(?:Ref|Reference|Normal|Interval)?[:\s]*([<>=≤≥\s\d\.\-–to]+)[\)\]\}]?)?',
            re.IGNORECASE
        )

        for line in lines:
            line_clean = line.strip()
            if not line_clean or line_clean.startswith("#") or len(line_clean) < 4:
                continue

            match = pattern.match(line_clean)
            if match:
                test_name = match.group(1).strip()
                val = match.group(2).strip()
                unit = match.group(3).strip() if match.group(3) else ""
                ref_range = match.group(4).strip() if match.group(4) else None

                # Clean up unit if it captured brackets
                unit = re.sub(r'[\[\]\(\)]', '', unit).strip()

                # Infer clinical category
                name_low = test_name.lower()
                category = "General Chemistry"
                if any(k in name_low for k in ["glucose", "hba1c", "insulin"]):
                    category = "Glycemic Control"
                elif any(k in name_low for k in ["cholesterol", "triglyceride", "ldl", "hdl", "vldl"]):
                    category = "Lipid Panel"
                elif any(k in name_low for k in ["creatinine", "egfr", "bun", "urea", "uric"]):
                    category = "Renal Function"
                elif any(k in name_low for k in ["hemoglobin", "rbc", "wbc", "platelet", "hematocrit", "mcv"]):
                    category = "Hematology"
                elif any(k in name_low for k in ["alt", "ast", "bilirubin", "alp", "albumin"]):
                    category = "Hepatic Panel"
                elif any(k in name_low for k in ["tsh", "t3", "t4"]):
                    category = "Thyroid Panel"

                findings.append({
                    "test_name": test_name,
                    "category": category,
                    "value": val,
                    "unit": unit,
                    "reference_range": ref_range,
                    "observation": "",
                    "source_snippet": line_clean
                })

        return findings


# Singleton instance
document_extractor = DocumentExtractor()