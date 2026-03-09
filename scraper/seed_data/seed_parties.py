"""
Seed parties.json into Supabase.
Run: python seed_data/seed_parties.py
"""
import json
import os
import sys
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / ".env")

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("ERROR: Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env")
    sys.exit(1)

from supabase import create_client

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

parties_file = Path(__file__).parent / "parties.json"
with open(parties_file) as f:
    parties = json.load(f)

result = supabase.table("parties").upsert(parties, on_conflict="abbreviation").execute()
print(f"✅ Seeded {len(result.data)} parties into Supabase")
