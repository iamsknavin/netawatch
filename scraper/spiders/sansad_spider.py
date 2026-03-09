"""
Sansad.in Spider — Phase 1 STUB.
Phase 2: Scrape sansad.in for official Lok Sabha data.
"""
import scrapy
import logging

logger = logging.getLogger(__name__)


class SansadSpider(scrapy.Spider):
    """
    Scrapes sansad.in for official Lok Sabha member data.
    Phase 1 stub — structure ready for Phase 2 implementation.
    """

    name = "sansad"
    allowed_domains = ["sansad.in"]
    start_urls = ["https://sansad.in/ls/members"]

    def parse(self, response):
        logger.warning("Sansad spider is a Phase 1 stub. Full implementation in Phase 2.")
        return []
