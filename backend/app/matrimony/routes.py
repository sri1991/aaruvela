import logging
import time
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File

from app.auth.dependencies import get_current_user_id, require_active_status
from app.db import get_supabase_client, run_query
from app.matrimony.models import MatrimonyProfileCreate, MatrimonyRenewRequest

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_IMAGE_SIZE = 3 * 1024 * 1024  # 3MB per photo (max 3 photos = 6MB total enforced client-side)

logger = logging.getLogger(__name__)
router = APIRouter()


def _now_utc() -> str:
    return datetime.now(timezone.utc).isoformat()


def _subscription_expiry() -> str:
    """30 days from now."""
    return (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()


def _is_subscription_active(profile: dict) -> bool:
    expires_at = profile.get("subscription_expires_at")
    if not expires_at:
        return False
    expiry = datetime.fromisoformat(expires_at.replace("Z", "+00:00"))
    if expiry.tzinfo is None:
        expiry = expiry.replace(tzinfo=timezone.utc)
    return expiry > datetime.now(timezone.utc)


@router.post("/upload-photo")
async def upload_photo(
    file: UploadFile = File(...),
    current_user: dict = Depends(require_active_status),
):
    """Upload a matrimony profile photo. Returns the public URL."""
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, or WebP images are allowed.")

    contents = await file.read()
    if len(contents) > MAX_IMAGE_SIZE:
        raise HTTPException(status_code=400, detail="Image must be under 5MB.")

    user_id = current_user["id"]
    ext = file.filename.rsplit(".", 1)[-1] if "." in file.filename else "jpg"
    file_path = f"matrimony/{user_id}/{int(time.time())}.{ext}"

    supabase = get_supabase_client()

    def _upload():
        return supabase.storage.from_("matrimony-photos").upload(
            file_path,
            contents,
            {"content-type": file.content_type, "upsert": "true"},
        )

    res = await run_query(_upload)
    if hasattr(res, "error") and res.error:
        raise HTTPException(status_code=500, detail="Failed to upload photo.")

    public_url = supabase.storage.from_("matrimony-photos").get_public_url(file_path)
    return {"url": public_url}


@router.post("/register")
async def create_profile(
    request: MatrimonyProfileCreate,
    current_user: dict = Depends(require_active_status),
):
    """
    Submit a 6000N Matrimony profile for yourself.
    Requires caller to be an ACTIVE member. Photo and payment reference are mandatory.
    """
    supabase = get_supabase_client()
    user_id = current_user["id"]

    # 1. One profile per member — no duplicates
    existing = await run_query(
        lambda: supabase.table("matrimony_profiles").select("id").eq("user_id", user_id).execute()
    )
    if existing.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already created a matrimony profile.",
        )

    # 2. Build profile data
    profile_data = request.model_dump(exclude_unset=True)
    if "dob" in profile_data and profile_data["dob"]:
        profile_data["dob"] = profile_data["dob"].isoformat()
    if "tob" in profile_data and profile_data["tob"]:
        profile_data["tob"] = profile_data["tob"].isoformat()
    # Keep photo_url in sync with first photo for backward compatibility
    if "photos" in profile_data and profile_data["photos"]:
        profile_data["photo_url"] = profile_data["photos"][0]

    profile_data["user_id"] = user_id
    profile_data["payment_status"] = "PENDING"
    profile_data["status"] = "ACTIVE"
    # subscription_expires_at stays NULL until admin verifies payment

    insert_res = await run_query(
        lambda: supabase.table("matrimony_profiles").insert(profile_data).execute()
    )

    profile_id = insert_res.data[0]["id"] if insert_res.data else "PENDING_VERIFICATION"
    logger.info("User %s submitted matrimony profile %s", user_id, profile_id)
    return {
        "message": "Profile created successfully. Pending admin approval.",
        "profile_id": profile_id
    }


