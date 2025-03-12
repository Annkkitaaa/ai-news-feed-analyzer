import logging
from datetime import datetime
from typing import Dict, Any

from celery import shared_task
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.services.email_service import EmailService

# Set up logging
logger = logging.getLogger(__name__)

@shared_task
def send_daily_digests() -> Dict[str, Any]:
    """Celery task to send daily digest emails to all subscribed users."""
    logger.info(f"Starting daily digest email task at {datetime.utcnow()}")
    db = SessionLocal()
    
    try:
        email_service = EmailService(db)
        results = email_service.send_daily_digests()
        
        logger.info(f"Daily digest email task completed: {results}")
        return {
            "status": "success",
            "emails_sent": results.get("success", 0),
            "emails_failed": results.get("failure", 0),
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Error in send_daily_digests task: {e}")
        return {
            "status": "error",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }
    finally:
        db.close()

@shared_task
def send_weekly_digests() -> Dict[str, Any]:
    """Celery task to send weekly digest emails to all subscribed users."""
    logger.info(f"Starting weekly digest email task at {datetime.utcnow()}")
    db = SessionLocal()
    
    try:
        email_service = EmailService(db)
        results = email_service.send_weekly_digests()
        
        logger.info(f"Weekly digest email task completed: {results}")
        return {
            "status": "success",
            "emails_sent": results.get("success", 0),
            "emails_failed": results.get("failure", 0),
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Error in send_weekly_digests task: {e}")
        return {
            "status": "error",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }
    finally:
        db.close()

@shared_task
def send_custom_digests() -> Dict[str, Any]:
    """Celery task to send digest emails to users with custom intervals."""
    logger.info(f"Starting custom interval digest email task at {datetime.utcnow()}")
    db = SessionLocal()
    
    try:
        email_service = EmailService(db)
        results = email_service.send_custom_digests()
        
        logger.info(f"Custom digest email task completed: {results}")
        return {
            "status": "success",
            "emails_sent": results.get("success", 0),
            "emails_failed": results.get("failure", 0),
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Error in send_custom_digests task: {e}")
        return {
            "status": "error",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }
    finally:
        db.close()

@shared_task
def send_digest_to_user(user_id: str, timeframe: str = "daily") -> Dict[str, Any]:
    """Celery task to send a digest email to a specific user."""
    logger.info(f"Sending {timeframe} digest to user {user_id} at {datetime.utcnow()}")
    db = SessionLocal()
    
    try:
        email_service = EmailService(db)
        success = email_service.send_digest_email(user_id, timeframe)
        
        if success:
            logger.info(f"Successfully sent {timeframe} digest to user {user_id}")
            return {
                "status": "success",
                "user_id": user_id,
                "timeframe": timeframe,
                "timestamp": datetime.utcnow().isoformat()
            }
        else:
            logger.error(f"Failed to send {timeframe} digest to user {user_id}")
            return {
                "status": "failure",
                "user_id": user_id,
                "timeframe": timeframe,
                "timestamp": datetime.utcnow().isoformat()
            }
    except Exception as e:
        logger.error(f"Error in send_digest_to_user task for user {user_id}: {e}")
        return {
            "status": "error",
            "user_id": user_id,
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }
    finally:
        db.close()