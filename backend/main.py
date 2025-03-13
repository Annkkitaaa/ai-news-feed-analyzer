import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import auth, news, profiles, subscriptions
from app.core.config import settings
from app.core.events import create_start_app_handler, create_stop_app_handler

def create_application() -> FastAPI:
    application = FastAPI(
        title=settings.PROJECT_NAME,
        openapi_url=f"{settings.API_V1_STR}/openapi.json",
    )

    # Set CORS middleware
    origins = settings.BACKEND_CORS_ORIGINS
    if origins:
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
    application.include_router(auth.router, prefix=settings.API_V1_STR)
    application.include_router(news.router, prefix=settings.API_V1_STR)
    application.include_router(profiles.router, prefix=settings.API_V1_STR)
    application.include_router(subscriptions.router, prefix=settings.API_V1_STR)

    @application.get("/")
    def root():
        return {"message": f"Welcome to {settings.PROJECT_NAME} API. Visit /docs for documentation."}

    return application

app = create_application()

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)