from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from app.core.config import settings
from typing import Optional
import uuid

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(user_id: int, remember_me: bool = False) -> tuple[str, datetime]:
    """
    Create a JWT access token
    
    Args:
        user_id: User ID to encode in token
        remember_me: If True, token expires in 30 days, otherwise 7 days
    
    Returns:
        Tuple of (token, expiration_datetime)
    """
    # Determine expiration time
    expire_minutes = (
        settings.ACCESS_TOKEN_EXPIRE_MINUTES_REMEMBER if remember_me
        else settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    expires_at = datetime.utcnow() + timedelta(minutes=expire_minutes)
    
    # Create token data
    to_encode = {
        "sub": str(user_id),
        "exp": expires_at,
        "iat": datetime.utcnow(),
        "jti": str(uuid.uuid4())  # JWT ID for token tracking
    }
    
    # Encode JWT
    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )
    
    return encoded_jwt, expires_at


def decode_access_token(token: str) -> Optional[dict]:
    """
    Decode and validate a JWT token
    
    Args:
        token: JWT token string
    
    Returns:
        Token payload if valid, None otherwise
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except JWTError:
        return None
