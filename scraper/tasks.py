"""
Celery task definitions — Phase 2 stub.
"""

# Phase 2: Uncomment after setting up celery_app.py
#
# from celery_app import app
# from scrapy.crawler import CrawlerProcess
# from scrapy.utils.project import get_project_settings
#
# @app.task
# def run_myneta_scraper(house: str = "both"):
#     """Scheduled task: Run MyNeta spider."""
#     settings = get_project_settings()
#     process = CrawlerProcess(settings)
#     process.crawl("myneta", house=house)
#     process.start()
#
# @app.task
# def sync_search_index():
#     """Scheduled task: Sync politicians to Meilisearch."""
#     import requests, os
#     requests.post(
#         f"{os.getenv('NEXT_PUBLIC_URL')}/api/sync-search",
#         headers={"Authorization": f"Bearer {os.getenv('SUPABASE_SERVICE_ROLE_KEY')}"},
#     )
