from typing import Any, List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.api.routes.auth import get_current_user
from app.db.models import User, Interest, NewsSource, ReadHistory, News

# Set up router
router = APIRouter(prefix="/profiles", tags=["user profiles"])

# Models
class InterestBase(BaseModel):
    name: str
    description: Optional[str] = None
    keywords: Optional[List[str]] = None

class InterestCreate(InterestBase):
    pass

class InterestInDB(InterestBase):
    id: str

class NewsSourceBase(BaseModel):
    name: str
    url: str
    source_type: str
    config: Optional[dict] = None
    is_active: bool = True

class NewsSourceCreate(NewsSourceBase):
    pass

class NewsSourceInDB(NewsSourceBase):
    id: str

class ReadHistoryItem(BaseModel):
    news_id: str
    news_title: str
    news_url: str
    timestamp: str
    duration_seconds: Optional[int] = None

class UserProfile(BaseModel):
    id: str
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    interests: List[InterestInDB] = []
    news_sources: List[NewsSourceInDB] = []
    subscription_type: str
    custom_interval_hours: Optional[int] = None


# Routes
@router.get("/me", response_model=UserProfile)
def get_user_profile(
    *,
    current_user: User = Depends(get_current_user),
) -> Any:
    """Get current user's profile information."""
    return current_user

@router.get("/interests", response_model=List[InterestInDB])
def get_all_interests(
    *,
    db: Session = Depends(get_db),
) -> Any:
    """Get all available interest categories."""
    interests = db.query(Interest).all()
    return interests

@router.post("/interests", response_model=InterestInDB)
def create_interest(
    *,
    db: Session = Depends(get_db),
    interest_in: InterestCreate,
    current_user: User = Depends(get_current_user),
) -> Any:
    """Create a new interest category."""
    # Check if interest already exists
    existing = db.query(Interest).filter(Interest.name == interest_in.name).first()
    if existing:
        return existing
    
    # Create new interest
    interest = Interest(
        name=interest_in.name,
        description=interest_in.description,
        keywords=interest_in.keywords or []
    )
    db.add(interest)
    db.commit()
    db.refresh(interest)
    
    return interest

@router.post("/interests/{interest_id}/add", response_model=UserProfile)
def add_user_interest(
    *,
    db: Session = Depends(get_db),
    interest_id: str,
    current_user: User = Depends(get_current_user),
) -> Any:
    """Add an interest to the user's profile."""
    interest = db.query(Interest).filter(Interest.id == interest_id).first()
    if not interest:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interest not found",
        )
    
    # Check if user already has this interest
    if interest in current_user.interests:
        return current_user
    
    # Add interest to user
    current_user.interests.append(interest)
    db.commit()
    db.refresh(current_user)
    
    return current_user

@router.post("/interests/{interest_id}/remove", response_model=UserProfile)
def remove_user_interest(
    *,
    db: Session = Depends(get_db),
    interest_id: str,
    current_user: User = Depends(get_current_user),
) -> Any:
    """Remove an interest from the user's profile."""
    interest = db.query(Interest).filter(Interest.id == interest_id).first()
    if not interest:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interest not found",
        )
    
    # Check if user has this interest
    if interest not in current_user.interests:
        return current_user
    
    # Remove interest from user
    current_user.interests.remove(interest)
    db.commit()
    db.refresh(current_user)
    
    return current_user

@router.get("/news-sources", response_model=List[NewsSourceInDB])
def get_all_news_sources(
    *,
    db: Session = Depends(get_db),
) -> Any:
    """Get all available news sources."""
    sources = db.query(NewsSource).all()
    return sources

@router.post("/news-sources", response_model=NewsSourceInDB)
def create_news_source(
    *,
    db: Session = Depends(get_db),
    source_in: NewsSourceCreate,
    current_user: User = Depends(get_current_user),
) -> Any:
    """Create a new news source."""
    # Check if source already exists
    existing = db.query(NewsSource).filter(NewsSource.url == source_in.url).first()
    if existing:
        return existing
    
    # Create new source
    source = NewsSource(
        name=source_in.name,
        url=source_in.url,
        source_type=source_in.source_type,
        config=source_in.config or {},
        is_active=source_in.is_active
    )
    db.add(source)
    db.commit()
    db.refresh(source)
    
    return source

@router.post("/news-sources/{source_id}/add", response_model=UserProfile)
def add_user_news_source(
    *,
    db: Session = Depends(get_db),
    source_id: str,
    current_user: User = Depends(get_current_user),
) -> Any:
    """Add a news source to the user's profile."""
    source = db.query(NewsSource).filter(NewsSource.id == source_id).first()
    if not source:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="News source not found",
        )
    
    # Check if user already has this source
    if source in current_user.news_sources:
        return current_user
    
    # Add source to user
    current_user.news_sources.append(source)
    db.commit()
    db.refresh(current_user)
    
    return current_user

@router.post("/news-sources/{source_id}/remove", response_model=UserProfile)
def remove_user_news_source(
    *,
    db: Session = Depends(get_db),
    source_id: str,
    current_user: User = Depends(get_current_user),
) -> Any:
    """Remove a news source from the user's profile."""
    source = db.query(NewsSource).filter(NewsSource.id == source_id).first()
    if not source:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="News source not found",
        )
    
    # Check if user has this source
    if source not in current_user.news_sources:
        return current_user
    
    # Remove source from user
    current_user.news_sources.remove(source)
    db.commit()
    db.refresh(current_user)
    
    return current_user

@router.get("/read-history", response_model=List[ReadHistoryItem])
def get_read_history(
    *,
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
) -> Any:
    """Get user's reading history."""
    # Get read history with news titles
    history = (
        db.query(
            ReadHistory.news_id,
            News.title.label("news_title"),
            News.url.label("news_url"),
            ReadHistory.timestamp,
            ReadHistory.duration_seconds
        )
        .join(News, ReadHistory.news_id == News.id)
        .filter(ReadHistory.user_id == current_user.id)
        .order_by(ReadHistory.timestamp.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    
    # Convert to response model
    result = []
    for item in history:
        result.append({
            "news_id": str(item.news_id),
            "news_title": item.news_title,
            "news_url": item.news_url,
            "timestamp": item.timestamp.isoformat(),
            "duration_seconds": item.duration_seconds
        })
    
    return result

@router.delete("/read-history", response_model=dict)
def clear_read_history(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Clear user's reading history."""
    deleted = db.query(ReadHistory).filter(ReadHistory.user_id == current_user.id).delete()
    db.commit()
    
    return {"status": "success", "deleted_records": deleted}