import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timedelta

from app.db.session import engine, SessionLocal, Base
from app.db.models import Base, News, NewsSource, Category, news_category
from app.api.routes import auth, news, profiles, subscriptions
from app.core.config import settings
from app.core.events import create_start_app_handler, create_stop_app_handler

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
            
            # Create sample categories
            sample_categories = [
                Category(name="Technology", description="Tech news and updates"),
                Category(name="Business", description="Business and economy news"),
                Category(name="Health", description="Health and wellness information")
            ]
            
            for category in sample_categories:
                db.add(category)
            
            db.flush()  # Get IDs for categories
            
            # Create a sample source
            sample_source = NewsSource(
                name="Sample News",
                url="https://example.com/feed",
                source_type="rss"
            )
            db.add(sample_source)
            db.flush()  # Get ID for source
            
            # Sample news articles
            sample_news = [
                {
                    "title": "AI Advancements Transform Healthcare Industry",
                    "url": "https://example.com/news/1",
                    "content": "Artificial intelligence is making significant strides in healthcare. Recent developments in machine learning algorithms have enabled more accurate diagnosis of conditions ranging from cancer to rare genetic disorders. Hospitals and clinics worldwide are adopting these technologies to improve patient outcomes and reduce healthcare costs. Researchers predict that AI will continue to revolutionize medical care in the coming decade, with applications extending to personalized treatment plans, drug discovery, and predictive healthcare.",
                    "summary": "AI technologies are revolutionizing diagnostics and treatment in healthcare.",
                    "published_at": datetime.utcnow(),
                    "author": "Tech Reporter",
                    "image_url": "https://via.placeholder.com/800x400?text=AI+Healthcare",
                    "category_ids": [sample_categories[0].id, sample_categories[2].id]  # Tech and Health
                },
                {
                    "title": "Global Markets React to Economic Policy Changes",
                    "url": "https://example.com/news/2",
                    "content": "Stock markets worldwide showed mixed reactions to the new economic policies announced by major central banks. Asian markets closed higher, while European indices experienced moderate volatility. The Dow Jones Industrial Average and S&P 500 saw modest gains as investors processed the implications of interest rate adjustments. Financial analysts suggest that the markets are still adjusting to the new policy landscape, with sectors like technology and healthcare showing resilience amid broader economic uncertainty.",
                    "summary": "Major indices fluctuate as investors assess impact of new economic measures.",
                    "published_at": datetime.utcnow(),
                    "author": "Financial Analyst",
                    "image_url": "https://via.placeholder.com/800x400?text=Markets",
                    "category_ids": [sample_categories[1].id]  # Business
                },
                {
                    "title": "New Study Reveals Benefits of Mediterranean Diet",
                    "url": "https://example.com/news/3",
                    "content": "A comprehensive study has confirmed the numerous health benefits of adhering to a Mediterranean diet. The research, which followed participants over a ten-year period, found significant reductions in cardiovascular disease, type 2 diabetes, and certain cancers among those who regularly consumed olive oil, fish, nuts, and fresh fruits and vegetables. The findings add to a growing body of evidence supporting the diet's role in promoting longevity and quality of life. Nutritionists are recommending more widespread adoption of these eating patterns across different populations.",
                    "summary": "Research shows Mediterranean diet can reduce risk of several chronic diseases.",
                    "published_at": datetime.utcnow(),
                    "author": "Health Correspondent",
                    "image_url": "https://via.placeholder.com/800x400?text=Diet+Research",
                    "category_ids": [sample_categories[2].id]  # Health
                }
            ]
            
            # Add sample articles with categories
            for article_data in sample_news:
                category_ids = article_data.pop("category_ids")
                article = News(
                    source_id=sample_source.id,
                    **article_data
                )
                db.add(article)
                db.flush()  # Get ID for the article
                
                # Add categories to the article
                for cat_id in category_ids:
                    # Using raw SQL for the many-to-many relationship
                    db.execute(
                        "INSERT INTO news_category (news_id, category_id) VALUES (:news_id, :category_id)",
                        {"news_id": article.id, "category_id": cat_id}
                    )
            
            db.commit()
            print("Sample news data added successfully")
        else:
            print(f"Database already contains {news_count} news articles, skipping seeding")
    except Exception as e:
        print(f"Error seeding data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)