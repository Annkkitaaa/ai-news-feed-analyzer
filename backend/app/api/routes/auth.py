from datetime import datetime, timedelta
from typing import Any, List, Optional

from fastapi import APIRouter, Body, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session
from passlib.context import CryptContext

from app.api.dependencies import get_db
from app.db.models import User
from app.core.config import settings
from app.services.email_service import EmailService

# Set up router
router = APIRouter(tags=["authentication"])

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")

# Models
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenPayload(BaseModel):
    sub: Optional[str] = None

class UserBase(BaseModel):
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    is_active: Optional[bool] = True

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    password: Optional[str] = None
    subscription_type: Optional[str] = None
    custom_interval_hours: Optional[int] = None

class UserInDB(UserBase):
    id: str
    created_at: datetime
    updated_at: datetime

class PasswordReset(BaseModel):
    email: EmailStr

class NewPassword(BaseModel):
    token: str
    new_password: str = Field(..., min_length=6)


# Helper functions
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm="HS256")
    return encoded_jwt

def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        token_data = TokenPayload(sub=user_id)
    except JWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.id == token_data.sub).first()
    if user is None:
        raise credentials_exception
    return user


# Routes
@router.post("/auth/register", response_model=UserInDB)
def register_user(
    *,
    db: Session = Depends(get_db),
    user_in: UserCreate,
) -> Any:
    """Register a new user."""
    # Check if user already exists
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists.",
        )
    
    # Create new user
    hashed_password = get_password_hash(user_in.password)
    user = User(
        email=user_in.email,
        hashed_password=hashed_password,
        first_name=user_in.first_name,
        last_name=user_in.last_name,
        is_active=True,
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Send welcome email
    email_service = EmailService(db)
    email_service.send_welcome_email(str(user.id))
    
    return user

@router.post("/auth/login", response_model=Token)
def login(
    db: Session = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends(),
) -> Any:
    """OAuth2 compatible token login, returns an access token."""
    user = db.query(User).filter(User.email == form_data.username).first()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token({"sub": str(user.id)}, expires_delta=access_token_expires)
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/auth/reset-password", response_model=dict)
def request_password_reset(
    reset_in: PasswordReset,
    db: Session = Depends(get_db),
) -> Any:
    """Send a password reset email."""
    user = db.query(User).filter(User.email == reset_in.email).first()
    
    # Always return success, even if user doesn't exist (for security)
    if not user:
        return {"message": "Password reset email sent if the account exists."}
    
    # Generate token
    reset_token_expires = timedelta(hours=24)
    reset_token = create_access_token(
        {"sub": str(user.id), "type": "reset"}, 
        expires_delta=reset_token_expires
    )
    
    # Send email
    email_service = EmailService(db)
    email_service.send_password_reset_email(str(user.id), reset_token)
    
    return {"message": "Password reset email sent if the account exists."}

@router.post("/auth/reset-password-confirm", response_model=dict)
def confirm_password_reset(
    new_password_in: NewPassword,
    db: Session = Depends(get_db),
) -> Any:
    """Reset password with token."""
    try:
        # Verify token
        payload = jwt.decode(new_password_in.token, settings.SECRET_KEY, algorithms=["HS256"])
        user_id: str = payload.get("sub")
        token_type: str = payload.get("type")
        
        if user_id is None or token_type != "reset":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid token",
            )
        
        # Update user password
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )
        
        user.hashed_password = get_password_hash(new_password_in.new_password)
        db.commit()
        
        return {"message": "Password reset successful"}
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired token",
        )

@router.get("/auth/me", response_model=UserInDB)
def get_current_user_info(
    current_user: User = Depends(get_current_user),
) -> Any:
    """Get current user info."""
    return current_user

@router.put("/auth/me", response_model=UserInDB)
def update_current_user(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    user_in: UserUpdate,
) -> Any:
    """Update current user info."""
    # Update fields
    if user_in.email is not None:
        # Check if email is already taken by another user
        existing_user = db.query(User).filter(User.email == user_in.email).first()
        if existing_user and existing_user.id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )
        current_user.email = user_in.email
        
    if user_in.first_name is not None:
        current_user.first_name = user_in.first_name
    
    if user_in.last_name is not None:
        current_user.last_name = user_in.last_name
    
    if user_in.password is not None:
        current_user.hashed_password = get_password_hash(user_in.password)
    
    if user_in.subscription_type is not None:
        valid_types = ["daily", "weekly", "custom"]
        if user_in.subscription_type not in valid_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid subscription type. Must be one of: {', '.join(valid_types)}"
            )
        current_user.subscription_type = user_in.subscription_type
    
    if user_in.custom_interval_hours is not None:
        if user_in.custom_interval_hours < 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Custom interval must be at least 1 hour"
            )
        current_user.custom_interval_hours = user_in.custom_interval_hours
    
    current_user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(current_user)
    
    return current_user