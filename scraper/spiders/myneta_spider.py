"""
MyNeta Spider for NETAwatch Phase 1.

Scrapes myneta.info for all current Lok Sabha (2024) and Rajya Sabha MPs.
Extracts: name, party, constituency, state, house, assets, liabilities,
          criminal cases, profile photo.

Usage:
  scrapy crawl myneta                              # both houses
  scrapy crawl myneta -a house=lok_sabha           # Lok Sabha only
  scrapy crawl myneta -a house=rajya_sabha         # Rajya Sabha only
  scrapy crawl myneta -a house=lok_sabha -a dry_run=true  # dry run (no DB writes)
  scrapy crawl myneta -a limit=10                  # stop after 10 politicians (testing)

Rate limiting: 1.5s delay between requests (see settings.py).
Respects robots.txt. Rotates user agents.

If rate-limited by MyNeta:
  1. Increase DOWNLOAD_DELAY to 3 in settings.py
  2. Set HTTPCACHE_ENABLED=True in settings.py to cache responses
  3. Add proxy rotation: pip install scrapy-rotating-proxies
"""
import re
import logging
from typing import Any, Generator
from urllib.parse import urljoin

import scrapy
from scrapy.http import Response

from parsers.assets_parser import parse_assets_table, parse_amount
from parsers.cases_parser import parse_case_row, parse_ipc_sections

logger = logging.getLogger(__name__)

# MyNeta election URLs
ELECTION_URLS = {
    "lok_sabha": "https://www.myneta.info/LokSabha2024/",
    "rajya_sabha": "https://www.myneta.info/rajyasabha2024/",
}

DECLARATION_YEARS = {
    "lok_sabha": 2024,
    "rajya_sabha": 2024,
}


def slugify(text: str, suffix: str = "") -> str:
    """Convert name to URL slug."""
    base = (
        text.lower()
        .strip()
        .encode("ascii", "ignore")
        .decode("ascii")
        .replace("'", "")
        .replace(".", "")
    )
    base = re.sub(r"[^a-z0-9\s-]", "", base)
    base = re.sub(r"\s+", "-", base)
    base = re.sub(r"-+", "-", base).strip("-")

    if suffix:
        suf = re.sub(r"[^a-z0-9-]", "-", suffix.lower().strip())
        suf = re.sub(r"-+", "-", suf).strip("-")
        return f"{base}-{suf}"
    return base


