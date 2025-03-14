from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr

class SubscriptionBase(BaseModel):
    subscription_type: str
    custom_interval_hours: Optional[int] = None

class SubscriptionCreate(SubscriptionBase):
    user_id: str
    email: str

class SubscriptionUpdate(SubscriptionBase):
    pass

class SubscriptionStatus(SubscriptionBase):
    user_id: str
    email: str
    last_email_sent: Optional[datetime] = None
    is_active: bool = True

    class Config:
        orm_mode = True

class TestEmailRequest(BaseModel):
    email_type: str = "digest"
    timeframe: Optional[str] = "daily"

class EmailTemplate(BaseModel):
    subject: str
    body_html: str
    body_text: Optional[str] = None

class EmailResponse(BaseModel):
    success: bool
    message: str
    recipient: str
    email_type: str
    sent_at: datetime = datetime.utcnow()