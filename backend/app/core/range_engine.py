"""
MedLens Deterministic Reference-Range Engine
============================================
Evaluates clinical laboratory findings strictly against reference ranges
printed on the source diagnostic report.

Zero-Hallucination Policy:
- If a reference range is absent, missing, or unparseable: return NOT_DETERMINED.
- Never invent, assume, or default reference intervals.
- Distinguish between inequality boundaries (< 200, > 60) and interval boundaries (70 - 99).
"""

import re
from typing import Optional, Tuple
from ..schemas.medlens_schema import ReferenceStatus


class ReferenceRangeEngine:
    """
    Deterministic clinical reference-range evaluation engine.
    Completely isolated from LLM probabilistic behavior.
    """

    @staticmethod
    def parse_reference_range(range_str: Optional[str]) -> Tuple[Optional[float], Optional[float]]:
        """
        Parses reference ranges explicitly printed in the report.
        Strict rule: If absent, unparseable, or N/A -> returns (None, None).
        
        Supported formats:
        - Intervals: '70.0 - 99.0', '12.0 to 15.5', '70 – 99', '135-145'
        - Upper bound cutoffs: '< 200', '<= 130', '≤ 100'
        - Lower bound cutoffs: '> 60', '>= 1.5', '≥ 90'
        """
        if not range_str:
            return None, None
            
        clean = range_str.strip()
        if clean.upper() in ["NOT_DETERMINED", "N/A", "NONE", "NULL", "-", "--", ""]:
            return None, None

        # 1. Upper cutoff: '< 200', '<= 200', '≤ 200'
        less_match = re.match(r'^[<≤]\s*=?\s*(\d+(?:\.\d+)?)', clean)
        if less_match:
            try:
                return None, float(less_match.group(1))
            except ValueError:
                return None, None

        # 2. Lower cutoff: '> 60', '>= 60', '≥ 60'
        greater_match = re.match(r'^[>≥]\s*=?\s*(\d+(?:\.\d+)?)', clean)
        if greater_match:
            try:
                return float(greater_match.group(1)), None
            except ValueError:
                return None, None

        # 3. Interval: '70 - 99', '12.0 to 15.5', '70 – 99', '13.5 - 17.5'
        range_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:-|–|—|to)\s*(\d+(?:\.\d+)?)', clean, re.IGNORECASE)
        if range_match:
            try:
                low = float(range_match.group(1))
                high = float(range_match.group(2))
                if low <= high:
                    return low, high
                return high, low
            except ValueError:
                return None, None

        return None, None

    @staticmethod
    def evaluate_status(
        val_num: Optional[float], 
        ref_min: Optional[float], 
        ref_max: Optional[float]
    ) -> Tuple[ReferenceStatus, str]:
        """
        Deterministic status evaluation:
        - Returns (LOW, reason) if strictly below minimum
        - Returns (HIGH, reason) if strictly above maximum
        - Returns (NORMAL, reason) if within inclusive bounds
        - Returns (NOT_DETERMINED, reason) if reference range or numeric value is absent
        """
        if val_num is None:
            return ReferenceStatus.NOT_DETERMINED, "Non-numeric or qualitative finding; requires direct clinical inspection."

        # Both bounds available (Interval: [min, max])
        if ref_min is not None and ref_max is not None:
            if val_num < ref_min:
                delta = round(ref_min - val_num, 2)
                return ReferenceStatus.LOW, f"Observed value ({val_num}) is below report minimum ({ref_min}) by {delta}."
            elif val_num > ref_max:
                delta = round(val_num - ref_max, 2)
                return ReferenceStatus.HIGH, f"Observed value ({val_num}) exceeds report maximum ({ref_max}) by {delta}."
            else:
                return ReferenceStatus.NORMAL, f"Observed value ({val_num}) is within report interval [{ref_min} - {ref_max}]."

        # Upper bound only (e.g., < 200)
        elif ref_max is not None and ref_min is None:
            if val_num > ref_max:
                delta = round(val_num - ref_max, 2)
                return ReferenceStatus.HIGH, f"Observed value ({val_num}) exceeds report upper cutoff (< {ref_max}) by {delta}."
            else:
                return ReferenceStatus.NORMAL, f"Observed value ({val_num}) complies with report upper cutoff (< {ref_max})."

        # Lower bound only (e.g., > 60)
        elif ref_min is not None and ref_max is None:
            if val_num < ref_min:
                delta = round(ref_min - val_num, 2)
                return ReferenceStatus.LOW, f"Observed value ({val_num}) is below report lower cutoff (> {ref_min}) by {delta}."
            else:
                return ReferenceStatus.NORMAL, f"Observed value ({val_num}) meets report lower cutoff (> {ref_min})."

        # No bounds available
        return ReferenceStatus.NOT_DETERMINED, "Source report did not print reference bounds. MedLens does not infer external ranges."


# Singleton instance
range_engine = ReferenceRangeEngine()