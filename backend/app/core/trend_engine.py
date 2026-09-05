"""
MedLens Longitudinal Biomarker Comparison Engine
================================================
Programmatically tracks biomarker shifts and status transitions
across successive clinical encounters for a patient.

Deterministic Delta Calculations:
- delta = current_value - previous_value
- delta_percent = (delta / previous_value) * 100
- trend = up | down | stable
- previous_status / current_status = ReferenceStatus
"""

from typing import List, Dict, Any, Optional
from ..schemas.medlens_schema import (
    BiomarkerComparison,
    ReferenceStatus
)


class LongitudinalTrendEngine:
    """
    Deterministic trend comparator between past and present diagnostic reports.
    """

    @staticmethod
    def compare_reports(
        current_findings: List[Dict[str, Any]],
        previous_findings: List[Dict[str, Any]],
        current_date: str = "Current Encounter",
        previous_date: str = "Previous Encounter"
    ) -> List[BiomarkerComparison]:
        """
        Aligns matching biomarkers across two reports and computes trajectory metrics.
        """
        prev_map: Dict[str, Dict[str, Any]] = {}
        for f in previous_findings:
            key = f.get("test_name", "").strip().lower()
            prev_map[key] = f

        comparisons: List[BiomarkerComparison] = []

        def to_status(s: Any) -> ReferenceStatus:
            if isinstance(s, ReferenceStatus):
                return s
            s_str = str(s).upper() if s else "NOT_DETERMINED"
            for member in ReferenceStatus:
                if member.value == s_str:
                    return member
            return ReferenceStatus.NOT_DETERMINED

        for curr in current_findings:
            test_name = curr.get("test_name", "").strip()
            key = test_name.lower()
            prev = prev_map.get(key)

            curr_num = curr.get("numeric_value")
            if curr_num is None:
                try:
                    curr_num = float(curr.get("value", 0))
                except (ValueError, TypeError):
                    curr_num = 0.0

            curr_status = to_status(curr.get("status"))
            unit = curr.get("unit", "")
            ref_range = curr.get("reference_range", "NOT_DETERMINED")
            category = curr.get("category", "General Chemistry")
            curr_source = curr.get("source_document", "Current Report")

            if prev:
                prev_num = prev.get("numeric_value")
                if prev_num is None:
                    try:
                        prev_num = float(prev.get("value", 0))
                    except (ValueError, TypeError):
                        prev_num = 0.0

                prev_status = to_status(prev.get("status"))
                prev_source = prev.get("source_document", "Previous Report")

                delta = round(curr_num - prev_num, 2)
                delta_pct = round((delta / prev_num) * 100, 1) if prev_num != 0 else 0.0

                if delta > 0.05:
                    trend = "up"
                elif delta < -0.05:
                    trend = "down"
                else:
                    trend = "stable"

                note = f"{prev_status.value} -> {curr_status.value}"
                if curr_status == ReferenceStatus.HIGH and prev_status != ReferenceStatus.HIGH:
                    note = f"New elevation outside reference range ({note})"
                elif curr_status == ReferenceStatus.NORMAL and prev_status != ReferenceStatus.NORMAL:
                    note = f"Normalized back into reference bounds ({note})"

                comparisons.append(BiomarkerComparison(
                    test_name=test_name,
                    category=category,
                    unit=unit,
                    reference_range=ref_range,
                    previous_val=prev_num,
                    previous_status=prev_status,
                    previous_date=previous_date,
                    previous_source=prev_source,
                    current_val=curr_num,
                    current_status=curr_status,
                    current_date=current_date,
                    current_source=curr_source,
                    delta=delta,
                    delta_percent=delta_pct,
                    trend=trend,
                    note=note
                ))

        return comparisons


# Singleton instance
trend_engine = LongitudinalTrendEngine()