class MyNetaSpider(scrapy.Spider):
    """Spider for scraping MyNeta.info politician profiles."""

    name = "myneta"
    allowed_domains = ["myneta.info", "www.myneta.info"]
    custom_settings = {
        "DOWNLOAD_DELAY": 1.5,
        "RANDOMIZE_DOWNLOAD_DELAY": True,
        "CONCURRENT_REQUESTS": 1,
    }

    def __init__(
        self,
        house: str = "both",
        dry_run: str = "false",
        limit: str = "0",
        **kwargs,
    ):
        super().__init__(**kwargs)
        self.target_house = house.lower()
        self.dry_run = dry_run.lower() == "true"
        self.limit = int(limit)
        self._count = 0
        self._seen_slugs: set[str] = set()

        if self.dry_run:
            logger.info("🔍 DRY RUN — data will be logged but not saved to DB")
        logger.info(f"Targeting: {self.target_house} | Limit: {self.limit or 'none'}")

    def start_requests(self):
        """Start from the election index pages."""
        if self.target_house in ("lok_sabha", "both"):
            yield scrapy.Request(
                ELECTION_URLS["lok_sabha"],
                callback=self.parse_index,
                meta={"house": "lok_sabha"},
                dont_filter=True,
            )

        if self.target_house in ("rajya_sabha", "both"):
            yield scrapy.Request(
                ELECTION_URLS["rajya_sabha"],
                callback=self.parse_index,
                meta={"house": "rajya_sabha"},
                dont_filter=True,
            )

    def parse_index(self, response: Response) -> Generator:
        """
        Parse the election index page.
        Finds all state/constituency links and follows them.
        """
        house = response.meta["house"]
        logger.info(f"Parsing index for {house}: {response.url}")

        # MyNeta index has table with state links
        # Try to find all candidate links directly or state sub-pages
        candidate_links = response.css("a[href*='candidate.php']::attr(href)").getall()

        if candidate_links:
            # Index page directly lists candidates
            for href in candidate_links:
                if self._at_limit():
                    return
                url = urljoin(response.url, href)
                yield scrapy.Request(
                    url,
                    callback=self.parse_candidate,
                    meta={"house": house, "source_url": url},
                )
        else:
            # Need to follow state links first
            state_links = response.css(
                "a[href*='state_id'], a[href*='show_winners'], a[href*='show_candidates']"
            ).css("::attr(href)").getall()

            # Also try table rows with state names
            if not state_links:
                state_links = response.css(
                    "table a[href*='index.php']::attr(href)"
                ).getall()

            logger.info(f"Found {len(state_links)} state links for {house}")

            for href in set(state_links):
                url = urljoin(response.url, href)
                yield scrapy.Request(
                    url,
                    callback=self.parse_state_page,
                    meta={"house": house},
                )

    def parse_state_page(self, response: Response) -> Generator:
        """Parse a state listing page and follow candidate links."""
        house = response.meta["house"]

        candidate_links = response.css("a[href*='candidate.php']::attr(href)").getall()
        logger.debug(f"State page {response.url}: found {len(candidate_links)} candidates")

        for href in candidate_links:
            if self._at_limit():
                return
            url = urljoin(response.url, href)
            yield scrapy.Request(
                url,
                callback=self.parse_candidate,
                meta={"house": house, "source_url": url},
            )

    def parse_candidate(self, response: Response) -> dict[str, Any] | None:
        """
        Parse a single candidate profile page on MyNeta.

        MyNeta candidate pages have:
        - Header with name, party, constituency
        - Assets table (movable + immovable)
        - Liabilities section
        - Criminal cases table
        - Personal details (DOB, education, PAN)
        """
        house = response.meta.get("house", "lok_sabha")
        source_url = response.meta.get("source_url", response.url)

        # --- Extract basic info ---
        name = self._extract_name(response)
        if not name:
            logger.warning(f"Could not extract name from {response.url}")
            return None

        party_name = self._extract_party(response)
        constituency = self._extract_constituency(response)
        state = self._extract_state(response)

        # Generate unique slug
        slug = self._unique_slug(name, constituency)

        # --- Extract assets ---
        assets = self._extract_assets(response)

        # --- Extract criminal cases ---
        criminal_cases = self._extract_criminal_cases(response)

        # --- Extract profile image ---
        profile_image_url = self._extract_profile_image(response)

        # --- Extract personal details ---
        personal = self._extract_personal_details(response)

        # Build item
        item = {
            "item_type": "politician",
            "name": name,
            "slug": slug,
            "party_name": party_name,
            "constituency": constituency,
            "state": state,
            "house": house,
            "is_active": True,
            "profile_image_url": profile_image_url,
            "assets": assets,
            "criminal_cases": criminal_cases,
            "declaration_year": DECLARATION_YEARS.get(house, 2024),
            "source_url": source_url,
            **personal,
        }

        self._count += 1
        if self._count % 50 == 0:
            logger.info(f"Progress: {self._count} politicians scraped")

        return item

    # --- Private extraction helpers ---

    def _extract_name(self, response: Response) -> str | None:
        """Extract politician name from page header."""
        # Try common MyNeta selectors
        selectors = [
            "h1.cand-name::text",
            "h2.cand-name::text",
            "div.cand-name h1::text",
            "div.cand-name h2::text",
            "#main-content h1::text",
            "h1::text",
            "title::text",
        ]
        for sel in selectors:
            name = response.css(sel).get()
            if name:
                name = name.strip()
                # Clean up title-style names
                name = re.sub(r"\s*-\s*myneta.*", "", name, flags=re.IGNORECASE)
                name = re.sub(r"\s*\|\s*.*", "", name)
                if name and len(name) > 2:
                    return name

        # Fallback: extract from URL (candidate_id not useful, try page content)
        # Look for name in breadcrumbs
        breadcrumb = response.css("div.breadcrumb a::text, nav a::text").getall()
        for crumb in reversed(breadcrumb):
            if len(crumb.strip()) > 3:
                return crumb.strip()

        return None

    def _extract_party(self, response: Response) -> str | None:
        """Extract party name."""
        selectors = [
            "span.party::text",
            "div.party::text",
            "td.party::text",
            "span[class*='party']::text",
        ]
        for sel in selectors:
            party = response.css(sel).get()
            if party and party.strip():
                return party.strip()

        # Look in table rows
        for row in response.css("table tr"):
            label = row.css("td:first-child::text").get("").lower()
            if "party" in label:
                value = row.css("td:last-child::text").get()
                if value:
                    return value.strip()

        return None

    def _extract_constituency(self, response: Response) -> str | None:
        """Extract constituency name."""
        selectors = [
            "span.constituency::text",
            "div.constituency::text",
        ]
        for sel in selectors:
            val = response.css(sel).get()
            if val:
                return val.strip()

        for row in response.css("table tr"):
            label = row.css("td:first-child::text").get("").lower()
            if "constituency" in label:
                value = row.css("td:last-child::text").get()
                if value:
                    return value.strip()

        return None

    def _extract_state(self, response: Response) -> str | None:
        """Extract state name."""
        for row in response.css("table tr"):
            label = row.css("td:first-child::text").get("").lower()
            if "state" in label:
                value = row.css("td:last-child::text").get()
                if value:
                    return value.strip()

        # Try from page title or breadcrumbs
        title = response.css("title::text").get("")
        state_match = re.search(r"from\s+([A-Z][a-zA-Z\s]+)", title)
        if state_match:
            return state_match.group(1).strip()

        return None

    def _extract_assets(self, response: Response) -> dict[str, Any]:
        """Extract assets table data."""
        rows = []

        # MyNeta assets are in a table — find by looking for "Movable Assets" header
        for table in response.css("table"):
            table_text = table.get().lower()
            if "movable" in table_text or "immovable" in table_text or "assets" in table_text:
                for tr in table.css("tr"):
                    cells = tr.css("td::text").getall()
                    if len(cells) >= 2:
                        label = cells[0].strip()
                        value = cells[-1].strip()
                        if label and value:
                            rows.append({"label": label, "value": value})

        if not rows:
            # Try alternate: look for Rs. values in any table
            for table in response.css("table"):
                for tr in table.css("tr"):
                    cells = tr.css("td")
                    if len(cells) >= 2:
                        label = cells[0].css("::text").get("").strip()
                        value_text = " ".join(cells[-1].css("::text").getall()).strip()
                        if "Rs" in value_text or "₹" in value_text:
                            rows.append({"label": label, "value": value_text})

        assets = parse_assets_table(rows)

        # Try to also extract summary figures directly
        # Some pages show "Total Assets: Rs. X" prominently
        full_text = " ".join(response.css("::text").getall())
        if "net_worth" not in assets or assets.get("net_worth") is None:
            net_worth_match = re.search(
                r"net\s*worth[:\s]*(?:Rs\.?\s*)?([\d,]+(?:\.\d+)?)",
                full_text,
                re.IGNORECASE,
            )
            if net_worth_match:
                assets["net_worth"] = parse_amount(net_worth_match.group(1))

        return assets

    def _extract_criminal_cases(self, response: Response) -> list[dict]:
        """Extract criminal cases from the page."""
        cases = []

        # Look for criminal cases section/table
        for table in response.css("table"):
            table_text = table.get().lower()
            if "criminal" in table_text or "case" in table_text or "ipc" in table_text:
                for tr in table.css("tr"):
                    cells = tr.css("td")
                    if len(cells) < 2:
                        continue

                    cell_texts = [c.css("::text").getall() for c in cells]
                    row_text = " ".join(
                        [" ".join(t) for t in cell_texts]
                    ).lower()

                    # Skip header rows
                    if any(h in row_text for h in ["section", "court", "case no", "status"]):
                        continue

                    # Build case row
                    raw_case: dict[str, Any] = {
                        "source_url": response.url,
                        "declaration_year": 2024,
                    }

                    # Try to identify columns by position or content
                    all_texts = [" ".join(c.css("::text").getall()).strip() for c in cells]

                    if len(all_texts) >= 1:
                        raw_case["ipc_sections_raw"] = all_texts[0]
                    if len(all_texts) >= 2:
                        raw_case["court_name"] = all_texts[1]
                    if len(all_texts) >= 3:
                        raw_case["case_description"] = all_texts[2]
                    if len(all_texts) >= 4:
                        raw_case["status"] = all_texts[3]

                    # Only include rows that have IPC sections
                    ipc = parse_ipc_sections(raw_case.get("ipc_sections_raw", ""))
                    if ipc:
                        parsed = parse_case_row(raw_case)
                        if parsed.get("ipc_sections"):
                            cases.append(parsed)

        return cases

    def _extract_profile_image(self, response: Response) -> str | None:
        """Extract candidate profile photo URL."""
        selectors = [
            "img.cand-photo::attr(src)",
            "img.candidate-photo::attr(src)",
            "div.cand-photo img::attr(src)",
            "div.candidate-image img::attr(src)",
            "#main-content img:first-of-type::attr(src)",
        ]
        for sel in selectors:
            src = response.css(sel).get()
            if src and not src.endswith("no-photo.jpg"):
                return urljoin(response.url, src)
        return None

    def _extract_personal_details(self, response: Response) -> dict[str, Any]:
        """Extract DOB, education, PAN (last 4 digits only)."""
        details: dict[str, Any] = {}

        for table in response.css("table"):
            for tr in table.css("tr"):
                cells = tr.css("td")
                if len(cells) < 2:
                    continue
                label = cells[0].css("::text").get("").lower().strip()
                value = " ".join(cells[-1].css("::text").getall()).strip()

                if "birth" in label or "age" in label:
                    # Try to parse date
                    date_match = re.search(r"(\d{2}[/-]\d{2}[/-]\d{4})", value)
                    if date_match:
                        raw = date_match.group(1).replace("/", "-")
                        parts = raw.split("-")
                        if len(parts) == 3 and len(parts[2]) == 4:
                            try:
                                details["date_of_birth"] = f"{parts[2]}-{parts[1]}-{parts[0]}"
                            except Exception:
                                pass

                elif "education" in label or "qualification" in label:
                    details["education"] = value

                elif "pan" in label:
                    # Store only last 4 characters of PAN
                    pan_clean = re.sub(r"\s+", "", value)
                    if len(pan_clean) >= 4:
                        details["pan_card_last4"] = pan_clean[-4:]

                elif "gender" in label or "sex" in label:
                    gender = value.lower()
                    if "male" in gender or "female" in gender:
                        details["gender"] = "male" if "male" in gender else "female"

        return details

    def _unique_slug(self, name: str, constituency: str | None) -> str:
        """Generate a unique slug, appending constituency if needed."""
        base = slugify(name)
        if base not in self._seen_slugs:
            self._seen_slugs.add(base)
            return base

        # Try with constituency
        if constituency:
            slug_with_const = slugify(name, constituency)
            if slug_with_const not in self._seen_slugs:
                self._seen_slugs.add(slug_with_const)
                return slug_with_const

        # Final fallback: append counter
        counter = 2
        while True:
            candidate = f"{base}-{counter}"
            if candidate not in self._seen_slugs:
                self._seen_slugs.add(candidate)
                return candidate
            counter += 1

    def _at_limit(self) -> bool:
        """Check if we've hit the --limit cap."""
        return self.limit > 0 and self._count >= self.limit
