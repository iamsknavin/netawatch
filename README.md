# NETAwatch

**Indian politician transparency platform.** Every rupee. Every case. Every vote. Public record.

Track Lok Sabha and Rajya Sabha MP wealth declarations, criminal cases, and parliamentary performance — all sourced from mandatory public disclosures.

[![MIT License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Open Source](https://img.shields.io/badge/open-source-blue.svg)](https://github.com/netawatch/netawatch)

---

## What it does

- **Assets & Wealth** — Net worth, movable and immovable assets from ECI affidavits
- **Criminal Cases** — Self-declared cases with IPC sections, court names, and status
- **Party Analysis** — Aggregate stats per party: wealth, cases, seat count
- **Search** — Fast full-text search via Meilisearch (name, party, constituency)
- **State Filter** — Click-through India map to filter by state

## Tech Stack

| Layer | Tool |
|-------|------|
| Frontend | Next.js 14 App Router + TypeScript + Tailwind |
| Database | Supabase (PostgreSQL) |
| Search | Meilisearch |
| Scraper | Python + Scrapy |
| Hosting | Vercel (frontend) + Supabase (DB) |

## Phases

| Phase | Status | Scope |
|-------|--------|-------|
| **1** | ✅ Current | Lok Sabha + Rajya Sabha MPs, assets, criminal cases |
| **2** | Planned | State MLAs, company interests, tender tracking, corruption signals |
| **3** | Planned | MPLAD funds, eCourts live, controversy tracker, public API |

---

## Running Locally

### Prerequisites

- [Node.js 18+](https://nodejs.org)
- [Python 3.11+](https://python.org)
- [Supabase account](https://supabase.com) (free)
- [Meilisearch](https://meilisearch.com) (local via Docker or Cloud free tier)

### 1. Clone and install

```bash
git clone https://github.com/netawatch/netawatch.git
cd netawatch
npm install
```

### 2. Set up environment

```bash
cp .env.example .env.local
# Edit .env.local with your Supabase URL, anon key, service role key, and Meilisearch keys
```

Get your keys from:
- [Supabase Dashboard](https://app.supabase.com) → Project Settings → API
- Meilisearch: `docker run -d -p 7700:7700 getmeili/meilisearch:latest` (no key needed locally)

### 3. Start Meilisearch (local dev)

```bash
docker run -d -p 7700:7700 getmeili/meilisearch:latest
```

### 4. Run the dev server

```bash
npm run dev
# Open http://localhost:3000
```

---

## Running the Scraper

```bash
cd scraper
python -m venv venv
source venv/bin/activate    # Linux/Mac
# OR: venv\Scripts\activate  # Windows

pip install -r requirements.txt
cp .env.example .env
# Edit .env with SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
```

### Dry run (no DB writes — test first):
```bash
scrapy crawl myneta -a dry_run=true
scrapy crawl myneta -a house=lok_sabha -a limit=10 -a dry_run=true
```

### Live run:
```bash
scrapy crawl myneta -a house=lok_sabha      # Lok Sabha only
scrapy crawl myneta -a house=rajya_sabha    # Rajya Sabha only
scrapy crawl myneta                          # Both houses (~790 MPs)
```

### Sync to Meilisearch (after scraping):
```bash
curl -X POST http://localhost:3000/api/sync-search \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

### If MyNeta rate-limits:
1. Set `DOWNLOAD_DELAY = 3` in `scraper/settings.py`
2. Enable HTTP cache: `HTTPCACHE_ENABLED = True` in settings.py
3. Add proxy rotation: `pip install scrapy-rotating-proxies` + uncomment in settings.py

---

## Data Sources

| Source | URL | Data |
|--------|-----|------|
| MyNeta / ADR | myneta.info | Affidavit summaries, criminal cases |
| Election Commission | affidavit.eci.gov.in | Official ECI PDFs |
| PRS India | prsindia.org | Parliamentary attendance (Phase 2) |
| Sansad.in | sansad.in | Official Lok Sabha data (Phase 2) |
| MCA21 | mca.gov.in | Company directorships (Phase 2) |
| GeM Portal | gem.gov.in | Government tenders (Phase 2) |

---

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=        # Your Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # Supabase anon key (safe for browser)
SUPABASE_SERVICE_ROLE_KEY=       # Service role key (server only, never commit)
NEXT_PUBLIC_MEILISEARCH_HOST=    # Meilisearch URL
NEXT_PUBLIC_MEILISEARCH_SEARCH_KEY=  # Search-only key (safe for browser)
MEILISEARCH_ADMIN_KEY=           # Admin key (server only)
```

---

## Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -m "Add my feature"`
4. Push: `git push origin feature/my-feature`
5. Open a Pull Request

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## Disclaimer

All data on NETAwatch is sourced from mandatory public disclosures made by politicians themselves. NETAwatch does not make allegations — we present public records. NETAwatch is not affiliated with the Government of India or the Election Commission of India.

---

## License

[MIT](LICENSE)
