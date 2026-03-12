"""
Company Interests Spider — scrapes politician-linked business directorships.

Strategy (no paid API needed):
  1. MyNeta RS Interest declarations: myneta.info/InterestbyRajyasabhaMember/
     - Lists directorships, shareholdings, remunerative activities
  2. MyNeta affidavit profession fields for LS/MLA candidates
     - Self-declared professions like "Business", "Directorship"
  3. Future: MCA V3 Director Master Data (requires captcha solving)

Sources:
  - MyNeta "Declaration of Interests by Rajya Sabha Member"
  - MyNeta candidate affidavit pages (profession field)

Usage:
  scrapy crawl mca21                     # all politicians
  scrapy crawl mca21 -a limit=10         # test with 10
  scrapy crawl mca21 -a dry_run=true     # preview only
"""
import logging
import os
import re
from typing import Any, Generator
from urllib.parse import urljoin

import scrapy
from scrapy.http import Response

logger = logging.getLogger(__name__)

RS_INTERESTS_URL = "https://myneta.info/InterestbyRajyasabhaMember/"


class Mca21Spider(scrapy.Spider):
    """Scrapes company/business interests from MyNeta interest declarations."""

    name = "mca21"
    allowed_domains = ["myneta.info"]
    custom_settings = {
        "DOWNLOAD_DELAY": 2.0,
        "RANDOMIZE_DOWNLOAD_DELAY": True,
        "CONCURRENT_REQUESTS": 2,
    }

    def __init__(self, dry_run: str = "false", limit: str = "0", **kwargs):
        super().__init__(**kwargs)
        self.dry_run = dry_run.lower() == "true"
        self.limit = int(limit)
        self._count = 0
        self._politician_map: dict[str, str] = {}  # name -> politician_id

    def start_requests(self) -> Generator:
        # Load politicians from DB to match names
        from dotenv import load_dotenv
        load_dotenv()
        from supabase import create_client

        url = os.environ.get("SUPABASE_URL", "")
        key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
        if not url or not key:
            logger.error("Supabase credentials not configured")
            return

        sb = create_client(url, key)
        result = sb.table("politicians").select("id, name").execute()

        for politician in result.data or []:
            # Normalize name for matching: "MODI, NARENDRA" -> "narendra modi"
            name = politician["name"].strip().lower()
            self._politician_map[name] = politician["id"]
            # Also store reversed form (last, first -> first last)
            parts = [p.strip() for p in name.split(",")]
            if len(parts) == 2:
                self._politician_map[f"{parts[1]} {parts[0]}"] = politician["id"]

        logger.info(f"Loaded {len(result.data or [])} politicians for matching")

        # Step 1: Scrape RS Interest declarations
        yield scrapy.Request(
            RS_INTERESTS_URL,
            callback=self.parse_rs_interests_list,
        )

    def _match_politician(self, name: str) -> str | None:
        """Fuzzy match a name to our politician database."""
        normalized = name.strip().lower()
        normalized = re.sub(r"\s+", " ", normalized)
        # Strip common prefixes
        normalized = re.sub(
            r"^(shri|smt|dr|adv|prof|justice|sri|mr|mrs|ms)\.?\s+",
            "",
            normalized,
        )

        # Direct match
        if normalized in self._politician_map:
            return self._politician_map[normalized]

        # Try partial matching (last name, first name)
        for db_name, pid in self._politician_map.items():
            if normalized in db_name or db_name in normalized:
                return pid

        return None

    def parse_rs_interests_list(self, response: Response) -> Generator:
        """Parse the list of RS members with interest declarations."""
        # Find all member links
        for link in response.css("table a[href*='candidate.php']"):
            name = link.css("::text").get("").strip()
            href = link.attrib.get("href", "")

            if not name or not href:
                continue

            if self.limit and self._count >= self.limit:
                return

            url = urljoin(response.url, href)
            yield scrapy.Request(
                url,
                callback=self.parse_member_interests,
                meta={"member_name": name},
            )
            self._count += 1

    def parse_member_interests(self, response: Response) -> Generator:
        """Parse individual member's interest declaration page."""
        member_name = response.meta["member_name"]
        politician_id = self._match_politician(member_name)

        if not politician_id:
            logger.debug(f"No DB match for RS member: {member_name}")
            return

        # Look for tables with directorship/company data
        tables = response.css("table")
        for table in tables:
            table_text = table.css("::text").getall()
            header_text = " ".join(table_text[:20]).lower()

            # Look for directorship tables
            if any(
                kw in header_text
                for kw in [
                    "directorship",
                    "company",
                    "shareholding",
                    "remunerative",
                    "business",
                    "interest",
                ]
            ):
                for row in table.css("tr")[1:]:  # Skip header
                    cells = row.css("td::text, td *::text").getall()
                    cells = [c.strip() for c in cells if c.strip()]

                    if len(cells) < 2:
                        continue

                    # Try to extract company name and role
                    company_name = cells[0] if cells else None
                    role = cells[1] if len(cells) > 1 else "Director"

                    # Skip if it looks like a header or empty
                    if not company_name or company_name.lower() in (
                        "company name",
                        "name",
                        "sr no",
                        "sl no",
                        "s.no",
                    ):
                        continue

                    item = {
                        "item_type": "company_interest",
                        "politician_id": politician_id,
                        "politician_name": member_name,
                        "company_name": company_name,
                        "role": role,
                        "company_type": None,
                        "company_status": None,
                        "cin": None,
                        "mca_data_url": None,
                        "source_url": response.url,
                    }

                    if self.dry_run:
                        logger.info(
                            f"[DRY RUN] {member_name} → "
                            f"{company_name} ({role})"
                        )
                    else:
                        logger.info(
                            f"Found: {member_name} → "
                            f"{company_name} ({role})"
                        )

                    yield item
