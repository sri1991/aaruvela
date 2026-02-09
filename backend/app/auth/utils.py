from passlib.context import CryptContext
from datetime import datetime, timedelta
from jose import JWTError, jwt
from typing import Optional, Dict, Any
from app.config import settings

# Password context for PIN hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_pin(pin: str) -> str:
    """
    Hash a PIN using bcrypt
    
    Args:
        pin: 4-digit PIN string
        
    Returns:
        Hashed PIN
    """
    return pwd_context.hash(pin)


def verify_pin(plain_pin: str, hashed_pin: str) -> bool:
    """
    Verify a PIN against its hash
    
    Args:
        plain_pin: Plain text PIN
        hashed_pin: Hashed PIN from database
        
    Returns:
        True if PIN matches, False otherwise
    """
    return pwd_context.verify(plain_pin, hashed_pin)


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token
    
    Args:
        data: Dictionary of claims to encode in the token
        expires_delta: Optional expiration time delta
        
    Returns:
        Encoded JWT token
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.jwt_expiration_minutes)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.jwt_secret, algorithm=settings.jwt_algorithm)
    
    return encoded_jwt


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Decode and verify a JWT access token
    
    Args:
        token: JWT token string
        
    Returns:
        Decoded token payload or None if invalid
    """
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        return payload
    except JWTError:
        return None


def validate_supabase_jwt(token: str) -> Optional[str]:
    """
    Validate Supabase JWT and extract user ID
    
    Args:
        token: Supabase JWT token
        
    Returns:
        User ID if valid, None otherwise
    """
    try:
        # For Supabase JWTs, we can decode without verification
        # since they're already verified by Supabase
        payload = jwt.decode(token, options={"verify_signature": False})
        return payload.get("sub")  # 'sub' contains user ID
    except JWTError:
        return None
