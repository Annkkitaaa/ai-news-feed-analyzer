import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator

from app.core.config import settings

# Handle SQLite database path
if settings.DATABASE_URL.startswith('sqlite:///'):
    db_path = settings.DATABASE_URL.replace('sqlite:///', '')
    # Ensure the directory exists if it's not in the current directory
    if '/' in db_path:
        os.makedirs(os.path.dirname(os.path.abspath(db_path)), exist_ok=True)

# Create SQLAlchemy engine
engine = create_engine(
    settings.DATABASE_URL, 
    pool_pre_ping=True,
    # For SQLite, these parameters are important
    connect_args={"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db() -> Generator[Session, None, None]:
    """Get a SQLAlchemy database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()