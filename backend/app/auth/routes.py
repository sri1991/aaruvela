from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime, timedelta
from app.auth.models import (
    SetPINRequest,
    VerifyPINRequest,
    UnlockAccountRequest,
    RegisterRequest,
    LoginRequest,
    AuthResponse,
    MessageResponse
)
from app.auth.utils import hash_pin, verify_pin, create_access_token
from app.auth.dependencies import get_current_user_id, require_admin
from app.db import get_supabase_client
from slowapi import Limiter
from slowapi.util import get_remote_address

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)

# Rate limit configuration
MAX_LOGIN_ATTEMPTS = 5
LOCKOUT_DURATION_MINUTES = 30


@router.post("/register", response_model=AuthResponse)
async def register(request: RegisterRequest):
    """
    Register a new user with phone and PIN
    
    - Creates user in Supabase Auth (using phone as identifier)
    - Sets PIN immediately during registration
    - Creates corresponding profile in users table
    - Returns authentication token (auto-login)
    """
    supabase = get_supabase_client()
    
    try:
        # Normalize phone number (keep only digits)
        clean_phone = "".join(filter(str.isdigit, request.phone))
        
        # Use a more standard domain for Supabase internal mapping
        internal_email = f"{clean_phone}@community.app"
        
        # Generate a secure random password for Supabase Auth (user won't use this)
        import secrets
        import string
        random_password = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(12))
        print(f"DEBUG: Generated password: '{random_password}' (length: {len(random_password)})")
        
        # 1. Create user using Admin API (bypasses rate limits and vimification)
        auth_response = supabase.auth.admin.create_user({
            "email": internal_email,
            "password": random_password,
            "email_confirm": True,
            "user_metadata": {
                "full_name": request.full_name,
                "phone": request.phone
            }
        })
        
        if not auth_response.user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Registration failed"
            )
        
        # 2. Hash and store PIN
        print(f"DEBUG: Hashing PIN: '{request.pin}' (length: {len(request.pin)})")
        hashed_pin = hash_pin(request.pin)
            
        # 3. Create profile in 'users' table with PIN
        user_data = {
            "id": auth_response.user.id,
            "identifier": clean_phone,
            "full_name": request.full_name,
            "phone": clean_phone,
            "pin_hash": hashed_pin,
            "role": "GENERAL",
            "status": "PENDING",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        # Check if profile already exists
        profile_check = supabase.table("users").select("id").eq("id", auth_response.user.id).execute()
        
        if not profile_check.data:
            supabase.table("users").insert(user_data).execute()
        
        # 4. Create access token for auto-login
        access_token = create_access_token(
            data={
                "sub": auth_response.user.id,
                "identifier": clean_phone,
                "role": "GENERAL",
                "status": "PENDING"
            }
        )
        
        return AuthResponse(
            access_token=access_token,
            token_type="bearer",
            user_id=auth_response.user.id,
            identifier=clean_phone,
            role="GENERAL",
            status="PENDING"
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )




@router.post("/login", response_model=AuthResponse)
async def login(request: LoginRequest):
    """
    Login with phone and PIN
    
    - Verifies PIN from database
    - Handles account lockout after failed attempts
    - Returns access token on success
    """
    supabase = get_supabase_client()
    
    try:
        # Normalize phone number (keep only digits)
        clean_phone = "".join(filter(str.isdigit, request.phone))
        
        # Get user profile from database
        result = supabase.table("users").select("*").eq("identifier", clean_phone).single().execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )
            
        user = result.data
        
        # Check if account is locked
        if user.get("locked_until"):
            locked_until = datetime.fromisoformat(user["locked_until"].replace("Z", "+00:00"))
            if locked_until > datetime.utcnow():
                raise HTTPException(
                    status_code=status.HTTP_423_LOCKED,
                    detail=f"Account is locked until {locked_until.isoformat()}"
                )
            else:
                # Unlock if lockout period has passed
                supabase.table("users").update({
                    "locked_until": None,
                    "failed_login_attempts": 0
                }).eq("id", user["id"]).execute()
        
        # Verify PIN
        if not user.get("pin_hash"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="PIN not set for this account"
            )
        
        if not verify_pin(request.pin, user["pin_hash"]):
            # Increment failed attempts
            failed_attempts = user.get("failed_login_attempts", 0) + 1
            
            update_data = {
                "failed_login_attempts": failed_attempts,
                "updated_at": datetime.utcnow().isoformat()
            }
            
            # Lock account after MAX_LOGIN_ATTEMPTS
            if failed_attempts >= MAX_LOGIN_ATTEMPTS:
                lockout_until = datetime.utcnow() + timedelta(minutes=LOCKOUT_DURATION_MINUTES)
                update_data["locked_until"] = lockout_until.isoformat()
                
                supabase.table("users").update(update_data).eq("id", user["id"]).execute()
                
                raise HTTPException(
                    status_code=status.HTTP_423_LOCKED,
                    detail=f"Account locked due to too many failed attempts. Try again after {LOCKOUT_DURATION_MINUTES} minutes."
                )
            
            supabase.table("users").update(update_data).eq("id", user["id"]).execute()
            
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid PIN. {MAX_LOGIN_ATTEMPTS - failed_attempts} attempts remaining."
            )
        
        # Reset failed attempts on successful login
        supabase.table("users").update({
            "failed_login_attempts": 0,
            "updated_at": datetime.utcnow().isoformat()
        }).eq("id", user["id"]).execute()
        
        # Create access token
        access_token = create_access_token(
            data={
                "sub": user["id"],
                "identifier": user["identifier"],
                "role": user.get("role"),
                "status": user["status"]
            }
        )
        
        return AuthResponse(
            access_token=access_token,
            token_type="bearer",
            user_id=user["id"],
            identifier=user["identifier"],
            role=user.get("role"),
            status=user["status"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )


@router.post("/set-pin", response_model=MessageResponse)
async def set_pin(
    request: SetPINRequest,
    user_id: str = Depends(get_current_user_id)
):
    """
    Set or update a user's 4-digit PIN
    
    - Requires valid JWT token
    - PIN must be exactly 4 digits
    - PIN is hashed with bcrypt before storage
    """
    supabase = get_supabase_client()
    
    # Hash the PIN
    hashed_pin = hash_pin(request.pin)
    
    # Update user record
    result = supabase.table("users").update({
        "pin_hash": hashed_pin,
        "updated_at": datetime.utcnow().isoformat()
    }).eq("id", user_id).execute()
    
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return MessageResponse(message="PIN set successfully")


@router.post("/verify-pin", response_model=AuthResponse)
async def verify_pin_endpoint(request: VerifyPINRequest):
    """
    Verify user PIN and create session
    
    - Rate limited to 5 attempts per minute
    - Account locks after 5 failed attempts
    - Returns JWT token on success
    """
    supabase = get_supabase_client()
    
    # Normalize identifier (keep only digits)
    clean_identifier = "".join(filter(str.isdigit, request.identifier))
    
    # Get user by identifier
    result = supabase.table("users").select("*").eq("identifier", clean_identifier).single().execute()
    
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    user = result.data
    
    # Check if account is locked
    if user.get("locked_until"):
        locked_until = datetime.fromisoformat(user["locked_until"].replace("Z", "+00:00"))
        if locked_until > datetime.utcnow():
            raise HTTPException(
                status_code=status.HTTP_423_LOCKED,
                detail=f"Account is locked until {locked_until.isoformat()}"
            )
        else:
            # Unlock if lockout period has passed
            supabase.table("users").update({
                "locked_until": None,
                "failed_login_attempts": 0
            }).eq("id", user["id"]).execute()
    
    # Verify PIN
    if not user.get("pin_hash"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="PIN not set for this account"
        )
    
    if not verify_pin(request.pin, user["pin_hash"]):
        # Increment failed attempts
        failed_attempts = user.get("failed_login_attempts", 0) + 1
        
        update_data = {
            "failed_login_attempts": failed_attempts,
            "updated_at": datetime.utcnow().isoformat()
        }
        
        # Lock account if max attempts reached
        if failed_attempts >= MAX_LOGIN_ATTEMPTS:
            lockout_until = datetime.utcnow() + timedelta(minutes=LOCKOUT_DURATION_MINUTES)
            update_data["locked_until"] = lockout_until.isoformat()
        
        supabase.table("users").update(update_data).eq("id", user["id"]).execute()
        
        remaining_attempts = MAX_LOGIN_ATTEMPTS - failed_attempts
        if remaining_attempts > 0:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid PIN. {remaining_attempts} attempts remaining."
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_423_LOCKED,
                detail=f"Account locked for {LOCKOUT_DURATION_MINUTES} minutes due to too many failed attempts"
            )
    
    # PIN verified successfully - reset failed attempts
    supabase.table("users").update({
        "failed_login_attempts": 0,
        "locked_until": None,
        "updated_at": datetime.utcnow().isoformat()
    }).eq("id", user["id"]).execute()
    
    # Create access token
    access_token = create_access_token(
        data={
            "sub": user["id"],
            "identifier": user["identifier"],
            "role": user.get("role"),
            "status": user["status"]
        }
    )
    
    return AuthResponse(
        access_token=access_token,
        token_type="bearer",
        user_id=user["id"],
        identifier=user["identifier"],
        role=user.get("role"),
        status=user["status"]
    )


@router.post("/unlock-account", response_model=MessageResponse)
async def unlock_account(
    request: UnlockAccountRequest,
    admin_user: dict = Depends(require_admin)
):
    """
    Unlock a locked user account (admin only)
    
    - Requires HEAD role
    - Resets failed login attempts
    - Removes lockout
    """
    supabase = get_supabase_client()
    
    result = supabase.table("users").update({
        "failed_login_attempts": 0,
        "locked_until": None,
        "updated_at": datetime.utcnow().isoformat()
    }).eq("id", request.user_id).execute()
    
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return MessageResponse(message=f"Account unlocked successfully")


@router.get("/me")
async def get_current_user_info(user_id: str = Depends(get_current_user_id)):
    """
    Get current user information
    
    - Requires valid JWT token
    - Returns user profile data
    """
    supabase = get_supabase_client()
    
    result = supabase.table("users").select("id, identifier, role, status, joined_at, created_at").eq("id", user_id).single().execute()
    
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return result.data
