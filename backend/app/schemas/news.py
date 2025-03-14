from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

from app.schemas.categories import CategoryInDB

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

class NewsInDB(NewsBase):
    id: str
    categories: List[CategoryInDB] = []

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