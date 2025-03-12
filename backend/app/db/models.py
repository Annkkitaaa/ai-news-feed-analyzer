from datetime import datetime, timedelta
import uuid
from typing import List, Optional, Dict, Any
from sqlalchemy import Column, String, Boolean, Integer, DateTime, ForeignKey, Table, Text, JSON, Float
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

# Many-to-many relationship tables
user_interest = Table(
    "user_interest",
    Base.metadata,
    Column("user_id", UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True),
    Column("interest_id", UUID(as_uuid=True), ForeignKey("interests.id"), primary_key=True),
)

user_news_source = Table(
    "user_news_source",
    Base.metadata,
    Column("user_id", UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True),
    Column("news_source_id", UUID(as_uuid=True), ForeignKey("news_sources.id"), primary_key=True),
)

news_category = Table(
    "news_category",
    Base.metadata,
    Column("news_id", UUID(as_uuid=True), ForeignKey("news.id"), primary_key=True),
    Column("category_id", UUID(as_uuid=True), ForeignKey("categories.id"), primary_key=True),
)


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    first_name = Column(String)
    last_name = Column(String)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    
    # Subscription preferences
    subscription_type = Column(String, default="daily")  # daily, weekly, custom
    custom_interval_hours = Column(Integer, default=24)
    last_email_sent = Column(DateTime)
    
    # Relationships
    interests = relationship("Interest", secondary=user_interest, back_populates="users")
    news_sources = relationship("NewsSource", secondary=user_news_source, back_populates="users")
    read_history = relationship("ReadHistory", back_populates="user")
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Interest(Base):
    __tablename__ = "interests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, unique=True, index=True, nullable=False)
    description = Column(String)
    keywords = Column(ARRAY(String), default=[])
    
    # Relationships
    users = relationship("User", secondary=user_interest, back_populates="interests")
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Category(Base):
    __tablename__ = "categories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, unique=True, index=True, nullable=False)
    description = Column(String)
    
    # Relationships
    news = relationship("News", secondary=news_category, back_populates="categories")
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class NewsSource(Base):
    __tablename__ = "news_sources"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, unique=True, index=True, nullable=False)
    url = Column(String, nullable=False)
    source_type = Column(String, nullable=False)  # rss, api, scraped
    config = Column(JSON, default={})  # Source-specific configuration
    is_active = Column(Boolean, default=True)
    
    # Relationships
    users = relationship("User", secondary=user_news_source, back_populates="news_sources")
    news = relationship("News", back_populates="source")
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class News(Base):
    __tablename__ = "news"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False)
    url = Column(String, unique=True, index=True, nullable=False)
    content = Column(Text)
    published_at = Column(DateTime)
    author = Column(String)
    image_url = Column(String)
    summary = Column(Text)
    source_id = Column(UUID(as_uuid=True), ForeignKey("news_sources.id"))
    relevance_scores = Column(JSON, default={})  # Interest ID to score mapping
    
    # Relationships
    source = relationship("NewsSource", back_populates="news")
    categories = relationship("Category", secondary=news_category, back_populates="news")
    read_history = relationship("ReadHistory", back_populates="news")
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class ReadHistory(Base):
    __tablename__ = "read_history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    news_id = Column(UUID(as_uuid=True), ForeignKey("news.id"))
    timestamp = Column(DateTime, default=datetime.utcnow)
    duration_seconds = Column(Integer, default=0)
    
    # Relationships
    user = relationship("User", back_populates="read_history")
    news = relationship("News", back_populates="read_history")