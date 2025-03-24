import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.session import SessionLocal, engine, Base
from app.db.models import News, Category, NewsSource
from app.api.routes import auth, news, profiles, subscriptions
from app.core.config import settings
from app.core.events import create_start_app_handler, create_stop_app_handler
from app.services.aggregator import NewsAggregator
from datetime import datetime, timedelta

# Create database tables
Base.metadata.create_all(bind=engine)

def create_application() -> FastAPI:
    application = FastAPI(
        title=settings.PROJECT_NAME,
        openapi_url=f"{settings.API_V1_STR}/openapi.json",
    )
    
    # Set CORS middleware
    origins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]
    
    # Add origins from settings
    if settings.BACKEND_CORS_ORIGINS:
        for origin in settings.BACKEND_CORS_ORIGINS:
            if origin not in origins:
                origins.append(str(origin))
    
    application.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Set up event handlers
    application.add_event_handler("startup", create_start_app_handler(application))
    application.add_event_handler("shutdown", create_stop_app_handler(application))
    
    # Include API routes
    application.include_router(auth.router, prefix=f"{settings.API_V1_STR}")
    application.include_router(news.router, prefix=f"{settings.API_V1_STR}")
    application.include_router(profiles.router, prefix=f"{settings.API_V1_STR}")
    application.include_router(subscriptions.router, prefix=f"{settings.API_V1_STR}")
    
    @application.get("/")
    def root():
        return {"message": f"Welcome to {settings.PROJECT_NAME} API. Visit /docs for documentation."}
        
    @application.get("/health")
    def health_check():
        return {"status": "ok"}
    
    @application.get("/test-cors")
    def test_cors():
        return {"cors_test": "successful"}
    
    @application.get("/debug/routes")
    def debug_routes():
        """List all registered routes for debugging"""
        routes = []
        for route in application.routes:
            routes.append({
                "path": route.path,
                "name": route.name,
                "methods": route.methods if hasattr(route, "methods") else None
            })
        return {"routes": routes}
    
    return application

app = create_application()

@app.on_event("startup")
async def seed_initial_data():
    db = SessionLocal()
    try:
        # Check if there are any news articles
        news_count = db.query(News).count()
        if news_count == 0:
            print("Seeding initial news data...")
            # Create sample news articles
            sample_news = [
                {
                    "title": "Sample News Article 1",
                    "url": "https://example.com/news/1",
                    "content": "This is a sample news article with some content to display.",
                    "summary": "Sample summary for testing purposes.",
                    "published_at": datetime.utcnow(),
                    "author": "AI News Team",
                    "image_url": "https://via.placeholder.com/800x400",
                },
                {
                    "title": "Sample News Article 2",
                    "url": "https://example.com/news/2",
                    "content": "Another sample article with different content for testing.",
                    "summary": "Another sample summary for testing the news feed.",
                    "published_at": datetime.utcnow(),
                    "author": "AI News Team",
                    "image_url": "https://via.placeholder.com/800x400",
                }
            ]
            
            # Create a sample source first
            sample_source = NewsSource(
                name="Sample Source",
                url="https://example.com",
                source_type="rss"
            )
            db.add(sample_source)
            db.flush()
            
            # Add sample articles
            for article_data in sample_news:
                article = News(
                    title=article_data["title"],
                    url=article_data["url"],
                    content=article_data["content"],
                    summary=article_data["summary"],
                    published_at=article_data["published_at"],
                    author=article_data["author"],
                    image_url=article_data["image_url"],
                    source_id=sample_source.id
                )
                db.add(article)
            
            db.commit()
            print("Sample news data added successfully")
    except Exception as e:
        print(f"Error seeding data: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)