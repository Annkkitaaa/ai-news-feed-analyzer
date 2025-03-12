import logging
import smtplib
import os
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from jinja2 import Environment, FileSystemLoader, select_autoescape

from sqlalchemy.orm import Session
from app.db.models import User
from app.core.config import settings
from app.services.summarizer import NewsSummarizer

# Set up logging
logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self, db: Session):
        self.db = db
        self.summarizer = NewsSummarizer(db)
        
        # Set up Jinja2 environment for templates
        self.env = Environment(
            loader=FileSystemLoader(os.path.join(os.path.dirname(__file__), "../templates")),
            autoescape=select_autoescape(["html", "xml"])
        )
        
        # Configure email settings
        self.smtp_host = settings.SMTP_HOST
        self.smtp_port = settings.SMTP_PORT
        self.smtp_user = settings.SMTP_USER
        self.smtp_password = settings.SMTP_PASSWORD
        self.from_email = settings.EMAILS_FROM_EMAIL
        self.from_name = settings.EMAILS_FROM_NAME
        self.enabled = settings.EMAILS_ENABLED

    def send_email(self, to_email: str, subject: str, html_content: str) -> bool:
        """Send an email using configured SMTP server."""
        if not self.enabled:
            logger.info(f"Emails disabled. Would have sent '{subject}' to {to_email}")
            return False
            
        try:
            # Create message
            message = MIMEMultipart("alternative")
            message["Subject"] = subject
            message["From"] = f"{self.from_name} <{self.from_email}>"
            message["To"] = to_email
            
            # Add HTML content
            html_part = MIMEText(html_content, "html")
            message.attach(html_part)
            
            # Connect to server and send
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                if settings.SMTP_TLS:
                    server.starttls()
                
                if self.smtp_user and self.smtp_password:
                    server.login(self.smtp_user, self.smtp_password)
                
                server.sendmail(self.from_email, to_email, message.as_string())
            
            logger.info(f"Email sent to {to_email}")
            return True
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {e}")
            return False

    def send_digest_email(self, user_id: str, timeframe: str = "daily") -> bool:
        """Send a news digest email to a specific user."""
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user or not user.email:
            logger.error(f"User {user_id} not found or has no email")
            return False
        
        # Generate the digest content
        digest = self.summarizer.generate_user_digest(user_id, timeframe)
        if "error" in digest:
            logger.error(f"Error generating digest for user {user_id}: {digest['error']}")
            return False
        
        # Format the subject
        period = "Daily" if timeframe == "daily" else "Weekly"
        subject = f"{period} News Digest - {datetime.utcnow().strftime('%b %d, %Y')}"
        
        # Render the email template
        try:
            template = self.env.get_template("digest_email.html")
            html_content = template.render(
                user_name=digest.get("user_name", ""),
                timeframe=timeframe,
                date=datetime.utcnow().strftime("%B %d, %Y"),
                interests=digest.get("interests", {}),
                unsubscribe_url=f"https://{settings.PROJECT_NAME.lower().replace(' ', '-')}.com/unsubscribe/{user_id}"
            )
            
            # Send the email
            success = self.send_email(user.email, subject, html_content)
            
            # Update last email sent timestamp if successful
            if success:
                user.last_email_sent = datetime.utcnow()
                self.db.commit()
            
            return success
        except Exception as e:
            logger.error(f"Error rendering or sending digest email to user {user_id}: {e}")
            return False

    def send_daily_digests(self) -> Dict[str, int]:
        """Send daily digest emails to all subscribed users."""
        # Get users who are subscribed to daily emails
        users = self.db.query(User).filter(
            User.is_active == True,
            User.subscription_type == "daily"
        ).all()
        
        results = {"success": 0, "failure": 0}
        
        for user in users:
            try:
                # Check if we need to send an email today
                if user.last_email_sent:
                    last_sent = user.last_email_sent.replace(tzinfo=None)
                    now = datetime.utcnow()
                    
                    # Skip if we've already sent an email today
                    if last_sent.date() == now.date():
                        continue
                
                # Send the digest
                success = self.send_digest_email(str(user.id), "daily")
                if success:
                    results["success"] += 1
                else:
                    results["failure"] += 1
            except Exception as e:
                logger.error(f"Error processing daily digest for user {user.id}: {e}")
                results["failure"] += 1
        
        return results

    def send_weekly_digests(self) -> Dict[str, int]:
        """Send weekly digest emails to all subscribed users."""
        # Get users who are subscribed to weekly emails
        users = self.db.query(User).filter(
            User.is_active == True,
            User.subscription_type == "weekly"
        ).all()
        
        results = {"success": 0, "failure": 0}
        
        for user in users:
            try:
                # Send the digest
                success = self.send_digest_email(str(user.id), "weekly")
                if success:
                    results["success"] += 1
                else:
                    results["failure"] += 1
            except Exception as e:
                logger.error(f"Error processing weekly digest for user {user.id}: {e}")
                results["failure"] += 1
        
        return results

    def send_custom_digests(self) -> Dict[str, int]:
        """Send digest emails to users with custom intervals."""
        # Get users with custom subscription intervals
        users = self.db.query(User).filter(
            User.is_active == True,
            User.subscription_type == "custom"
        ).all()
        
        results = {"success": 0, "failure": 0}
        now = datetime.utcnow()
        
        for user in users:
            try:
                # Check if it's time to send based on custom interval
                if user.last_email_sent and user.custom_interval_hours:
                    last_sent = user.last_email_sent.replace(tzinfo=None)
                    interval = timedelta(hours=user.custom_interval_hours)
                    next_send_time = last_sent + interval
                    
                    # Skip if not yet time to send
                    if now < next_send_time:
                        continue
                
                # Send the digest
                timeframe = "weekly" if user.custom_interval_hours and user.custom_interval_hours >= 168 else "daily"
                success = self.send_digest_email(str(user.id), timeframe)
                if success:
                    results["success"] += 1
                else:
                    results["failure"] += 1
            except Exception as e:
                logger.error(f"Error processing custom digest for user {user.id}: {e}")
                results["failure"] += 1
        
        return results

    def send_welcome_email(self, user_id: str) -> bool:
        """Send a welcome email to a new user."""
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user or not user.email:
            logger.error(f"User {user_id} not found or has no email")
            return False
        
        # Prepare welcome email
        subject = f"Welcome to {settings.PROJECT_NAME}!"
        
        try:
            template = self.env.get_template("welcome_email.html")
            html_content = template.render(
                user_name=f"{user.first_name if user.first_name else ''}".strip(),
                project_name=settings.PROJECT_NAME,
                login_url=f"https://{settings.PROJECT_NAME.lower().replace(' ', '-')}.com/login",
                preferences_url=f"https://{settings.PROJECT_NAME.lower().replace(' ', '-')}.com/preferences"
            )
            
            # Send the email
            return self.send_email(user.email, subject, html_content)
        except Exception as e:
            logger.error(f"Error sending welcome email to user {user_id}: {e}")
            return False

    def send_password_reset_email(self, user_id: str, token: str) -> bool:
        """Send a password reset email."""
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user or not user.email:
            logger.error(f"User {user_id} not found or has no email")
            return False
        
        # Prepare password reset email
        subject = f"Reset Your {settings.PROJECT_NAME} Password"
        
        try:
            template = self.env.get_template("password_reset_email.html")
            reset_url = f"https://{settings.PROJECT_NAME.lower().replace(' ', '-')}.com/reset-password?token={token}"
            
            html_content = template.render(
                user_name=f"{user.first_name if user.first_name else ''}".strip(),
                project_name=settings.PROJECT_NAME,
                reset_url=reset_url,
                expiry_hours=settings.ACCESS_TOKEN_EXPIRE_MINUTES // 60
            )
            
            # Send the email
            return self.send_email(user.email, subject, html_content)
        except Exception as e:
            logger.error(f"Error sending password reset email to user {user_id}: {e}")
            return False