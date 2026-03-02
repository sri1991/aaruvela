import logging
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, HTTPException, Request, status, Depends
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.auth.models import (
    SetPINRequest,
    VerifyPINRequest,
    UnlockAccountRequest,
    RegisterRequest,
    LoginRequest,
    AuthResponse,
    MessageResponse,
    UpdateProfileRequest,
)
from app.auth.utils import hash_pin, verify_pin, create_access_token, generate_random_password
from app.auth.dependencies import get_current_user_id, require_admin
from app.db import get_supabase_client, run_query

logger = logging.getLogger(__name__)
router = APIRouter()
limiter = Limiter(key_func=get_remote_address)

# Account lockout configuration
MAX_LOGIN_ATTEMPTS = 5
LOCKOUT_DURATION_MINUTES = 30


# ---------------------------------------------------------------------------
# Shared helpers
# ---------------------------------------------------------------------------

def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


async def _authenticate_user(identifier: str, pin: str) -> dict:
    """
    Shared authentication logic used by /login and /verify-pin.

    1. Looks up user by identifier (digits-only phone).
    2. Checks account lockout.
    3. Verifies PIN.
    4. Resets / increments failed attempt counter.
    5. Returns the user record on success.

    Raises HTTPException on any auth failure.
    """
    supabase = get_supabase_client()

    result = await run_query(
        lambda: supabase.table("users")
        .select("id, identifier, role, status, pin_hash, failed_login_attempts, locked_until")
        .eq("identifier", identifier)
        .single()
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    user = result.data

    # --- Lockout check ---
    if user.get("locked_until"):
        locked_until = datetime.fromisoformat(user["locked_until"].replace("Z", "+00:00"))
        if locked_until > _now_utc():
            raise HTTPException(
                status_code=status.HTTP_423_LOCKED,
                detail=f"Account locked until {locked_until.isoformat()}",
            )
        # Lockout expired — reset
        await run_query(
            lambda: supabase.table("users")
            .update({"locked_until": None, "failed_login_attempts": 0})
            .eq("id", user["id"])
            .execute()
        )

    # --- PIN check ---
    if not user.get("pin_hash"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="PIN not set for this account")

    if not verify_pin(pin, user["pin_hash"]):
        failed = user.get("failed_login_attempts", 0) + 1
        update = {"failed_login_attempts": failed, "updated_at": _now_utc().isoformat()}

        if failed >= MAX_LOGIN_ATTEMPTS:
            lockout_until = _now_utc() + timedelta(minutes=LOCKOUT_DURATION_MINUTES)
            update["locked_until"] = lockout_until.isoformat()
            await run_query(lambda: supabase.table("users").update(update).eq("id", user["id"]).execute())
            raise HTTPException(
                status_code=status.HTTP_423_LOCKED,
                detail=f"Account locked for {LOCKOUT_DURATION_MINUTES} minutes due to too many failed attempts.",
            )

        await run_query(lambda: supabase.table("users").update(update).eq("id", user["id"]).execute())
        remaining = MAX_LOGIN_ATTEMPTS - failed
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid PIN. {remaining} attempt(s) remaining.",
        )

    # --- Success: reset counters ---
    await run_query(
        lambda: supabase.table("users")
        .update({"failed_login_attempts": 0, "locked_until": None, "updated_at": _now_utc().isoformat()})
        .eq("id", user["id"])
        .execute()
    )
    return user


def _build_token(user: dict) -> str:
    return create_access_token(
        data={
            "sub": user["id"],
            "identifier": user["identifier"],
            "role": user.get("role"),
            "status": user["status"],
        }
    )


