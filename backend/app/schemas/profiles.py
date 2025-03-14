from typing import List, Optional
from pydantic import BaseModel

from app.schemas.news import NewsInDB

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