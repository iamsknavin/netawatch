"""
Parser for extracting asset figures from MyNeta HTML tables.
MyNeta structures affidavit data in HTML tables — no OCR needed for Phase 1.
Phase 2 will add Tesseract OCR for raw PDF affidavit parsing.
"""
import re
import logging
from typing import Any

logger = logging.getLogger(__name__)

# Regex to extract numeric value from strings like "Rs.1,23,45,678" or "1,23,45,678"
_AMOUNT_RE = re.compile(r"[\d,]+\.?\d*")


def parse_amount(text: str | None) -> float | None:
    """
    Parse an Indian currency string to a float.
    "Rs. 1,23,45,678" → 12345678.0
    """
    if not text:
        return None
    text = text.strip().replace("Rs.", "").replace("Rs", "").replace("₹", "").strip()
    match = _AMOUNT_RE.search(text.replace(",", ""))
    if match:
        try:
            return float(match.group())
        except ValueError:
            pass
    return None


def parse_assets_table(rows: list[dict]) -> dict[str, Any]:
    """
    Parse the movable/immovable assets rows from MyNeta profile table.

    rows: list of {"label": str, "value": str} dicts from the asset table.
    Returns a dict matching the assets_declarations table columns.
    """
    result: dict[str, Any] = {}

    # Mapping from MyNeta label patterns to DB column names
    label_map = {
        # Movable assets
        "cash": "cash_in_hand",
        "bank": "bank_deposits",
        "bond": "bonds_debentures",
        "nsc": "nsc_postal",
        "postal": "nsc_postal",
        "lic": "lic_policies",
        "insurance": "lic_policies",
        "loan": "personal_loans_given",
        "motor": "motor_vehicles",
        "vehicle": "motor_vehicles",
        "jewell": "jewelry_gold",
        "gold": "jewelry_gold",
        "ornament": "jewelry_gold",
        "total movable": "total_movable_assets",
        "movable": "total_movable_assets",
        # Immovable assets
        "agricultural land": "agricultural_land",
        "agri": "agricultural_land",
        "non-agricultural": "non_agricultural_land",
        "non agricultural": "non_agricultural_land",
        "commercial": "buildings",
        "residential": "buildings",
        "building": "buildings",
        "house": "buildings",
        "total immovable": "total_immovable_assets",
        "immovable": "total_immovable_assets",
        # Summary
        "total asset": "total_assets",
        "total liabilit": "total_liabilities",
        "net worth": "net_worth",
        "liabilit": "total_liabilities",
    }

    for row in rows:
        label = (row.get("label") or "").lower().strip()
        value = row.get("value") or ""

        for key, col in label_map.items():
            if key in label:
                parsed = parse_amount(value)
                if parsed is not None:
                    # For columns that might appear multiple times, accumulate
                    if col in ("buildings",) and col in result:
                        result[col] = (result[col] or 0) + parsed
                    else:
                        result[col] = parsed
                break

    return result
