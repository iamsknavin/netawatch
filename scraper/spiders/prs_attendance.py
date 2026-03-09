"""
PRS Legislative Research Attendance Spider — Phase 1 STUB.
Phase 2: Scrape prsindia.org for MP attendance, questions, debates.
"""
import scrapy
import logging

logger = logging.getLogger(__name__)


class PrsAttendanceSpider(scrapy.Spider):
    """
    Scrapes PRS India for parliamentary attendance data.
    Phase 1 stub — data structure and pipeline ready.

    To activate in Phase 2:
    1. Map PRS politician names to netawatch politician slugs
    2. Parse attendance tables by session
    3. Write to attendance_records table
    """

    name = "prs_attendance"
    allowed_domains = ["prsindia.org"]
    start_urls = ["https://prsindia.org/mptrack/17th-lok-sabha"]

    def parse(self, response):
        logger.warning(
            "PRS attendance spider is a Phase 1 stub. "
            "Full implementation coming in Phase 2."
        )
        return []
