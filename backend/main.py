import uvicorn
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.db.session import engine, SessionLocal, get_db
from app.db.models import Base, News, NewsSource, Category
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
    
    @application.get("/seed-data")
    def seed_data(db: Session = Depends(get_db)):
        """Manually seed initial data for the application."""
        try:
            # Import and run the seeders
            from app.db.seeder import run_all_seeders
            run_all_seeders(db)
            return {"status": "success", "message": "Data seeded successfully"}
        except Exception as e:
            return {"status": "error", "message": str(e)}
    
    return application

app = create_application()

@app.on_event("startup")
async def startup_db_seed():
    """Run seeders on application startup"""
    try:
        db = SessionLocal()
        # Import the seeders module
        from app.db.seeder import run_all_seeders
        run_all_seeders(db)
        print("Data seeding completed on startup")
    except Exception as e:
        print(f"Error in startup seeding: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)