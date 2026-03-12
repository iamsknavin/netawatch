"""
MPLAD Fund Usage Spider.
Scrapes MPLADS eSAKSHI dashboard for MP-wise fund allocation and utilization.

Sources:
  - Primary: mplads.mospi.gov.in (eSAKSHI portal, 2023-24 onwards)
  - Fallback: mplads.gov.in MP-wise reports page
  - Alternative: data.gov.in CSV dataset (12th-16th Lok Sabha historical)

Note: The old mplads.gov.in/MPLADS/SearchConstituencyMP.do endpoint is dead.
      eSAKSHI (launched April 2023) replaced the old system.

Usage:
  scrapy crawl mplad                      # all Lok Sabha MPs
  scrapy crawl mplad -a limit=10          # test with 10
  scrapy crawl mplad -a dry_run=true      # preview only
"""
import logging
import os
import re
from typing import Any, Generator

import scrapy
from scrapy.http import Response

logger = logging.getLogger(__name__)

# eSAKSHI dashboard (new system since April 2023)
ESAKSHI_BASE = "https://mplads.mospi.gov.in"
ESAKSHI_DASHBOARD = f"{ESAKSHI_BASE}/digigov/dashboard.html"

# Old portal reports page (fallback)
MPLAD_OLD_REPORTS = "https://www.mplads.gov.in/mplads/AuthenticatedPages/Reports/Citizen/rptDetailsSummary.aspx"


