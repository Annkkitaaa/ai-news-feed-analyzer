from datetime import datetime
from typing import Optional
from pydantic import BaseModel

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

    #new