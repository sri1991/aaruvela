import logging
from datetime import datetime, timezone
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.auth.utils import decode_access_token
from app.db import get_supabase_client, run_query

PERPETUAL_ROLES = {"PERMANENT", "HEAD"}

logger = logging.getLogger(__name__)
security = HTTPBearer()


async def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> str:
    """
    Dependency: extract and verify user ID from a signed JWT.
    Only tokens issued by this backend (signed with JWT_SECRET) are accepted.
    """
    token = credentials.credentials
    payload = decode_access_token(token)

    if not payload:
        logger.warning("Token verification failed for incoming request")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing subject claim",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user_id


async def get_current_user(user_id: str = Depends(get_current_user_id)) -> dict:
    """
    Dependency: fetch full user record for the authenticated user.
    """
    supabase = get_supabase_client()
    result = await run_query(
        lambda: supabase.table("users")
        .select("id, identifier, full_name, role, status, member_id, membership_expires_at, locked_until, failed_login_attempts, joined_at, created_at")
        .eq("id", user_id)
        .limit(1)
        .execute()
    )

    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return result.data[0]


async def require_role(required_role: str, current_user: dict = Depends(get_current_user)) -> dict:
    """
    Dependency: enforce a specific role.
    """
    if current_user.get("role") != required_role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Requires {required_role} role",
        )
    return current_user


async def require_admin(current_user: dict = Depends(get_current_user)) -> dict:
    """Dependency: require HEAD (admin) role."""
    return await require_role("HEAD", current_user)


async def require_active_status(current_user: dict = Depends(get_current_user)) -> dict:
    """Dependency: require ACTIVE account status and non-expired membership."""
    if current_user.get("status") != "ACTIVE":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is not active",
        )
    # Permanent and HEAD members never expire
    if current_user.get("role") not in PERPETUAL_ROLES:
        expires_at = current_user.get("membership_expires_at")
        if expires_at:
            expiry = datetime.fromisoformat(expires_at.replace("Z", "+00:00"))
            if expiry.tzinfo is None:
                expiry = expiry.replace(tzinfo=timezone.utc)
            if expiry < datetime.now(timezone.utc):
                raise HTTPException(
                    status_code=status.HTTP_402_PAYMENT_REQUIRED,
                    detail="Membership expired. Please renew your annual membership.",
                )
    return current_user
