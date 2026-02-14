from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from app.auth.dependencies import require_admin
from app.db import get_supabase_client
from app.admin.models import MemberApprovalRequest, ManualMemberCreate

router = APIRouter()

@router.get("/pending-requests")
async def get_pending_requests(admin: dict = Depends(require_admin)):
    """
    List all pending membership applications.
    """
    supabase = get_supabase_client()
    result = supabase.table("membership_requests") \
        .select("*, users(*)") \
        .eq("approval_status", "PENDING") \
        .execute()
    return result.data

@router.post("/approve-request")
async def approve_request(
    request: MemberApprovalRequest,
    admin: dict = Depends(require_admin)
):
    """
    Approve or Reject a membership request and assign a membership ID.
    """
    try:
        supabase = get_supabase_client()
        print(f"DEBUG: approve_request called for user_id: {request.user_id}, action: {request.action}")
        
        if request.action == "REJECT":
            print(f"DEBUG: Rejecting request for user {request.user_id}")
            supabase.table("membership_requests") \
                .update({"approval_status": "REJECTED", "admin_notes": request.admin_notes}) \
                .eq("user_id", request.user_id) \
                .execute()
            return {"message": "Request rejected"}

        # 1. Get the requested role if not provided in request
        print(f"DEBUG: Fetching membership request for user {request.user_id}")
        mr = supabase.table("membership_requests") \
            .select("requested_role") \
            .eq("user_id", request.user_id) \
            .order("created_at", desc=True) \
            .limit(1) \
            .execute()
        
        if not mr.data:
            print(f"DEBUG: No membership request found for user {request.user_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Membership request not found"
            )
        
        role = request.role or mr.data[0]["requested_role"]
        print(f"DEBUG: Role to assign: {role}")
        
        # 2. Generate Member ID (PID, NID, AID)
        prefixes = {
            "PERMANENT": "PID",
            "NORMAL": "NID",
            "ASSOCIATED": "AID"
        }
        prefix = prefixes.get(role, "GEN")
        
        # Count existing members with this role to get next number
        print(f"DEBUG: Counting existing members for role {role}")
        count_result = supabase.table("users") \
            .select("id", count="exact") \
            .eq("role", role) \
            .execute()
        
        next_num = (count_result.count or 0) + 1
        new_member_id = f"{prefix}-{next_num:03d}"
        print(f"DEBUG: Generated Member ID: {new_member_id}")
        
        # 3. Update User Status and Role (Preserve HEAD role if already admin)
        print(f"DEBUG: Checking current role for user {request.user_id}")
        current_user_data = supabase.table("users").select("role").eq("id", request.user_id).single().execute()
        
        final_role = role
        if current_user_data.data and current_user_data.data.get("role") == "HEAD":
            print(f"DEBUG: User is already HEAD, preserving admin status")
            final_role = "HEAD"

        print(f"DEBUG: Updating user {request.user_id} profile to root role: {final_role}")
        user_update = supabase.table("users").update({
            "role": final_role,
            "status": "ACTIVE",
            "member_id": new_member_id
        }).eq("id", request.user_id).execute()
        
        # 4. Update Request Status
        print(f"DEBUG: Updating membership_requests status to APPROVED")
        supabase.table("membership_requests").update({
            "approval_status": "APPROVED",
            "admin_notes": request.admin_notes
        }).eq("user_id", request.user_id).execute()
        
        print(f"DEBUG: Approval successful")
        return {
            "message": "User approved successfully",
            "member_id": new_member_id,
            "role": role
        }
    except Exception as e:
        print(f"DEBUG: ERROR in approve_request: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Approval error: {str(e)}"
        )
@router.post("/create-member")
async def create_manual_member(
    request: ManualMemberCreate,
    admin: dict = Depends(require_admin)
):
    """
    Directly create a member. If user doesn't exist, create one.
    Assign role and member ID immediately.
    """
    try:
        supabase = get_supabase_client()
        
        # 1. Ensure user exists (check by phone)
        # For manual creation, we use phone as identifier
        user_check = supabase.table("users").select("*").eq("phone", request.phone).execute()
        
        user_id = None
        if user_check.data:
            user_id = user_check.data[0]["id"]
            print(f"DEBUG: Found existing user {user_id} for phone {request.phone}")
        else:
            # Create new user shell
            print(f"DEBUG: Creating new user shell for phone {request.phone}")
            new_user = {
                "identifier": request.phone,
                "phone": request.phone,
                "pin": "1234", # Default PIN for manual adds
                "role": "PENDING",
                "status": "INACTIVE"
            }
            user_insert = supabase.table("users").insert(new_user).execute()
            if not user_insert.data:
                raise Exception("Failed to create user shell")
            user_id = user_insert.data[0]["id"]

        # 2. Generate Member ID (Reuse logic or keep it simple)
        prefixes = {"PERMANENT": "PID", "NORMAL": "NID", "ASSOCIATED": "AID"}
        prefix = prefixes.get(request.role, "GEN")
        
        count_result = supabase.table("users").select("id", count="exact").eq("role", request.role).execute()
        next_num = (count_result.count or 0) + 1
        new_member_id = f"{prefix}-{next_num:03d}"

        # 3. Update User profile
        update_data = {
            "full_name": request.full_name,
            "role": request.role,
            "status": "ACTIVE",
            "member_id": new_member_id,
            "zonal_committee": request.zonal_committee,
            "regional_committee": request.regional_committee
        }
        supabase.table("users").update(update_data).eq("id", user_id).execute()

        # 4. Create an entry in membership_requests just for the records
        request_record = {
            "user_id": user_id,
            "requested_role": request.role,
            "application_data": update_data,
            "payment_status": "PAID",
            "approval_status": "APPROVED",
            "admin_notes": "Manually added by Admin"
        }
        supabase.table("membership_requests").insert(request_record).execute()

        return {
            "message": "Member created successfully",
            "member_id": new_member_id,
            "user_id": user_id
        }

    except Exception as e:
        print(f"DEBUG: ERROR in create_manual_member: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Manual creation error: {str(e)}"
        )
