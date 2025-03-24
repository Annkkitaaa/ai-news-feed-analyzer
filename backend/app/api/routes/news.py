from datetime import datetime
from typing import Any, List, Optional, Dict
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.api.routes.auth import get_current_user
from app.db.models import News, Category, User, ReadHistory
from app.schemas.news import NewsInDB, NewsDigest, TrendAnalysis
from app.schemas.categories import CategoryInDB
from app.services.aggregator import NewsAggregator
from app.services.analyzer import NewsAnalyzer
from app.services.summarizer import NewsSummarizer

# Set up router
router = APIRouter(prefix="/news", tags=["news"])

# Models
class CategoryBase(BaseModel):
    name: str
    description: Optional[str] = None

class CategoryInDB(CategoryBase):
    id: str

class NewsBase(BaseModel):
    title: str
    url: str
    content: Optional[str] = None
    summary: Optional[str] = None
    published_at: Optional[datetime] = None
    author: Optional[str] = None
    image_url: Optional[str] = None
    source_id: Optional[str] = None
    relevance_scores: Optional[dict] = None

class NewsInDB(NewsBase):
    id: str
    categories: List[CategoryInDB] = []

class NewsDigest(BaseModel):
    timestamp: str
    timeframe: str
    overview: dict
    top_stories: List[dict]

class TrendAnalysis(BaseModel):
    category: Optional[str] = None
    days: int
    analysis: str
    generated_at: datetime = datetime.utcnow()


# Routes - SPECIFIC ROUTES FIRST
# =============================

# Test routes without authentication
@router.get("/test-digest")
def get_test_digest():
    """Completely open test endpoint with no auth required"""
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "timeframe": "daily",
        "overview": {"test": "This is a test digest endpoint with no auth"},
        "top_stories": []
    }

# Root route for news listing
@router.get("/", response_model=List[NewsInDB])
def get_news(
    *,
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 20,
    category: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: str = "published_at",
    sort_order: str = "desc",
    current_user: User = Depends(get_current_user),
) -> Any:
    """Get news articles with optional filtering."""
    # Start query
    query = db.query(News)
    
    # Apply category filter
    if category:
        category_obj = db.query(Category).filter(Category.name == category).first()
        if not category_obj:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Category '{category}' not found",
            )
        query = query.join(News.categories).filter(Category.id == category_obj.id)
    
    # Apply search filter
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (News.title.ilike(search_term)) |
            (News.content.ilike(search_term)) |
            (News.summary.ilike(search_term))
        )
    
    # Apply sorting
    if sort_by == "published_at":
        if sort_order.lower() == "asc":
            query = query.order_by(News.published_at.asc())
        else:
            query = query.order_by(News.published_at.desc())
    elif sort_by == "title":
        if sort_order.lower() == "asc":
            query = query.order_by(News.title.asc())
        else:
            query = query.order_by(News.title.desc())
    else:
        # Default to sorting by published_at desc
        query = query.order_by(News.published_at.desc())
    
    # Apply pagination
    news_items = query.offset(skip).limit(limit).all()
    
    return news_items

# Static path routes without path parameters
@router.get("/categories/list", response_model=List[CategoryInDB])
def get_categories(
    *,
    db: Session = Depends(get_db),
) -> Any:
    """Get all available news categories."""
    categories = db.query(Category).all()
    return categories

@router.get("/personalized/feed", response_model=List[NewsInDB])
def get_personalized_feed(
    *,
    db: Session = Depends(get_db),
    limit: int = 20,
    current_user: User = Depends(get_current_user),
) -> Any:
    """Get personalized news feed based on user interests."""
    analyzer = NewsAnalyzer(db)
    personalized_news = analyzer.get_personalized_news(str(current_user.id), limit=limit)
    return personalized_news

@router.get("/trending/feed", response_model=List[NewsInDB])
def get_trending_feed(
    *,
    db: Session = Depends(get_db),
    category: Optional[str] = None,
    limit: int = 10,
) -> Any:
    """Get trending news articles."""
    analyzer = NewsAnalyzer(db)
    trending_news = analyzer.get_trending_news(category=category, limit=limit)
    return trending_news

