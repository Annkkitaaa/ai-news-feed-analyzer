# backend/scripts/add_news_sources.py
import sys
import os

# Add the parent directory to the path so we can import from app
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.db.session import SessionLocal
from app.db.models import NewsSource
from app.core.config import settings

def add_initial_news_sources():
    """Add initial news sources to the database."""
    db = SessionLocal()
    
    try:
        # Check if we already have sources
        existing_count = db.query(NewsSource).count()
        if existing_count > 0:
            print(f"Already have {existing_count} news sources in the database.")
            return
        
        # List of news sources to add
        sources = [
            # RSS feeds
            {
                "name": "CNN Top Stories",
                "url": "http://rss.cnn.com/rss/cnn_topstories.rss",
                "source_type": "rss",
                "config": {}
            },
            {
                "name": "BBC World",
                "url": "http://feeds.bbci.co.uk/news/world/rss.xml",
                "source_type": "rss",
                "config": {}
            },
            {
                "name": "New York Times Technology",
                "url": "https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml",
                "source_type": "rss",
                "config": {}
            },
            {
                "name": "Hacker News",
                "url": "https://news.ycombinator.com/rss",
                "source_type": "rss",
                "config": {}
            },
            
            # NewsAPI sources
            {
                "name": "NewsAPI - Technology",
                "url": "https://newsapi.org/v2/top-headlines",
                "source_type": "api",
                "config": {
                    "params": {
                        "category": "technology",
                        "country": "us"
                    }
                }
            },
            {
                "name": "NewsAPI - Business",
                "url": "https://newsapi.org/v2/top-headlines",
                "source_type": "api",
                "config": {
                    "params": {
                        "category": "business",
                        "country": "us"
                    }
                }
            }
        ]
        
        # Add RSS sources from settings if configured
        if settings.RSS_SOURCES:
            for i, rss_url in enumerate(settings.RSS_SOURCES):
                # Skip if already in our list
                if any(s["url"] == rss_url for s in sources):
                    continue
                    
                domain = rss_url.split("/")[2] if len(rss_url.split("/")) > 2 else "unknown"
                sources.append({
                    "name": f"RSS - {domain}",
                    "url": rss_url,
                    "source_type": "rss",
                    "config": {}
                })
        
        # Add to database
        for source_data in sources:
            source = NewsSource(**source_data)
            db.add(source)
        
        db.commit()
        print(f"Added {len(sources)} news sources to the database.")
    except Exception as e:
        db.rollback()
        print(f"Error adding news sources: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    add_initial_news_sources()