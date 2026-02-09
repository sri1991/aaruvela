from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
from app.auth.utils import validate_supabase_jwt
from app.db import get_supabase_client

security = HTTPBearer()


async def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> str:
    """
    Dependency to get current user ID from JWT token
    """
    token = credentials.credentials
    print(f"DEBUG: Validating token: {token[:10]}...")
    
    # Try decoding with our secret first (verified)
    from app.auth.utils import decode_access_token
    payload = decode_access_token(token)
    
    if payload:
        user_id = payload.get("sub")
        print(f"DEBUG: Token verified locally. User ID: {user_id}")
    else:
        # Fallback to unverified decode (compatibility with Supabase tokens if any)
        print(f"DEBUG: Local verification failed, trying unverified decode")
        user_id = validate_supabase_jwt(token)
        print(f"DEBUG: Unverified decode result: {user_id}")
    
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user_id


async def get_current_user(user_id: str = Depends(get_current_user_id)) -> dict:
    """
    Dependency to get current user data
    
    Args:
        user_id: User ID from token
        
    Returns:
        User data dictionary
        
    Raises:
        HTTPException: If user not found
    """
    supabase = get_supabase_client()
    
    result = supabase.table("users").select("*").eq("id", user_id).single().execute()
    
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return result.data


async def require_role(
    required_role: str,
    current_user: dict = Depends(get_current_user)
) -> dict:
    """
    Dependency to require a specific role
    
    Args:
        required_role: Required role (HEAD, PERMANENT, GENERAL)
        current_user: Current user data
        
    Returns:
        User data if role matches
        
    Raises:
        HTTPException: If user doesn't have required role
    """
    if current_user.get("role") != required_role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Requires {required_role} role"
        )
    
    return current_user


async def require_admin(current_user: dict = Depends(get_current_user)) -> dict:
    """
    Dependency to require HEAD (admin) role
    
    Args:
        current_user: Current user data
        
    Returns:
        User data if user is admin
        
    Raises:
        HTTPException: If user is not admin
    """
    return await require_role("HEAD", current_user)


async def require_active_status(current_user: dict = Depends(get_current_user)) -> dict:
    """
    Dependency to require ACTIVE status
    
    Args:
        current_user: Current user data
        
    Returns:
        User data if status is ACTIVE
        
    Raises:
        HTTPException: If user is not active
    """
    if current_user.get("status") != "ACTIVE":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is not active"
        )
    
    return current_user