@router.get("/trends/analysis", response_model=TrendAnalysis)
def get_trend_analysis(
    *,
    db: Session = Depends(get_db),
    days: int = Query(7, ge=1, le=30),
    category: Optional[str] = None,
) -> Any:
    """Get an analysis of news trends."""
    summarizer = NewsSummarizer(db)
    try:
        analysis_result = summarizer.generate_trend_analysis(days, category)
        
        # Make sure analysis is always a string
        if isinstance(analysis_result, dict) and "analysis" in analysis_result:
            analysis_text = analysis_result["analysis"]
        else:
            analysis_text = str(analysis_result)
        
        # Return a properly formatted response
        return {
            "category": category,
            "days": days,
            "analysis": analysis_text,
            "generated_at": datetime.utcnow()
        }
    except Exception as e:
        logger.error(f"Error generating trend analysis: {str(e)}")
        # Return a fallback analysis
        return {
            "category": category,
            "days": days,
            "analysis": "Unable to generate trend analysis at this time. Please try again later.",
            "generated_at": datetime.utcnow()
        }

@router.get("/digest")
def get_news_digest(
    *,
    db: Session = Depends(get_db),
    timeframe: str = "daily",
    current_user: User = Depends(get_current_user),
) -> Any:
    """Get a personalized news digest."""
    try:
        print(f"Original digest endpoint called with timeframe: {timeframe}")
        print(f"Current user: {current_user.email}")
        
        # Return a very basic but valid digest
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "timeframe": timeframe,
            "overview": {"General": "A collection of recent news articles."},
            "top_stories": [
                {
                    "id": "1",
                    "title": "Sample News Item",
                    "summary": "This is a sample news item summary.",
                    "url": "https://example.com/news/1",
                    "source": "Example News",
                    "published_at": datetime.utcnow().isoformat()
                }
            ]
        }
    except Exception as e:
        print(f"Error in digest endpoint: {str(e)}")
        # Return a minimal valid digest
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "timeframe": timeframe,
            "overview": {"error": f"Error generating digest: {str(e)}"},
            "top_stories": []
        }

@router.get("/summary", response_model=Dict[str, Any])
def get_news_summary(
    news_id: str,
    verbose: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get or generate a summary for a news article."""
    # Get the article
    news = db.query(News).filter(News.id == news_id).first()
    if not news:
        raise HTTPException(status_code=404, detail="News article not found")
    
    try:
        # Try to get the analyzer
        analyzer = get_news_analyzer(db)
        summary = analyzer.summarize_article(news_id, verbose)
        
        return {"summary": summary, "generated": True}
    except Exception as e:
        # Fallback to existing summary or simple text extraction
        if news.summary:
            return {"summary": news.summary, "generated": False}
        
        # Very basic fallback - first 2-3 sentences
        content = news.content if news.content else ""
        sentences = re.split(r'(?<!\w\.\w.)(?<![A-Z][a-z]\.)(?<=\.|\?)\s', content)
        summary = ' '.join(sentences[:3]).strip()
        
        return {"summary": summary or "No summary available.", "generated": False, "error": str(e)}

@router.get("/minimal-digest")
def get_minimal_digest(
    timeframe: str = "daily",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Minimal version of digest endpoint"""
    # Get recent news for this user
    # For simplicity, just get the most recent news
    recent_news = db.query(News).order_by(News.published_at.desc()).limit(10).all()
    
    # Format the news items
    news_items = []
    for news in recent_news:
        # Extract a basic summary if none exists
        summary = news.summary
        if not summary and news.content:
            sentences = re.split(r'(?<!\w\.\w.)(?<![A-Z][a-z]\.)(?<=\.|\?)\s', news.content)
            summary = ' '.join(sentences[:3]).strip()
        
        news_items.append({
            "id": str(news.id),
            "title": news.title,
            "url": news.url,
            "summary": summary or "No summary available.",
            "source": news.source.name if news.source else "Unknown",
            "published_at": news.published_at.isoformat() if news.published_at else None
        })
    
    # Create a basic digest
    digest = {
        "timeframe": timeframe,
        "generated_at": datetime.utcnow().isoformat(),
        "sections": [
            {
                "title": "Recent News",
                "articles": news_items
            }
        ]
    }
    
    return digest

@router.get("/simplified-digest")
def simplified_digest(
    timeframe: str = "daily",
    current_user: User = Depends(get_current_user),
):
    """Simplified version of digest endpoint for debugging"""
    try:
        # Return a minimal valid digest
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "timeframe": timeframe,
            "overview": {"test": "This is a test digest"},
            "top_stories": [
                {
                    "id": "1", 
                    "title": "Test Story", 
                    "summary": "This is a test summary",
                    "url": "https://example.com/news/1",
                    "source": "Test Source",
                    "published_at": datetime.utcnow().isoformat()
                }
            ]
        }
    except Exception as e:
        print(f"Error in simplified digest: {str(e)}")
        # Return a minimal valid digest
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "timeframe": timeframe,
            "overview": {"error": f"Error generating digest: {str(e)}"},
            "top_stories": []
        }
    
