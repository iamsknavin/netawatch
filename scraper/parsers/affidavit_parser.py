"""
ECI Affidavit PDF parser.
Phase 1: STUB — structure ready, OCR disabled.
Phase 2: Enable Tesseract OCR pipeline for raw PDF parsing.

MyNeta already provides structured HTML for Phase 1, so this module
is used only when we need to parse raw ECI PDF affidavits directly.
"""
import logging
from typing import Any

logger = logging.getLogger(__name__)


def parse_affidavit_pdf(pdf_path: str) -> dict[str, Any]:
    """
    Parse an ECI affidavit PDF and extract structured data.

    Phase 1 STUB: Returns empty dict and logs a warning.
    Phase 2: Implement Tesseract OCR + regex extraction.

    To enable in Phase 2:
    1. pip install pytesseract pillow pdf2image
    2. Install Tesseract: https://github.com/UB-Mannheim/tesseract/wiki
    3. Set TESSDATA_PREFIX env var
    4. Uncomment the implementation below
    """
    logger.warning(
        f"Affidavit PDF parsing is a Phase 2 feature. "
        f"Skipping: {pdf_path}"
    )
    return {}


# --- Phase 2 implementation (commented out) ---
# import pytesseract
# from PIL import Image
# import pdf2image
#
# def parse_affidavit_pdf(pdf_path: str) -> dict[str, Any]:
#     """Phase 2: Parse ECI affidavit PDF using Tesseract OCR."""
#     try:
#         pages = pdf2image.convert_from_path(pdf_path, dpi=300)
#         full_text = ""
#         for page in pages:
#             text = pytesseract.image_to_string(page, lang="eng+hin")
#             full_text += text + "\n"
#
#         from parsers.assets_parser import parse_assets_table
#         from parsers.cases_parser import parse_ipc_sections
#
#         # Extract structured data from OCR text
#         # ... (regex patterns for ECI affidavit format)
#         return {}
#     except Exception as e:
#         logger.error(f"PDF parsing failed for {pdf_path}: {e}")
#         return {}
