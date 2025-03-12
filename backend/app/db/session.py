from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session

from app.core.config import settings

engine = create_engine(str(settings.DATABASE_URL), pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# MongoDB connection setup (if using MongoDB for storing news articles)
from pymongo import MongoClient
from pymongo.database import Database

mongodb_client: MongoClient = None
mongodb: Database = None

def get_db() -> Session:
    """Get a SQLAlchemy database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_mongodb() -> Database:
    """Get a MongoDB database connection."""
    return mongodb

def connect_to_mongodb() -> None:
    """Initialize MongoDB connection."""
    global mongodb_client, mongodb
    mongodb_client = MongoClient(settings.MONGODB_URL)
    mongodb = mongodb_client.get_database("news_feed")

def close_mongodb_connection() -> None:
    """Close MongoDB connection."""
    global mongodb_client
    if mongodb_client:
        mongodb_client.close()