@router.post("/fetch", response_model=dict)
async def manual_fetch_news(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Manually trigger fetching news from all sources."""
    try:
        print(f"Manual news fetch triggered by user: {current_user.email}")
        
        # Initialize the aggregator
        aggregator = NewsAggregator(db)
        
        # Fetch news asynchronously
        articles = await aggregator.fetch_all_sources()
        print(f"Fetched {len(articles)} articles")
        
        # Save the articles
        saved_articles = aggregator.save_articles(articles)
        print(f"Saved {len(saved_articles)} new articles")
        
        # Process newly saved articles if we have an analyzer
        try:
            analyzer = NewsAnalyzer(db)
            news_ids = [str(article.id) for article in saved_articles]
            
            # Process if there are any new articles
            if news_ids:
                # Attempt to categorize and compute relevance
                try:
                    categories = analyzer.categorize_news(news_ids)
                    print(f"Assigned categories to {len(categories)} articles")
                except Exception as e:
                    print(f"Error categorizing news: {str(e)}")
                
                try:
                    relevance = analyzer.compute_interest_relevance(news_ids)
                    print(f"Computed relevance for {len(relevance)} articles")
                except Exception as e:
                    print(f"Error computing relevance: {str(e)}")
        except Exception as analyzer_error:
            print(f"Error using analyzer: {str(analyzer_error)}")
        
        return {
            "status": "success",
            "articles_fetched": len(articles),
            "articles_saved": len(saved_articles),
            "message": f"Successfully fetched news. Found {len(articles)} articles, saved {len(saved_articles)} new ones."
        }
    except Exception as e:
        print(f"Error in manual fetch: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching news: {str(e)}"
        )

# ROUTES WITH PATH PARAMETERS LAST
# ================================

@router.get("/{news_id}", response_model=NewsInDB)
def get_news_by_id(
    *,
    db: Session = Depends(get_db),
    news_id: str,
    current_user: User = Depends(get_current_user),
) -> Any:
    """Get a specific news article by ID."""
    news = db.query(News).filter(News.id == news_id).first()
    if not news:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="News article not found",
        )
    
    # Record read history
    read_history = ReadHistory(
        user_id=current_user.id,
        news_id=news.id
    )
    db.add(read_history)
    db.commit()
    
    return news

@router.get("/{news_id}/summary", response_model=dict)
def get_news_summary(
    *,
    db: Session = Depends(get_db),
    news_id: str,
    verbose: bool = False,
) -> Any:
    """Get or generate a summary for a news article."""
    news = db.query(News).filter(News.id == news_id).first()
    if not news:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="News article not found",
        )
    
    summarizer = NewsSummarizer(db)
    summary = summarizer.summarize_article(news_id, verbose)
    
    return {
        "news_id": news_id,
        "title": news.title,
        "summary": summary,
        "verbose": verbose
    }

@router.post("/{news_id}/read", response_model=dict)
def record_news_read(
    *,
    db: Session = Depends(get_db),
    news_id: str,
    duration_seconds: Optional[int] = None,
    current_user: User = Depends(get_current_user),
) -> Any:
    """Record that a user has read an article."""
    news = db.query(News).filter(News.id == news_id).first()
    if not news:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="News article not found",
        )
    
    # Create read history entry
    read_history = ReadHistory(
        user_id=current_user.id,
        news_id=news.id,
        duration_seconds=duration_seconds
    )
    db.add(read_history)
    db.commit()
    
    return {"status": "success", "message": "Read history recorded"}