"""
ECI Affidavit Spider — Phase 1 STUB.
Phase 2: Download and OCR-parse raw ECI affidavit PDFs.
"""
import scrapy
import logging

logger = logging.getLogger(__name__)


class EciAffidavitSpider(scrapy.Spider):
    """
    Phase 2 spider: Downloads ECI affidavit PDFs for offline OCR parsing.
    In Phase 1, MyNeta already provides structured HTML so this is not needed.

    To activate in Phase 2:
    1. Enable Playwright in settings.py (ECI site is JS-heavy)
    2. Implement parse_affidavit() in parsers/affidavit_parser.py
    3. Set up Tesseract OCR
    """

    name = "eci_affidavit"
    allowed_domains = ["affidavit.eci.gov.in"]
    start_urls = ["https://affidavit.eci.gov.in"]

    def parse(self, response):
        logger.warning(
            "ECI affidavit spider is a Phase 2 feature. "
            "Run the myneta spider for Phase 1 data collection."
        )
        return []
