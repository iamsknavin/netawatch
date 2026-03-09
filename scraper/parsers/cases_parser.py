"""
Parser for extracting criminal case data from MyNeta HTML tables.
"""
import re
import logging
from typing import Any

logger = logging.getLogger(__name__)

# IPC sections that qualify as heinous crimes
HEINOUS_IPC_SECTIONS = {
    "302",  # Murder
    "304",  # Culpable homicide not amounting to murder
    "307",  # Attempt to murder
    "376",  # Rape
    "363",  # Kidnapping
    "364",  # Kidnapping for ransom
    "365",  # Kidnapping with intent to confine
    "366",  # Kidnapping/abduction of woman
    "420",  # Cheating (fraud >1Cr typically)
    "406",  # Criminal breach of trust
    "409",  # Criminal breach of trust by public servant
    "13",   # Prevention of Corruption Act
    "7",    # Prevention of Corruption Act Section 7
    "120b", # Criminal conspiracy
    "121",  # Waging war against India
    "124a", # Sedition
}

# Financial fraud threshold for heinous flag
FINANCIAL_FRAUD_THRESHOLD = 1_00_00_000  # 1 crore


def is_heinous_case(ipc_sections: list[str], description: str = "") -> bool:
    """
    Determine if a case qualifies as heinous.
    Heinous = murder, rape, kidnapping, or financial fraud > 1Cr.
    """
    if not ipc_sections:
        return False

    sections_lower = {s.lower().strip() for s in ipc_sections}
    if sections_lower & HEINOUS_IPC_SECTIONS:
        return True

    # Check description for large fraud amounts
    if description:
        amounts = re.findall(r"[\d,]+", description.replace(",", ""))
        for amount_str in amounts:
            try:
                if int(amount_str) >= FINANCIAL_FRAUD_THRESHOLD:
                    return True
            except ValueError:
                pass

    return False


def parse_ipc_sections(text: str) -> list[str]:
    """
    Extract IPC section numbers from text like "IPC Section 302, 304B".
    Returns list of section numbers: ["302", "304B"]
    """
    if not text:
        return []

    # Remove common prefixes
    text = re.sub(r"(?i)(ipc|section|sec\.?|u/s|under)\s*", " ", text)

    # Extract section numbers (digits with optional letters like 420A, 304B)
    sections = re.findall(r"\b(\d+[A-Za-z]?)\b", text)

    # Deduplicate preserving order
    seen = set()
    result = []
    for s in sections:
        if s not in seen:
            seen.add(s)
            result.append(s)

    return result


def normalize_case_status(status_text: str) -> str:
    """Normalize case status to DB enum values."""
    text = status_text.lower().strip()

    if any(w in text for w in ["convict", "guilty", "sentenced"]):
        return "convicted"
    if any(w in text for w in ["acquit", "not guilty"]):
        return "acquitted"
    if any(w in text for w in ["discharg"]):
        return "discharged"
    if any(w in text for w in ["stay", "stayed"]):
        return "stayed"
    if any(w in text for w in ["pending", "trial", "under trial", "framed"]):
        return "pending"

    return "unknown"


def parse_case_row(row: dict[str, Any]) -> dict[str, Any]:
    """
    Parse a single criminal case row from MyNeta HTML.

    row keys expected: case_number, court_name, case_description, status,
                       ipc_sections_raw, filing_date, case_year
    """
    ipc_sections = parse_ipc_sections(row.get("ipc_sections_raw", ""))
    description = row.get("case_description", "") or ""
    status_raw = row.get("status", "") or ""

    return {
        "case_number": (row.get("case_number") or "").strip() or None,
        "court_name": (row.get("court_name") or "").strip() or None,
        "court_type": infer_court_type(row.get("court_name", "")),
        "ipc_sections": ipc_sections if ipc_sections else None,
        "case_description": description.strip() or None,
        "case_year": row.get("case_year"),
        "date_of_filing": row.get("filing_date"),
        "current_status": normalize_case_status(status_raw),
        "is_heinous": is_heinous_case(ipc_sections, description),
        "declaration_year": row.get("declaration_year"),
        "source_url": row.get("source_url"),
    }


def infer_court_type(court_name: str | None) -> str | None:
    """Infer court type from court name."""
    if not court_name:
        return None
    name = court_name.lower()
    if "supreme" in name:
        return "supreme_court"
    if "high court" in name or "high court" in name:
        return "high_court"
    if any(w in name for w in ["sessions", "district", "cjm", "acjm", "magistrate"]):
        return "district"
    return "district"
