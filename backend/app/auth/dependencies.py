import logging
import secrets
from datetime import datetime, timezone
from typing import Optional
from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.auth.utils import decode_access_token
from app.config import settings
from app.db import get_supabase_client, run_query

PERPETUAL_ROLES = {"PERMANENT", "HEAD"}

logger = logging.getLogger(__name__)
security = HTTPBearer()
# Same as `security` but returns None instead of raising when no token is sent,
# for endpoints that accept either a user token or a machine credential.
optional_security = HTTPBearer(auto_error=False)


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


async def _fetch_user(user_id: str) -> dict:
    """Load the full user record, or 404."""
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


async def get_current_user(user_id: str = Depends(get_current_user_id)) -> dict:
    """
    Dependency: fetch full user record for the authenticated user.
    """
    return await _fetch_user(user_id)


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


async def require_admin_or_cron(
    x_cron_secret: Optional[str] = Header(None, alias="X-Cron-Secret"),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(optional_security),
) -> dict:
    """
    Dependency: allow either a HEAD user's token or the scheduled-job secret.

    Used by maintenance endpoints that a cron job calls unattended.
    """
    if x_cron_secret is not None:
        if not settings.cron_secret or not secrets.compare_digest(x_cron_secret, settings.cron_secret):
            logger.warning("Rejected cron request with an invalid X-Cron-Secret")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Invalid cron secret",
            )
        return {"id": None, "role": "CRON"}

    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_access_token(credentials.credentials)
    if not payload or not payload.get("sub"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = await _fetch_user(payload["sub"])
    return await require_role("HEAD", user)


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
