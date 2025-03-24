from sqlalchemy.orm import Session
from app.db.models import Category, News
import logging

logger = logging.getLogger(__name__)

def seed_categories(db: Session):
    """Seed categories if they don't exist."""
    try:
        # Check if we have categories
        categories = db.query(Category).all()
        if categories:
            logger.info(f"Found {len(categories)} categories, skipping category seeding")
            return categories
            
        logger.info("Creating categories...")
        # Create sample categories
        categories = [
            Category(name="Technology", description="Tech news and updates"),
            Category(name="Business", description="Business and economy news"),
            Category(name="Health", description="Health and wellness information"),
            Category(name="Politics", description="Political news and developments"),
            Category(name="Science", description="Scientific discoveries and research")
        ]
        
        for category in categories:
            db.add(category)
        db.commit()
        logger.info("Created categories successfully")
        return categories
    except Exception as e:
        logger.error(f"Error in seed_categories: {e}")
        db.rollback()
        return []

def associate_articles_with_categories(db: Session):
    """Associate uncategorized articles with categories."""
    try:
        # Get articles without categories
        news_without_categories = db.query(News).filter(~News.categories.any()).all()
        
        if not news_without_categories:
            logger.info("No uncategorized articles found")
            return
            
        logger.info(f"Associating {len(news_without_categories)} articles with categories...")
        
        categories = db.query(Category).all()
        if not categories:
            categories = seed_categories(db)
            if not categories:
                logger.warning("No categories found or created, cannot associate articles")
                return
                
        # Associate each article with at least one category
        for i, article in enumerate(news_without_categories):
            # Assign different categories based on index
            category_index = i % len(categories)
            article.categories.append(categories[category_index])
            
            # Add a second category to some articles
            if i % 3 == 0 and len(categories) > 1:
                second_category_index = (category_index + 1) % len(categories)
                article.categories.append(categories[second_category_index])
        
        db.commit()
        logger.info("Associated articles with categories successfully")
    except Exception as e:
        logger.error(f"Error in associate_articles_with_categories: {e}")
        db.rollback()

def run_all_seeders(db: Session):
    """Run all seeder functions."""
    seed_categories(db)
    associate_articles_with_categories(db)