@router.post("/renew")
async def renew_subscription(
    request: MatrimonyRenewRequest,
    current_user: dict = Depends(require_active_status),
):
    """
    Submit a renewal payment reference after the monthly subscription expires.
    Resets payment_status to PENDING for admin to re-verify.
    """
    supabase = get_supabase_client()
    user_id = current_user["id"]

    existing = await run_query(
        lambda: supabase.table("matrimony_profiles").select("id, payment_status, subscription_expires_at").eq("user_id", user_id).execute()
    )
    if not existing.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No matrimony profile found. Please register first.",
        )

    profile = existing.data[0]

    # Only allow renewal if subscription has expired or is within 7 days of expiry
    expires_at = profile.get("subscription_expires_at")
    if expires_at:
        expiry = datetime.fromisoformat(expires_at.replace("Z", "+00:00"))
        if expiry.tzinfo is None:
            expiry = expiry.replace(tzinfo=timezone.utc)
        days_left = (expiry - datetime.now(timezone.utc)).days
        if days_left > 7:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Your subscription is still active for {days_left} more days.",
            )

    await run_query(
        lambda: supabase.table("matrimony_profiles")
        .update({
            "payment_reference": request.payment_reference,
            "payment_status": "PENDING",
            "updated_at": _now_utc(),
        })
        .eq("user_id", user_id)
        .execute()
    )

    logger.info("User %s submitted renewal payment reference", user_id)
    return {"message": "Renewal payment submitted. Pending admin approval."}


@router.get("/me")
async def get_my_profile(current_user: dict = Depends(require_active_status)):
    """Fetch the logged-in user's matrimony profile."""
    supabase = get_supabase_client()
    user_id = current_user["id"]

    result = await run_query(
        lambda: supabase.table("matrimony_profiles").select("*").eq("user_id", user_id).execute()
    )

    if not result.data:
        return None

    return result.data[0]


@router.get("/matches")
async def get_matches(current_user: dict = Depends(require_active_status)):
    """
    Get relevant matches for the active user's profile.
    Requires a VERIFIED profile with an active (non-expired) subscription.
    """
    supabase = get_supabase_client()
    user_id = current_user["id"]

    my_profile_res = await run_query(
        lambda: supabase.table("matrimony_profiles")
        .select("gender, payment_status, status, subscription_expires_at")
        .eq("user_id", user_id)
        .execute()
    )

    if not my_profile_res.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You must create a matrimony profile first."
        )

    my_profile = my_profile_res.data[0]

    if my_profile["payment_status"] != "VERIFIED":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your profile is pending payment verification. You cannot view matches yet."
        )

    if not _is_subscription_active(my_profile):
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Your monthly subscription has expired. Please renew to continue viewing matches."
        )

    if my_profile["status"] != "ACTIVE":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your profile is inactive. Please contact support."
        )

    target_gender = "FEMALE" if my_profile["gender"] == "MALE" else "MALE"

    matches_res = await run_query(
        lambda: supabase.table("matrimony_profiles")
        .select("id, full_name, gender, age, gotram, star_with_pada, occupation, current_city, photo_url, photos, parishat_id")
        .eq("gender", target_gender)
        .eq("status", "ACTIVE")
        .eq("payment_status", "VERIFIED")
        .execute()
    )

    # Filter out expired subscriptions server-side
    active_matches = [m for m in (matches_res.data or []) if m.get("subscription_expires_at") is None or _is_subscription_active(m)]
    return active_matches


@router.get("/profile/{profile_id}")
async def get_match_profile(profile_id: str, current_user: dict = Depends(require_active_status)):
    """
    Get detailed breakdown of a match.
    Requires the viewer to have a verified, active subscription.
    """
    supabase = get_supabase_client()
    user_id = current_user["id"]

    my_profile_res = await run_query(
        lambda: supabase.table("matrimony_profiles")
        .select("payment_status, subscription_expires_at")
        .eq("user_id", user_id)
        .execute()
    )
    if not my_profile_res.data:
        raise HTTPException(status_code=403, detail="Not authorized to view full profiles.")

    my_profile = my_profile_res.data[0]
    if my_profile["payment_status"] != "VERIFIED" or not _is_subscription_active(my_profile):
        raise HTTPException(status_code=403, detail="Not authorized to view full profiles. Check your subscription status.")

    result = await run_query(
        lambda: supabase.table("matrimony_profiles").select("*").eq("id", profile_id).execute()
    )

    if not result.data:
        raise HTTPException(status_code=404, detail="Profile not found")

    return result.data[0]
