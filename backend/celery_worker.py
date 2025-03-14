import os
from celery import Celery
from celery.schedules import crontab

from app.core.config import settings

celery_app = Celery("news_feed_analyzer")
celery_app.conf.broker_url = settings.CELERY_BROKER_URL
celery_app.conf.result_backend = settings.CELERY_RESULT_BACKEND
celery_app.conf.task_serializer = "json"
celery_app.conf.result_serializer = "json"
celery_app.conf.accept_content = ["json"]
celery_app.conf.timezone = "UTC"

# Load task modules from all registered app configs
celery_app.autodiscover_tasks(["app.tasks"])

# Configure periodic tasks
celery_app.conf.beat_schedule = {
    # Fetch news every hour (or as defined in settings)
    "fetch-news-periodically": {
        "task": "app.tasks.fetch_news.fetch_all_news_sources",
        "schedule": 60 * settings.NEWS_UPDATE_INTERVAL_MINUTES,
    },
    # Send daily digest at 8 AM UTC
    "send-daily-digests": {
        "task": "app.tasks.send_emails.send_daily_digests",
        "schedule": crontab(hour=8, minute=0),
    },
    # Send weekly digest on Mondays at 8 AM UTC
    "send-weekly-digests": {
        "task": "app.tasks.send_emails.send_weekly_digests",
        "schedule": crontab(hour=8, minute=0, day_of_week=1),
    },
    # Clean old news entries (keep last 30 days)
    "clean-old-news": {
        "task": "app.tasks.fetch_news.clean_old_news",
        "schedule": crontab(hour=3, minute=0),  # Run at 3 AM UTC
    },
}

if __name__ == "__main__":
    celery_app.start()