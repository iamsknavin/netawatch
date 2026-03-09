"""
Celery app configuration — Phase 2 stub.
Background job scheduling for automated scraping runs.

To activate in Phase 2:
1. pip install celery redis
2. Start Redis: docker run -d -p 6379:6379 redis:alpine
3. Uncomment the code below
4. Run worker: celery -A celery_app worker --loglevel=info
5. Run beat scheduler: celery -A celery_app beat --loglevel=info
"""

# Phase 2: Uncomment to enable scheduled scraping
#
# from celery import Celery
# from celery.schedules import crontab
#
# app = Celery(
#     "netawatch",
#     broker="redis://localhost:6379/0",
#     backend="redis://localhost:6379/1",
# )
#
# app.conf.beat_schedule = {
#     "scrape-myneta-weekly": {
#         "task": "tasks.run_myneta_scraper",
#         "schedule": crontab(hour=2, minute=0, day_of_week="sunday"),
#     },
#     "sync-meilisearch-daily": {
#         "task": "tasks.sync_search_index",
#         "schedule": crontab(hour=3, minute=0),
#     },
# }
# app.conf.timezone = "Asia/Kolkata"

print(
    "Celery is a Phase 2 feature. "
    "See README.md for Phase 2 setup instructions."
)
