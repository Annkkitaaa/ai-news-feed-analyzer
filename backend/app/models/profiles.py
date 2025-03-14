from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel

from app.models.news import CategoryInDB, NewsInDB

class InterestBase(BaseModel):
    name: str
    description: Optional[str] = None
    keywords: Optional[List[str]] = None

class InterestCreate(InterestBase):
    pass

class InterestUpdate(InterestBase):
    name: Optional[str] = None

class InterestInDB(InterestBase):
    id: str

    class Config:
        orm_mode = True

class NewsSourceBase(BaseModel):
    name: str
    url: str
    source_type: str
    config: Optional[Dict[str, Any]] = None
    is_active: bool = True

class NewsSourceCreate(NewsSourceBase):
    pass

class NewsSourceUpdate(NewsSourceBase):
    name: Optional[str] = None
    url: Optional[str] = None
    source_type: Optional[str] = None
    is_active: Optional[bool] = None

class NewsSourceInDB(NewsSourceBase):
    id: str

    class Config:
        orm_mode = True

class ReadHistoryItem(BaseModel):
    news_id: str
    news_title: str
    news_url: str
    timestamp: str
    duration_seconds: Optional[int] = None

class UserProfileBase(BaseModel):
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    subscription_type: str = "daily"
    custom_interval_hours: Optional[int] = None

class UserProfileCreate(UserProfileBase):
    pass

class UserProfileUpdate(UserProfileBase):
    email: Optional[str] = None
    subscription_type: Optional[str] = None

class UserProfile(UserProfileBase):
    id: str
    interests: List[InterestInDB] = []
    news_sources: List[NewsSourceInDB] = []

    class Config:
        orm_mode = True