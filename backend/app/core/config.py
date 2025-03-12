import os
from typing import List, Union, Dict, Any, Optional
from pydantic import BaseSettings, AnyHttpUrl, validator, EmailStr, PostgresDsn, field_validator
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    # Base Settings
    PROJECT_NAME: str = "News Feed Analyzer"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-here")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    
    # CORS
    BACKEND_CORS_ORIGINS: List[AnyHttpUrl] = []

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    # Database
    DATABASE_URL: Optional[PostgresDsn] = os.getenv("DATABASE_URL")
    MONGODB_URL: Optional[str] = os.getenv("MONGODB_URL")
    
    # Email Settings
    EMAILS_ENABLED: bool = os.getenv("EMAILS_ENABLED", "False").lower() == "true"
    SMTP_TLS: bool = os.getenv("SMTP_TLS", "True").lower() == "true"
    SMTP_PORT: Optional[int] = int(os.getenv("SMTP_PORT", "587"))
    SMTP_HOST: Optional[str] = os.getenv("SMTP_HOST")
    SMTP_USER: Optional[str] = os.getenv("SMTP_USER")
    SMTP_PASSWORD: Optional[str] = os.getenv("SMTP_PASSWORD")
    EMAILS_FROM_EMAIL: Optional[EmailStr] = os.getenv("EMAILS_FROM_EMAIL")
    EMAILS_FROM_NAME: Optional[str] = os.getenv("EMAILS_FROM_NAME", "News Feed Analyzer")
    
    # ScrapeGraph AI
    SCRAPEGRAPH_API_KEY: Optional[str] = os.getenv("SCRAPEGRAPH_API_KEY")
    
    # LLM Settings
    LLM_TYPE: str = os.getenv("LLM_TYPE", "huggingface")  # huggingface, openai, etc.
    LLM_MODEL_ID: str = os.getenv("LLM_MODEL_ID", "mistralai/Mistral-7B-Instruct-v0.2")
    LLM_API_KEY: Optional[str] = os.getenv("LLM_API_KEY")
    
    # News API Settings
    NEWS_API_KEY: Optional[str] = os.getenv("NEWS_API_KEY")
    NEWS_UPDATE_INTERVAL_MINUTES: int = int(os.getenv("NEWS_UPDATE_INTERVAL_MINUTES", "60"))
    RSS_SOURCES: List[str] = []
    
    @field_validator("RSS_SOURCES", mode="before")
    def assemble_rss_sources(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, list):
            return v
        return []
    
    # Redis Settings
    REDIS_HOST: str = os.getenv("REDIS_HOST", "localhost")
    REDIS_PORT: int = int(os.getenv("REDIS_PORT", "6379"))
    
    # Celery
    CELERY_BROKER_URL: str = os.getenv("CELERY_BROKER_URL", f"redis://{REDIS_HOST}:{REDIS_PORT}/0")
    CELERY_RESULT_BACKEND: str = os.getenv("CELERY_RESULT_BACKEND", f"redis://{REDIS_HOST}:{REDIS_PORT}/0")

    class Config:
        case_sensitive = True


settings = Settings()