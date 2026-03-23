import logging
from datetime import datetime, date, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from app.auth.dependencies import require_admin
from app.db import get_supabase_client, run_query
from app.admin.models import MemberApprovalRequest, ManualMemberCreate
from app.auth.utils import hash_pin

# Membership registration fee by role (₹)
MEMBERSHIP_FEES = {
    "PERMANENT": 5000,
    "NORMAL":    100,
    "ASSOCIATED": 500,
}


async def _record_membership_fee(supabase, role: str, user_id: str, admin_id: str, member_id: str):
    """Insert an INCOME transaction for the registration fee on membership approval."""
    fee = MEMBERSHIP_FEES.get(role)
    if not fee:
        return
    await run_query(
        lambda: supabase.table("transactions").insert({
            "type":               "INCOME",
            "category":           "MEMBERSHIP_FEE",
            "amount":             fee,
            "description":        f"Registration fee — {member_id} ({role})",
            "reference_user_id":  user_id,
            "recorded_by":        admin_id,
            "transaction_date":   date.today().isoformat(),
        }).execute()
    )

logger = logging.getLogger(__name__)
router = APIRouter()

ROLE_PREFIXES = {
    "PERMANENT": "PID",
    "NORMAL": "NID",
    "ASSOCIATED": "AID",
}


def _now_utc() -> str:
    return datetime.now(timezone.utc).isoformat()


async def _generate_member_id(supabase, role: str) -> str:
    """
    Generate a human-readable member ID (e.g. PID-003).
    Derives the next number from the highest existing member_id with
    the same prefix, so gaps or out-of-order inserts never cause duplicates.
    """
    prefix = ROLE_PREFIXES.get(role, "GEN")
    result = await run_query(
        lambda: supabase.table("users")
        .select("member_id")
        .like("member_id", f"{prefix}-%")
        .execute()
    )
    max_num = 0
    for row in (result.data or []):
        mid = row.get("member_id", "")
        parts = mid.split("-")
        if len(parts) == 2 and parts[1].isdigit():
            max_num = max(max_num, int(parts[1]))
    return f"{prefix}-{max_num + 1:03d}"


@router.get("/pending-requests")
async def get_pending_requests(admin: dict = Depends(require_admin)):
    """List all pending membership applications (admin only)."""
    supabase = get_supabase_client()
    result = await run_query(
        lambda: supabase.table("membership_requests")
        .select("*, users(id, full_name, phone, identifier, role, status)")
        .eq("approval_status", "PENDING")
        .execute()
    )
    return result.data


@router.post("/approve-request")
async def approve_request(
    request: MemberApprovalRequest,
    admin: dict = Depends(require_admin),
):
    """
    Approve or reject a membership request by the membership request user_id.
    Assigns a unique member ID on approval.
    """
    supabase = get_supabase_client()

    if request.action == "REJECT":
        await run_query(
            lambda: supabase.table("membership_requests")
            .update({"approval_status": "REJECTED", "admin_notes": request.admin_notes})
            .eq("user_id", request.user_id)
            .eq("approval_status", "PENDING")
            .execute()
        )
        logger.info("Admin %s rejected request for user %s", admin["id"], request.user_id)
        return {"message": "Request rejected"}

    # Fetch the latest pending membership request for this user
    mr = await run_query(
        lambda: supabase.table("membership_requests")
        .select("id, requested_role")
        .eq("user_id", request.user_id)
        .eq("approval_status", "PENDING")
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )

    if not mr.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No pending membership request found")

    mr_id = mr.data[0]["id"]
    role = request.role or mr.data[0]["requested_role"]

    # Generate member ID
    new_member_id = await _generate_member_id(supabase, role)

    # Preserve HEAD role if user is already an admin
    current = await run_query(
        lambda: supabase.table("users").select("role").eq("id", request.user_id).single().execute()
    )
    final_role = "HEAD" if (current.data and current.data.get("role") == "HEAD") else role

    # Update user profile
    await run_query(
        lambda: supabase.table("users")
        .update({"role": final_role, "status": "ACTIVE", "member_id": new_member_id, "updated_at": _now_utc()})
        .eq("id", request.user_id)
        .execute()
    )

    # Update membership request by its own ID (not user_id) to avoid touching wrong rows
    await run_query(
        lambda: supabase.table("membership_requests")
        .update({"approval_status": "APPROVED", "admin_notes": request.admin_notes})
        .eq("id", mr_id)
        .execute()
    )

    # Auto-record registration fee in accounts
    await _record_membership_fee(supabase, final_role, request.user_id, admin["id"], new_member_id)

    logger.info("Admin %s approved user %s — role=%s member_id=%s", admin["id"], request.user_id, final_role, new_member_id)
    return {"message": "User approved successfully", "member_id": new_member_id, "role": final_role}


@router.post("/create-member")
async def create_manual_member(
    request: ManualMemberCreate,
    admin: dict = Depends(require_admin),
):
    """
    Directly create or upgrade a member (admin only).
    Assigns role and member ID immediately without going through the application flow.
    """
    supabase = get_supabase_client()

    # Check if user already exists
    user_check = await run_query(
        lambda: supabase.table("users").select("id, role").eq("phone", request.phone).execute()
    )

    if user_check.data:
        user_id = user_check.data[0]["id"]
        logger.info("Manual member creation: found existing user %s", user_id)
    else:
        # Create a new user shell with the default PIN (1234)
        hashed_pin = hash_pin("1234")
        clean_phone = "".join(filter(str.isdigit, request.phone))

        new_user = {
            "identifier": clean_phone,
            "phone": clean_phone,
            "pin_hash": hashed_pin,
            "role": "GENERAL",
            "status": "PENDING",
        }
        user_insert = await run_query(
            lambda: supabase.table("users").insert(new_user).execute()
        )
        if not user_insert.data:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create user")
        user_id = user_insert.data[0]["id"]
        logger.info("Manual member creation: created new user shell %s for phone %s", user_id, clean_phone)

    # Generate member ID
    new_member_id = await _generate_member_id(supabase, request.role)

    # Update / assign role
    update_data = {
        "full_name": request.full_name,
        "role": request.role,
        "status": "ACTIVE",
        "member_id": new_member_id,
        "updated_at": _now_utc(),
    }
    if request.zonal_committee:
        update_data["zonal_committee"] = request.zonal_committee
    if request.regional_committee:
        update_data["regional_committee"] = request.regional_committee

    await run_query(
        lambda: supabase.table("users").update(update_data).eq("id", user_id).execute()
    )

    # Create an audit record in membership_requests
    record = {
        "user_id": user_id,
        "requested_role": request.role,
        "application_data": update_data,
        "payment_status": "PAID",
        "approval_status": "APPROVED",
        "admin_notes": f"Manually added by admin {admin['id']}",
    }
    await run_query(lambda: supabase.table("membership_requests").insert(record).execute())

    # Auto-record registration fee in accounts
    await _record_membership_fee(supabase, request.role, user_id, admin["id"], new_member_id)

    logger.info("Admin %s manually created member %s (%s)", admin["id"], new_member_id, user_id)
    return {"message": "Member created successfully", "member_id": new_member_id, "user_id": user_id}
