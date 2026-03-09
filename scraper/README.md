# NETAwatch Scraper

Python scraper for collecting Indian politician data from public sources.

## Setup

```bash
cd scraper
python -m venv venv
source venv/bin/activate      # Linux/Mac
venv\Scripts\activate         # Windows

pip install -r requirements.txt

cp .env.example .env
# Edit .env and add your Supabase service role key
```

## Running the MyNeta Spider

### Dry run (no DB writes — use this to test):
```bash
scrapy crawl myneta -a dry_run=true
scrapy crawl myneta -a house=lok_sabha -a dry_run=true
scrapy crawl myneta -a house=lok_sabha -a limit=10 -a dry_run=true
```

### Live run (writes to Supabase):
```bash
scrapy crawl myneta -a house=lok_sabha      # Lok Sabha only
scrapy crawl myneta -a house=rajya_sabha    # Rajya Sabha only
scrapy crawl myneta                          # Both houses
```

## Rate Limiting

The spider respects robots.txt and waits 1.5s between requests.

**If MyNeta rate-limits you:**
1. Increase `DOWNLOAD_DELAY = 3` in `settings.py`
2. Enable HTTP cache: `HTTPCACHE_ENABLED = True` in settings.py
3. Add proxy rotation:
   ```bash
   pip install scrapy-rotating-proxies
   ```
   Then uncomment the proxy middleware in `settings.py`.

## Seed Data

Load the pre-packaged party data:
```bash
python seed_data/seed_parties.py
```

## Phase 2 Features (stubs ready)

- `spiders/eci_affidavit.py` — ECI PDF downloading + Tesseract OCR
- `spiders/prs_attendance.py` — PRS India attendance data
- `spiders/sansad_spider.py` — Official Sansad.in data
- `celery_app.py` + `tasks.py` — Scheduled scraping via Celery + Redis

## Data Sources

| Spider | Source | Status |
|--------|--------|--------|
| myneta | myneta.info | ✅ Phase 1 |
| eci_affidavit | affidavit.eci.gov.in | Phase 2 |
| prs_attendance | prsindia.org | Phase 2 |
| sansad | sansad.in | Phase 2 |
