import asyncio
import logging
from datetime import datetime
from typing import List, Dict, Any

from sqlalchemy.orm import Session
from celery import shared_task
from app.db.session import SessionLocal
from app.services.aggregator import NewsAggregator
from app.services.analyzer import NewsAnalyzer

# Set up logging
logger = logging.getLogger(__name__)

@shared_task
def fetch_all_news_sources() -> Dict[str, Any]:
    """Celery task to fetch news from all sources."""
    logger.info(f"Starting news fetch task at {datetime.utcnow()}")
    db = SessionLocal()
    
    try:
        # Initialize aggregator
        aggregator = NewsAggregator(db)
        
        # Run the async fetch in a new event loop
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        articles = loop.run_until_complete(aggregator.fetch_all_sources())
        loop.close()
        
        # Save articles to database
        saved_articles = aggregator.save_articles(articles)
        
        # Process newly saved articles
        if saved_articles:
            news_ids = [str(article.id) for article in saved_articles]
            
            # Initialize analyzer
            analyzer = NewsAnalyzer(db)
            
            # Categorize news
            categories = analyzer.categorize_news(news_ids)
            
            # Compute relevance to interests
            relevance = analyzer.compute_interest_relevance(news_ids)
            
            # Generate summaries for articles
            for news_id in news_ids:
                try:
                    analyzer.summarize_article(news_id)
                except Exception as e:
                    logger.error(f"Error summarizing article {news_id}: {e}")
            
            logger.info(f"Processed {len(saved_articles)} new articles")
            return {
                "status": "success",
                "articles_fetched": len(articles),
                "articles_saved": len(saved_articles),
                "categories_assigned": len(categories),
                "timestamp": datetime.utcnow().isoformat()
            }
        else:
            logger.info("No new articles to process")
            return {
                "status": "success",
                "articles_fetched": len(articles),
                "articles_saved": 0,
                "timestamp": datetime.utcnow().isoformat()
            }
    except Exception as e:
        logger.error(f"Error in fetch_all_news_sources task: {e}")
        return {
            "status": "error",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }
    finally:
        db.close()

@shared_task
def fetch_specific_source(source_id: str) -> Dict[str, Any]:
    """Celery task to fetch news from a specific source."""
    logger.info(f"Starting fetch for source {source_id} at {datetime.utcnow()}")
    db = SessionLocal()
    
    try:
        # TODO: Implement specific source fetching
        return {
            "status": "success",
            "source_id": source_id,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Error in fetch_specific_source task: {e}")
        return {
            "status": "error",
            "source_id": source_id,
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }
    finally:
        db.close()

@shared_task
def clean_old_news(days: int = 30) -> Dict[str, Any]:
    """Celery task to clean up old news articles."""
    logger.info(f"Starting cleanup of old news at {datetime.utcnow()}")
    db = SessionLocal()
    
    try:
        aggregator = NewsAggregator(db)
        deleted_count = aggregator.clean_old_news(days)
        
        logger.info(f"Deleted {deleted_count} old articles")
        return {
            "status": "success",
            "deleted_count": deleted_count,
            "days_threshold": days,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Error in clean_old_news task: {e}")
        return {
            "status": "error",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }
    finally:
        db.close()