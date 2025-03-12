from datetime import datetime
from typing import Any, Optional, List

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.api.routes.auth import get_current_user
from app.db.models import User
from app.services.email_service import EmailService

# Set up router
router = APIRouter(prefix="/subscriptions", tags=["email subscriptions"])

# Models
class SubscriptionUpdate(BaseModel):
    subscription_type: str
    custom_interval_hours: Optional[int] = None

class TestEmailRequest(BaseModel):
    email_type: str = "digest"
    timeframe: Optional[str] = "daily"

class SubscriptionStatus(BaseModel):
    user_id: str
    email: str
    subscription_type: str
    custom_interval_hours: Optional[int] = None
    last_email_sent: Optional[datetime] = None
    is_active: bool


# Routes
@router.get("/status", response_model=SubscriptionStatus)
def get_subscription_status(
    *,
    current_user: User = Depends(get_current_user),
) -> Any:
    """Get current user's subscription status."""
    return {
        "user_id": str(current_user.id),
        "email": current_user.email,
        "subscription_type": current_user.subscription_type,
        "custom_interval_hours": current_user.custom_interval_hours,
        "last_email_sent": current_user.last_email_sent,
        "is_active": current_user.is_active
    }

@router.put("/update", response_model=SubscriptionStatus)
def update_subscription(
    *,
    db: Session = Depends(get_db),
    subscription_in: SubscriptionUpdate,
    current_user: User = Depends(get_current_user),
) -> Any:
    """Update user's subscription preferences."""
    # Validate subscription type
    valid_types = ["daily", "weekly", "custom", "none"]
    if subscription_in.subscription_type not in valid_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid subscription type. Must be one of: {', '.join(valid_types)}"
        )
    
    # If type is custom, validate interval
    if subscription_in.subscription_type == "custom":
        if not subscription_in.custom_interval_hours or subscription_in.custom_interval_hours < 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Custom interval must be at least 1 hour"
            )
        current_user.custom_interval_hours = subscription_in.custom_interval_hours
    
    # Update subscription type
    current_user.subscription_type = subscription_in.subscription_type
    db.commit()
    db.refresh(current_user)
    
    return {
        "user_id": str(current_user.id),
        "email": current_user.email,
        "subscription_type": current_user.subscription_type,
        "custom_interval_hours": current_user.custom_interval_hours,
        "last_email_sent": current_user.last_email_sent,
        "is_active": current_user.is_active
    }

@router.post("/unsubscribe/{user_id}", response_model=dict)
def unsubscribe(
    *,
    db: Session = Depends(get_db),
    user_id: str,
) -> Any:
    """Unsubscribe a user from all emails (public endpoint)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        # For privacy, always return success even if user not found
        return {"status": "success", "message": "Unsubscribed successfully"}
    
    user.subscription_type = "none"
    db.commit()
    
    return {"status": "success", "message": "Unsubscribed successfully"}

@router.post("/subscribe", response_model=dict)
def subscribe(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Re-subscribe a user to emails."""
    if current_user.subscription_type != "none":
        return {"status": "success", "message": "Already subscribed"}
    
    # Default to daily subscription
    current_user.subscription_type = "daily"
    db.commit()
    
    return {"status": "success", "message": "Subscribed successfully"}

@router.post("/test-email", response_model=dict)
def send_test_email(
    *,
    db: Session = Depends(get_db),
    background_tasks: BackgroundTasks,
    request: TestEmailRequest,
    current_user: User = Depends(get_current_user),
) -> Any:
    """Send a test email to the current user."""
    email_service = EmailService(db)
    
    if request.email_type == "digest":
        # Send digest email in background to not block the request
        background_tasks.add_task(
            email_service.send_digest_email,
            str(current_user.id),
            request.timeframe or "daily"
        )
        return {
            "status": "success", 
            "message": f"Test {request.timeframe} digest email queued for delivery to {current_user.email}"
        }
    elif request.email_type == "welcome":
        background_tasks.add_task(
            email_service.send_welcome_email,
            str(current_user.id)
        )
        return {
            "status": "success", 
            "message": f"Test welcome email queued for delivery to {current_user.email}"
        }
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email type. Must be 'digest' or 'welcome'"
        )

@router.post("/manual-digest", response_model=dict)
def send_manual_digest(
    *,
    db: Session = Depends(get_db),
    background_tasks: BackgroundTasks,
    timeframe: str = "daily",
    current_user: User = Depends(get_current_user),
) -> Any:
    """Manually trigger sending of a digest email."""
    if timeframe not in ["daily", "weekly"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Timeframe must be 'daily' or 'weekly'"
        )
    
    email_service = EmailService(db)
    background_tasks.add_task(
        email_service.send_digest_email,
        str(current_user.id),
        timeframe
    )
    
    return {
        "status": "success",
        "message": f"Manual {timeframe} digest email queued for delivery to {current_user.email}"
    }