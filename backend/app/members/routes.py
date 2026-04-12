import logging
from fastapi import APIRouter, Depends, HTTPException, status
from app.auth.dependencies import get_current_user_id, require_active_status
from app.db import get_supabase_client, run_query
from app.members.models import MembershipApplicationRequest, MembershipApplicationResponse, RenewalRequest

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/apply", response_model=MembershipApplicationResponse)
async def apply_membership(
    request: MembershipApplicationRequest,
    user_id: str = Depends(get_current_user_id),
):
    """
    Submit a membership application with detailed bio-data.
    Updates the user's profile and creates a membership request record.
    """
    supabase = get_supabase_client()

    # Pydantic v2: use model_dump(mode='json') so date/time are serialized to strings
    bio_data_dict = request.bio_data.model_dump(mode="json", exclude_unset=True)

    # Separate profile fields from application-only fields
    profile_update = bio_data_dict.copy()
    profile_update.pop("payment_proof_url", None)

    # 1. Update user profile
    user_update = await run_query(
        lambda: supabase.table("users").update(profile_update).eq("id", user_id).execute()
    )

    if not user_update.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update user profile",
        )

    # 2. Create membership request
    request_data = {
        "user_id": user_id,
        "requested_role": request.requested_role,
        "application_data": bio_data_dict,
        "payment_status": "EXEMPT",
        "approval_status": "PENDING",
    }

    mr_insert = await run_query(
        lambda: supabase.table("membership_requests").insert(request_data).execute()
    )

    if not mr_insert.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create membership request",
        )

    logger.info("User %s submitted membership application for role %s", user_id, request.requested_role)
    return MembershipApplicationResponse(
        message="Application submitted successfully. Waiting for admin approval.",
        application_id=mr_insert.data[0]["id"],
        status="PENDING",
    )


@router.get("/active")
async def get_active_members():
    """Get all active members (public endpoint)."""
    supabase = get_supabase_client()
    result = await run_query(
        lambda: supabase.table("users")
        .select("id, full_name, member_id, role, photo_url, zonal_committee, regional_committee, phone")
        .eq("status", "ACTIVE")
        .neq("role", "HEAD")
        .order("member_id")
        .execute()
    )
    return result.data


@router.get("/profile/{member_user_id}")
async def get_member_profile(
    member_user_id: str,
    current_user: dict = Depends(require_active_status),
):
    """Get a specific active member's public profile. Requires caller to be an active member."""
    supabase = get_supabase_client()
    result = await run_query(
        lambda: supabase.table("users")
        .select("id, full_name, member_id, role, photo_url, zonal_committee, regional_committee, phone, gotram, occupation, joined_at")
        .eq("id", member_user_id)
        .eq("status", "ACTIVE")
        .neq("role", "HEAD")
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")
    return result.data


@router.post("/request-renewal")
async def request_renewal(
    request: RenewalRequest,
    current_user: dict = Depends(get_current_user_id),
):
    """
    Submit an annual membership renewal request with UPI payment reference.
    Admin will verify payment and approve.
    """
    supabase = get_supabase_client()
    user_id = current_user if isinstance(current_user, str) else current_user["id"]

    # Check current role
    user_res = await run_query(
        lambda: supabase.table("users").select("role, member_id").eq("id", user_id).limit(1).execute()
    )
    if not user_res.data:
        raise HTTPException(status_code=404, detail="User not found")

    user_data = user_res.data[0]
    role = user_data.get("role")

    if role in ("PERMANENT", "HEAD"):
        raise HTTPException(status_code=400, detail="Permanent members do not require annual renewal.")

    # Check no duplicate pending renewal
    existing = await run_query(
        lambda: supabase.table("membership_requests")
        .select("id")
        .eq("user_id", user_id)
        .eq("request_type", "RENEWAL")
        .eq("approval_status", "PENDING")
        .execute()
    )
    if existing.data:
        raise HTTPException(status_code=400, detail="You already have a pending renewal request.")

    record = {
        "user_id": user_id,
        "requested_role": role,
        "request_type": "RENEWAL",
        "payment_reference": request.payment_reference,
        "payment_status": "PAID",
        "approval_status": "PENDING",
        "admin_notes": f"Annual renewal — UTR: {request.payment_reference}",
    }
    result = await run_query(lambda: supabase.table("membership_requests").insert(record).execute())

    logger.info("User %s submitted membership renewal request", user_id)
    return {"message": "Renewal request submitted. Admin will verify and approve.", "request_id": result.data[0]["id"]}


@router.get("/renewal-status")
async def get_renewal_status(user_id: str = Depends(get_current_user_id)):
    """Return this member's membership expiry date and any pending renewal request."""
    supabase = get_supabase_client()

    user_res = await run_query(
        lambda: supabase.table("users")
        .select("role, membership_expires_at")
        .eq("id", user_id)
        .limit(1)
        .execute()
    )
    if not user_res.data:
        raise HTTPException(status_code=404, detail="User not found")

    user_data = user_res.data[0]

    pending_res = await run_query(
        lambda: supabase.table("membership_requests")
        .select("id, approval_status, created_at")
        .eq("user_id", user_id)
        .eq("request_type", "RENEWAL")
        .eq("approval_status", "PENDING")
        .limit(1)
        .execute()
    )

    return {
        "role": user_data.get("role"),
        "membership_expires_at": user_data.get("membership_expires_at"),
        "pending_renewal": pending_res.data[0] if pending_res.data else None,
    }


@router.get("/status")
async def get_application_status(user_id: str = Depends(get_current_user_id)):
    """Get the status of the current user's most recent membership application."""
    supabase = get_supabase_client()

    result = await run_query(
        lambda: supabase.table("membership_requests")
        .select("id, requested_role, application_data, approval_status, payment_status, admin_notes, created_at")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )

    if not result.data:
        return {"status": "NONE", "message": "No application found"}

    return result.data[0]
