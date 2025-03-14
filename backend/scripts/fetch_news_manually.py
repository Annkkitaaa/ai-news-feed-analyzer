# backend/scripts/fetch_news_manually.py
import asyncio
import sys
import os
import logging

# Add the parent directory to the path so we can import from app
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.db.session import SessionLocal
from app.services.aggregator import NewsAggregator
from app.services.analyzer import NewsAnalyzer

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

async def fetch_news_manually():
    """Manually fetch and process news from all sources."""
    logger.info("Starting manual news fetch...")
    db = SessionLocal()
    
    try:
        # Initialize aggregator
        aggregator = NewsAggregator(db)
        
        # Fetch news
        articles = await aggregator.fetch_all_sources()
        logger.info(f"Fetched {len(articles)} articles")
        
        # Save articles
        saved_articles = aggregator.save_articles(articles)
        logger.info(f"Saved {len(saved_articles)} new articles")
        
        # Process if there are any new articles
        if saved_articles:
            try:
                analyzer = NewsAnalyzer(db)
                news_ids = [str(article.id) for article in saved_articles]
                
                # Categorize news
                categories = analyzer.categorize_news(news_ids)
                logger.info(f"Categorized {len(categories)} articles")
                
                # Compute relevance
                relevance = analyzer.compute_interest_relevance(news_ids)
                logger.info(f"Computed relevance for {len(relevance)} articles")
                
                # Generate summaries
                for news_id in news_ids:
                    try:
                        analyzer.summarize_article(news_id)
                        logger.info(f"Generated summary for article {news_id}")
                    except Exception as e:
                        logger.error(f"Error generating summary for article {news_id}: {e}")
            except Exception as e:
                logger.error(f"Error during post-processing: {e}")
        
        logger.info("Manual news fetch completed successfully")
    except Exception as e:
        logger.error(f"Error during manual news fetch: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    # Create a new event loop for the async function
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    loop.run_until_complete(fetch_news_manually())
    loop.close()