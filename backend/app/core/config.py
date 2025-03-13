import os
from typing import List, Dict, Any, Optional
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Load .env file
load_dotenv()

class Settings(BaseSettings):
    # Base Settings
    PROJECT_NAME: str = "News Feed Analyzer"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-here")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    
    # CORS - Parse comma-separated list manually
    @property
    def BACKEND_CORS_ORIGINS(self) -> List[str]:
        cors_str = os.getenv("BACKEND_CORS_ORIGINS", "")
        if not cors_str:
            return []
        return [origin.strip() for origin in cors_str.split(",")]
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./newsfeed.db")
    MONGODB_URL: Optional[str] = os.getenv("MONGODB_URL")
    
    # Email Settings
    EMAILS_ENABLED: bool = os.getenv("EMAILS_ENABLED", "False").lower() == "true"
    SMTP_TLS: bool = os.getenv("SMTP_TLS", "True").lower() == "true"
    SMTP_PORT: Optional[int] = int(os.getenv("SMTP_PORT", "587"))
    SMTP_HOST: Optional[str] = os.getenv("SMTP_HOST", "")
    SMTP_USER: Optional[str] = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD: Optional[str] = os.getenv("SMTP_PASSWORD", "")
    EMAILS_FROM_EMAIL: Optional[str] = os.getenv("EMAILS_FROM_EMAIL", "")
    EMAILS_FROM_NAME: Optional[str] = os.getenv("EMAILS_FROM_NAME", "News Feed Analyzer")
    
    # ScrapeGraph AI
    SCRAPEGRAPH_API_KEY: Optional[str] = os.getenv("SCRAPEGRAPH_API_KEY")
    
    # LLM Settings
    LLM_TYPE: str = os.getenv("LLM_TYPE", "huggingface")
    LLM_MODEL_ID: str = os.getenv("LLM_MODEL_ID", "mistralai/Mistral-7B-Instruct-v0.2")
    LLM_API_KEY: Optional[str] = os.getenv("LLM_API_KEY")
    
    # News API Settings
    NEWS_API_KEY: Optional[str] = os.getenv("NEWS_API_KEY")
    NEWS_UPDATE_INTERVAL_MINUTES: int = int(os.getenv("NEWS_UPDATE_INTERVAL_MINUTES", "60"))
    
    # RSS Sources - Parse comma-separated list manually
    @property
    def RSS_SOURCES(self) -> List[str]:
        rss_str = os.getenv("RSS_SOURCES", "")
        if not rss_str:
            return []
        return [url.strip() for url in rss_str.split(",")]
    
    # Redis Settings
    REDIS_HOST: str = os.getenv("REDIS_HOST", "localhost")
    REDIS_PORT: int = int(os.getenv("REDIS_PORT", "6379"))
    
    # Celery
    CELERY_BROKER_URL: str = os.getenv("CELERY_BROKER_URL", "")
    CELERY_RESULT_BACKEND: str = os.getenv("CELERY_RESULT_BACKEND", "")
    
    def __init__(self, **data):
        super().__init__(**data)
        
        # Set default Celery URLs if not provided
        if not self.CELERY_BROKER_URL:
            self.CELERY_BROKER_URL = f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/0"
        if not self.CELERY_RESULT_BACKEND:
            self.CELERY_RESULT_BACKEND = f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/0"


# Create settings instance
settings = Settings()