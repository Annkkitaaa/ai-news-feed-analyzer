from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class NewsBase(BaseModel):
    title: str
    url: str
    content: Optional[str] = None
    summary: Optional[str] = None
    published_at: Optional[datetime] = None
    author: Optional[str] = None
    image_url: Optional[str] = None
    source_id: Optional[str] = None
    relevance_scores: Optional[Dict[str, float]] = None

class NewsCreate(NewsBase):
    pass

class NewsUpdate(NewsBase):
    title: Optional[str] = None
    url: Optional[str] = None

class NewsInDB(NewsBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class CategoryBase(BaseModel):
    name: str
    description: Optional[str] = None

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(CategoryBase):
    name: Optional[str] = None

class CategoryInDB(CategoryBase):
    id: str

    class Config:
        orm_mode = True

class NewsDigest(BaseModel):
    timestamp: str
    timeframe: str
    overview: Dict[str, Any]
    top_stories: List[Dict[str, Any]]

class TrendAnalysis(BaseModel):
    category: Optional[str] = None
    days: int
    analysis: str
    generated_at: datetime = datetime.utcnow()