import logging
from typing import Callable
from fastapi import FastAPI
from app.db.session import connect_to_mongodb, close_mongodb_connection

logger = logging.getLogger(__name__)

def create_start_app_handler(app: FastAPI) -> Callable:
    async def start_app() -> None:
        logger.info("Starting up application...")
        # Connect to MongoDB for storing news content
        connect_to_mongodb()
        logger.info("MongoDB connection established")
        
    return start_app

def create_stop_app_handler(app: FastAPI) -> Callable:
    async def stop_app() -> None:
        logger.info("Shutting down application...")
        # Close MongoDB connection
        close_mongodb_connection()
        logger.info("MongoDB connection closed")
        
    return stop_app