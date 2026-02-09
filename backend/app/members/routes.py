from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from app.auth.dependencies import get_current_user_id, get_current_user
from app.db import get_supabase_client
from app.members.models import MembershipApplicationRequest, MembershipApplicationResponse, UserBioData
import json

router = APIRouter()

@router.post("/apply", response_model=MembershipApplicationResponse)
async def apply_membership(
    request: MembershipApplicationRequest,
    user_id: str = Depends(get_current_user_id)
):
    """
    Submit a membership application with detailed bio-data.
    """
    print(f"DEBUG: apply_membership called for user_id: {user_id}")
    supabase = get_supabase_client()
    
    try:
        # 1. Update user's bio-data in 'users' table
        # Use .json() to ensure date/time objects are converted to strings
        bio_data_json = request.bio_data.json(exclude_unset=True)
        bio_data_dict = json.loads(bio_data_json)
        print(f"DEBUG: Bio-data to process: {bio_data_dict}")
        
        # Split data: Profile fields go to 'users', application-only fields stay in 'membership_requests'
        profile_update_dict = bio_data_dict.copy()
        payment_proof = profile_update_dict.pop("payment_proof_url", None)
        
        print(f"DEBUG: Updating users table with: {profile_update_dict}")
        user_update = supabase.table("users").update(profile_update_dict).eq("id", user_id).execute()
        print(f"DEBUG: User update successful")
        
        if not user_update.data:
            print("DEBUG: User update returned no data")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update user profile"
            )
        
        # 2. Create membership request
        request_data = {
            "user_id": user_id,
            "requested_role": request.requested_role,
            "application_data": bio_data_dict,
            "payment_status": "EXEMPT",
            "approval_status": "PENDING"
        }
        print(f"DEBUG: Creating membership request: {request_data['requested_role']}")
        
        mr_insert = supabase.table("membership_requests").insert(request_data).execute()
        print(f"DEBUG: Membership request insert result status: {mr_insert.data is not None}")
        
        if not mr_insert.data:
            print("DEBUG: Membership request insert returned no data")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create membership request"
            )
        
        return MembershipApplicationResponse(
            message="Application submitted successfully. Waiting for admin approval.",
            application_id=mr_insert.data[0]["id"],
            status="PENDING"
        )
    except Exception as e:
        print(f"DEBUG: ERROR in apply_membership: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Application error: {str(e)}"
        )

@router.get("/status")
async def get_application_status(user_id: str = Depends(get_current_user_id)):
    """
    Get the status of the current user's membership application.
    """
    supabase = get_supabase_client()
    
    result = supabase.table("membership_requests") \
        .select("*") \
        .eq("user_id", user_id) \
        .order("created_at", desc=True) \
        .limit(1) \
        .execute()
    
    if not result.data:
        return {"status": "NONE", "message": "No application found"}
    
    return result.data[0]