class MpladSpider(scrapy.Spider):
    """Scrapes MPLADS portals for fund utilization data."""

    name = "mplad"
    allowed_domains = [
        "mplads.gov.in",
        "www.mplads.gov.in",
        "mplads.mospi.gov.in",
    ]
    custom_settings = {
        "DOWNLOAD_DELAY": 3.0,
        "RANDOMIZE_DOWNLOAD_DELAY": True,
        "CONCURRENT_REQUESTS": 1,
        "ROBOTSTXT_OBEY": True,
    }

    def __init__(self, dry_run: str = "false", limit: str = "0", **kwargs):
        super().__init__(**kwargs)
        self.dry_run = dry_run.lower() == "true"
        self.limit = int(limit)
        self._count = 0
        self._politician_map: dict[str, str] = {}  # constituency(lower) → politician_id

    def start_requests(self) -> Generator:
        from dotenv import load_dotenv
        load_dotenv()
        from supabase import create_client

        url = os.environ.get("SUPABASE_URL", "")
        key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
        if not url or not key:
            logger.error("Supabase credentials not configured")
            return

        sb = create_client(url, key)
        result = sb.table("politicians").select(
            "id, name, constituency, state"
        ).eq("house", "lok_sabha").eq("is_active", True).execute()

        politicians = result.data or []
        if not politicians:
            logger.warning("No active Lok Sabha MPs in DB")
            return

        # Build constituency → politician_id map for matching
        for mp in politicians:
            c = (mp.get("constituency") or "").strip().lower()
            if c:
                self._politician_map[c] = mp["id"]

        logger.info(f"Loaded {len(politicians)} Lok Sabha MPs for MPLAD matching")

        # Try eSAKSHI dashboard first
        yield scrapy.Request(
            ESAKSHI_DASHBOARD,
            callback=self.parse_esakshi_dashboard,
            errback=self.handle_esakshi_error,
        )

    def handle_esakshi_error(self, failure):
        """If eSAKSHI fails, fall back to old portal."""
        logger.warning(f"eSAKSHI dashboard unreachable: {failure.value}")
        logger.info("Trying old MPLADS reports page as fallback...")
        yield scrapy.Request(
            MPLAD_OLD_REPORTS,
            callback=self.parse_old_reports,
        )

    def parse_esakshi_dashboard(self, response: Response) -> Generator:
        """Parse the eSAKSHI dashboard page for fund data or API endpoints."""
        # eSAKSHI is a JS-heavy React/Angular app — check if any data is
        # embedded in the initial HTML or if we can find API endpoints
        body = response.text

        # Look for embedded JSON data or API URLs
        api_urls = re.findall(r'(https?://[^"\']+/api/[^"\']+)', body)
        if api_urls:
            for api_url in api_urls[:5]:
                logger.info(f"Found eSAKSHI API endpoint: {api_url}")
                yield scrapy.Request(
                    api_url,
                    callback=self.parse_esakshi_api,
                )
            return

        # Check for any HTML tables with fund data
        tables = response.css("table")
        if tables:
            yield from self._parse_fund_tables(response, tables)
            return

        logger.warning(
            "eSAKSHI dashboard is JS-rendered with no embedded data. "
            "Consider using Playwright for JS execution, or download "
            "MPLAD CSV from data.gov.in manually and import via: "
            "scrapy crawl mplad -a csv_path=/path/to/mplad_data.csv"
        )
        # Fall back to old portal
        yield scrapy.Request(
            MPLAD_OLD_REPORTS,
            callback=self.parse_old_reports,
        )

    def parse_esakshi_api(self, response: Response) -> Generator:
        """Parse eSAKSHI API JSON response."""
        import json
        try:
            data = json.loads(response.text)
        except (json.JSONDecodeError, ValueError):
            logger.warning(f"Failed to parse eSAKSHI API response: {response.url}")
            return

        # Try to extract fund data from API response
        records = data if isinstance(data, list) else data.get("data", data.get("records", []))
        if not isinstance(records, list):
            return

        for record in records:
            constituency = (record.get("constituency", "") or "").strip().lower()
            politician_id = self._politician_map.get(constituency)
            if not politician_id:
                continue

            item = {
                "item_type": "fund_usage",
                "politician_id": politician_id,
                "fund_type": "mplad",
                "financial_year": record.get("financial_year") or record.get("fy"),
                "total_allocated": self._safe_float(record.get("entitled") or record.get("allocated")),
                "total_released": self._safe_float(record.get("released")),
                "total_utilized": self._safe_float(record.get("utilized") or record.get("expenditure")),
                "source_url": response.url,
            }

            # Calculate utilization percent
            if item["total_allocated"] and item["total_utilized"]:
                item["utilization_percent"] = round(
                    item["total_utilized"] / item["total_allocated"] * 100, 1
                )

            if item.get("financial_year"):
                if self.dry_run:
                    logger.info(f"[DRY RUN] {constituency} | FY {item['financial_year']}")
                yield item

    def parse_old_reports(self, response: Response) -> Generator:
        """Parse the old mplads.gov.in reports page."""
        tables = response.css("table")
        if tables:
            yield from self._parse_fund_tables(response, tables)
        else:
            logger.warning("Old MPLADS reports page returned no tables. Portal may be down.")

    def _parse_fund_tables(self, response: Response, tables) -> Generator:
        """Parse HTML tables with fund allocation/utilization data."""
        for table in tables:
            rows = table.css("tr")
            if len(rows) < 2:
                continue

            header_text = " ".join(rows[0].css("::text").getall()).lower()
            if not any(kw in header_text for kw in [
                "allocated", "released", "utilised", "utiliz",
                "entitled", "sanctioned", "expenditure",
            ]):
                continue

            for tr in rows[1:]:
                cells = tr.css("td")
                all_texts = [" ".join(c.css("::text").getall()).strip() for c in cells]

                if len(all_texts) < 3:
                    continue

                fund_data = self._extract_fund_row(all_texts, header_text)
                if not fund_data:
                    continue

                # Try to match constituency from row text
                constituency = None
                for text in all_texts:
                    c = text.strip().lower()
                    if c in self._politician_map:
                        constituency = c
                        break

                politician_id = self._politician_map.get(constituency) if constituency else None
                if not politician_id:
                    continue

                item = {
                    "item_type": "fund_usage",
                    "politician_id": politician_id,
                    "fund_type": "mplad",
                    "source_url": response.url,
                    **fund_data,
                }

                if self.dry_run:
                    logger.info(
                        f"[DRY RUN] {constituency} | "
                        f"FY {fund_data.get('financial_year')} | "
                        f"Utilization: {fund_data.get('utilization_percent', 'N/A')}%"
                    )

                yield item

    def _extract_fund_row(self, texts: list[str], header: str) -> dict[str, Any] | None:
        """Extract fund data from a table row."""
        result: dict[str, Any] = {}

        # Try to detect financial year (e.g., "2023-24", "2024-25")
        for text in texts:
            fy_match = re.search(r"(\d{4})\s*[-–]\s*(\d{2,4})", text)
            if fy_match:
                result["financial_year"] = f"{fy_match.group(1)}-{fy_match.group(2)[-2:]}"
                break

        if not result.get("financial_year"):
            return None

        # Parse amounts from remaining cells
        amounts = []
        for text in texts:
            amount = self._parse_amount(text)
            if amount is not None:
                amounts.append(amount)

        if len(amounts) >= 3:
            result["total_allocated"] = amounts[0]
            result["total_released"] = amounts[1]
            result["total_utilized"] = amounts[2]
            if amounts[0] > 0:
                result["utilization_percent"] = round(amounts[2] / amounts[0] * 100, 1)
        elif len(amounts) >= 2:
            result["total_released"] = amounts[0]
            result["total_utilized"] = amounts[1]

        return result if amounts else None

    @staticmethod
    def _parse_amount(text: str) -> float | None:
        """Parse Indian currency amount from text."""
        nums = re.sub(r"[^\d.]", "", text.replace(",", ""))
        try:
            return float(nums) if nums else None
        except ValueError:
            return None

    @staticmethod
    def _safe_float(value) -> float | None:
        """Safely convert a value to float."""
        if value is None:
            return None
        try:
            return float(value)
        except (ValueError, TypeError):
            return None
