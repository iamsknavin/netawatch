"""
Supabase write pipeline for NETAwatch scraper.
Handles upserts for politicians, assets, and criminal cases.
Respects DRY_RUN mode — logs but does not write.
"""
import logging
import os
from typing import Any

logger = logging.getLogger(__name__)


class SupabasePipeline:
    """Write scraped politician data to Supabase."""

    def __init__(self, supabase_url: str, service_key: str, dry_run: bool):
        self.supabase_url = supabase_url
        self.service_key = service_key
        self.dry_run = dry_run
        self.supabase = None
        self._party_cache: dict[str, str] = {}  # name → uuid
        self.stats = {"politicians": 0, "assets": 0, "cases": 0, "errors": 0}

    @classmethod
    def from_crawler(cls, crawler):
        return cls(
            supabase_url=crawler.settings.get("SUPABASE_URL", ""),
            service_key=crawler.settings.get("SUPABASE_SERVICE_ROLE_KEY", ""),
            dry_run=crawler.settings.getbool("DRY_RUN", False),
        )

    def open_spider(self, spider):
        if self.dry_run:
            logger.info("🔍 DRY RUN MODE — no data will be written to Supabase")
            return

        if not self.supabase_url or not self.service_key:
            raise ValueError(
                "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set. "
                "Copy .env.example to .env and fill in your credentials."
            )

        from supabase import create_client
        self.supabase = create_client(self.supabase_url, self.service_key)
        logger.info("✅ Connected to Supabase")

        # Pre-load party cache
        result = self.supabase.table("parties").select("id, name, abbreviation").execute()
        for party in result.data or []:
            if party.get("abbreviation"):
                self._party_cache[party["abbreviation"].upper()] = party["id"]
            self._party_cache[party["name"].lower()] = party["id"]

    def close_spider(self, spider):
        logger.info(
            f"📊 Pipeline stats: {self.stats['politicians']} politicians, "
            f"{self.stats['assets']} asset records, "
            f"{self.stats['cases']} criminal cases, "
            f"{self.stats['errors']} errors"
        )

    def process_item(self, item: dict[str, Any], spider) -> dict[str, Any]:
        """Route item to correct handler based on item_type."""
        item_type = item.get("item_type")

        if item_type == "politician":
            self._process_politician(item, spider)
        else:
            logger.warning(f"Unknown item_type: {item_type}")

        return item

    def _resolve_party_id(self, party_name: str | None) -> str | None:
        """Look up party UUID from cache. Falls back to DB query."""
        if not party_name:
            return self._party_cache.get("IND")

        # Try abbreviation first (uppercase)
        key_upper = party_name.upper().strip()
        if key_upper in self._party_cache:
            return self._party_cache[key_upper]

        # Try full name (lowercase)
        key_lower = party_name.lower().strip()
        if key_lower in self._party_cache:
            return self._party_cache[key_lower]

        # Try partial match
        for cached_name, party_id in self._party_cache.items():
            if key_lower in cached_name or cached_name in key_lower:
                return party_id

        # Party not found — use Independent
        logger.debug(f"Party not found in cache: '{party_name}', using Independent")
        return self._party_cache.get("IND")

    def _process_politician(self, item: dict[str, Any], spider):
        """Upsert politician + assets + criminal cases."""
        name = item.get("name", "")
        slug = item.get("slug", "")

        if not name or not slug:
            logger.warning("Skipping item with missing name/slug")
            self.stats["errors"] += 1
            return

        party_id = self._resolve_party_id(item.get("party_name"))

        politician_data = {
            "name": name,
            "name_hindi": item.get("name_hindi"),
            "slug": slug,
            "profile_image_url": item.get("profile_image_url"),
            "date_of_birth": item.get("date_of_birth"),
            "gender": item.get("gender"),
            "education": item.get("education"),
            "party_id": party_id,
            "constituency": item.get("constituency"),
            "state": item.get("state"),
            "house": item.get("house"),
            "is_active": item.get("is_active", True),
            "election_status": item.get("election_status", "candidate"),
            "pan_card_last4": item.get("pan_card_last4"),
            "official_website": item.get("official_website"),
        }

        if self.dry_run:
            logger.info(
                f"[DRY RUN] Would upsert politician: {name} | "
                f"Party: {item.get('party_name')} | "
                f"Constituency: {item.get('constituency')} | "
                f"Net Worth: {item.get('net_worth')} | "
                f"Cases: {len(item.get('criminal_cases', []))}"
            )
            return

        try:
            # Upsert politician (slug is unique key)
            result = (
                self.supabase.table("politicians")
                .upsert(politician_data, on_conflict="slug")
                .execute()
            )
            politician_id = result.data[0]["id"]
            self.stats["politicians"] += 1

            # Upsert assets declaration
            assets = item.get("assets", {})
            if assets:
                assets_data = {
                    "politician_id": politician_id,
                    "declaration_year": item.get("declaration_year", 2024),
                    "source_url": item.get("source_url"),
                    "source_type": "myneta",
                    **assets,
                }
                self.supabase.table("assets_declarations").upsert(
                    assets_data,
                    on_conflict="politician_id,declaration_year",
                ).execute()
                self.stats["assets"] += 1

            # Upsert criminal cases
            for case in item.get("criminal_cases", []):
                case_data = {
                    "politician_id": politician_id,
                    "source_url": item.get("source_url"),
                    "declaration_year": item.get("declaration_year", 2024),
                    **case,
                }
                self.supabase.table("criminal_cases").insert(case_data).execute()
                self.stats["cases"] += 1

            logger.info(
                f"✅ {name} | {item.get('party_name')} | "
                f"Net worth: {assets.get('net_worth', 'N/A')} | "
                f"Cases: {len(item.get('criminal_cases', []))}"
            )

        except Exception as e:
            logger.error(f"❌ Failed to save {name}: {e}")
            self.stats["errors"] += 1