def _auth_response(user: dict) -> AuthResponse:
    return AuthResponse(
        access_token=_build_token(user),
        token_type="bearer",
        user_id=user["id"],
        identifier=user["identifier"],
        role=user.get("role"),
        status=user["status"],
    )


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.post("/register", response_model=AuthResponse)
async def register(request: RegisterRequest):
    """
    Register a new user with phone and PIN.
    Creates user in Supabase Auth, hashes PIN, inserts profile, returns token.
    """
    supabase = get_supabase_client()
    clean_phone = "".join(filter(str.isdigit, request.phone))
    internal_email = f"{clean_phone}@community.app"
    random_password = generate_random_password()

    try:
        auth_response = await run_query(
            lambda: supabase.auth.admin.create_user({
                "email": internal_email,
                "password": random_password,
                "email_confirm": True,
                "user_metadata": {"full_name": request.full_name, "phone": request.phone},
            })
        )
    except Exception as exc:
        error_msg = str(exc)
        logger.error("Supabase create_user failed: %s", error_msg)
        # Return the actual Supabase error so it's debuggable
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Registration failed: {error_msg}"
        )

    if not auth_response.user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Registration failed")

    hashed_pin = hash_pin(request.pin)
    user_id = auth_response.user.id
    now = _now_utc().isoformat()

    user_data = {
        "id": user_id,
        "identifier": clean_phone,
        "full_name": request.full_name,
        "phone": clean_phone,
        "pin_hash": hashed_pin,
        "role": "GENERAL",
        "status": "PENDING",
        "created_at": now,
        "updated_at": now,
    }

    # Insert profile only if it doesn't already exist
    profile_check = await run_query(
        lambda: supabase.table("users").select("id").eq("id", user_id).execute()
    )
    if not profile_check.data:
        await run_query(lambda: supabase.table("users").insert(user_data).execute())

    user_record = {**user_data, "id": user_id}
    logger.info("New user registered: %s", clean_phone)
    return _auth_response(user_record)


@router.post("/login", response_model=AuthResponse)
@limiter.limit("10/minute")
async def login(request: Request, body: LoginRequest):
    """Login with phone number and PIN."""
    clean_phone = "".join(filter(str.isdigit, body.phone))
    user = await _authenticate_user(clean_phone, body.pin)
    return _auth_response(user)


@router.post("/verify-pin", response_model=AuthResponse)
@limiter.limit("10/minute")
async def verify_pin_endpoint(request: Request, body: VerifyPINRequest):
    """Verify PIN and return a session token."""
    clean_identifier = "".join(filter(str.isdigit, body.identifier))
    user = await _authenticate_user(clean_identifier, body.pin)
    return _auth_response(user)


@router.post("/set-pin", response_model=MessageResponse)
async def set_pin(
    request: SetPINRequest,
    user_id: str = Depends(get_current_user_id),
):
    """Set or update the current user's 4-digit PIN."""
    supabase = get_supabase_client()
    hashed_pin = hash_pin(request.pin)

    result = await run_query(
        lambda: supabase.table("users")
        .update({"pin_hash": hashed_pin, "updated_at": _now_utc().isoformat()})
        .eq("id", user_id)
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    logger.info("PIN updated for user %s", user_id)
    return MessageResponse(message="PIN set successfully")


@router.post("/unlock-account", response_model=MessageResponse)
async def unlock_account(
    request: UnlockAccountRequest,
    admin_user: dict = Depends(require_admin),
):
    """Unlock a locked user account (HEAD admin only)."""
    supabase = get_supabase_client()

    result = await run_query(
        lambda: supabase.table("users")
        .update({"failed_login_attempts": 0, "locked_until": None, "updated_at": _now_utc().isoformat()})
        .eq("id", request.user_id)
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    logger.info("Account unlocked by admin %s for user %s", admin_user["id"], request.user_id)
    return MessageResponse(message="Account unlocked successfully")


@router.get("/me")
async def get_current_user_info(user_id: str = Depends(get_current_user_id)):
    """Get public profile of the currently authenticated user."""
    supabase = get_supabase_client()

    result = await run_query(
        lambda: supabase.table("users")
        .select("id, identifier, phone, full_name, role, status, member_id, joined_at, created_at, cell_no, email, regional_committee, zonal_committee, photo_url, occupation, address, dob")
        .eq("id", user_id)
        .single()
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return result.data


@router.put("/me")
async def update_current_user_info(
    request: UpdateProfileRequest,
    user_id: str = Depends(get_current_user_id)
):
    """Allow current user to update permitted profile fields."""
    supabase = get_supabase_client()
    
    update_data = request.model_dump(exclude_unset=True)
    if not update_data:
        return {"message": "No fields to update"}
        
    update_data["updated_at"] = _now_utc().isoformat()
    
    result = await run_query(
        lambda: supabase.table("users")
        .update(update_data)
        .eq("id", user_id)
        .execute()
    )
    
    if not result.data:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update profile")
        
    return {"message": "Profile updated successfully"}
