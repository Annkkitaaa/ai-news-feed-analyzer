# Update app/core/events.py
import logging
from typing import Callable
from fastapi import FastAPI
from app.db.session import connect_to_mongodb, close_mongodb_connection
from app.core.config import settings

logger = logging.getLogger(__name__)

def create_start_app_handler(app: FastAPI) -> Callable:
    async def start_app() -> None:
        logger.info("Starting up application...")
        # Connect to MongoDB for storing news content if configured
        if settings.MONGODB_URL:
            connect_to_mongodb()
            logger.info("MongoDB connection established")
        else:
            logger.warning("MongoDB URL not configured. Some features may not be available.")
        
    return start_app

def create_stop_app_handler(app: FastAPI) -> Callable:
    async def stop_app() -> None:
        logger.info("Shutting down application...")
        # Close MongoDB connection if it was established
        if settings.MONGODB_URL:
            close_mongodb_connection()
            logger.info("MongoDB connection closed")
        
    return stop_app