import logging
from datetime import date, datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request, status
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.auth.dependencies import require_admin
from app.db import get_supabase_client, run_query
from app.donations.models import (
    DonationCreate,
    DonationVerifyRequest,
    DonationRejectRequest,
)

logger = logging.getLogger(__name__)
router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


@router.post("", status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
async def submit_donation(request: Request, payload: DonationCreate):
    """
    Public endpoint: a donor submits their donation details after paying via UPI.
    The donation enters PENDING state and is finalised by an admin who verifies
    the UPI payment reference (UTR) against the bank statement.
    """
    supabase = get_supabase_client()

    existing = await run_query(
        lambda: supabase.table("donations")
        .select("id")
        .eq("payment_reference", payload.payment_reference)
        .limit(1)
        .execute()
    )
    if existing.data:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This payment reference has already been submitted.",
        )

    data = {
        "donor_name":        payload.donor_name,
        "phone":             payload.phone,
        "place":             payload.place,
        "amount":            payload.amount,
        "payment_reference": payload.payment_reference,
        "status":            "PENDING",
    }
    result = await run_query(
        lambda: supabase.table("donations").insert(data).execute()
    )
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to record donation")

    donation = result.data[0]
    logger.info(
        "Donation submitted: id=%s ₹%.2f ref=%s",
        donation["id"], payload.amount, payload.payment_reference,
    )
    # Do not echo internal fields back to the public caller.
    return {
        "id": donation["id"],
        "status": donation["status"],
        "message": "Donation recorded. An admin will verify the payment shortly.",
    }


@router.get("")
async def list_donations(
    status_filter: Optional[str] = None,
    admin: dict = Depends(require_admin),
):
    """Admin: list donations, optionally filtered by status."""
    supabase = get_supabase_client()
    if status_filter and status_filter not in {"PENDING", "VERIFIED", "REJECTED"}:
        raise HTTPException(status_code=400, detail="Invalid status filter")

    query = supabase.table("donations").select("*").order("created_at", desc=True)
    if status_filter:
        query = query.eq("status", status_filter)

    result = await run_query(lambda: query.execute())
    return result.data


@router.post("/{donation_id}/verify")
async def verify_donation(
    donation_id: str,
    payload: DonationVerifyRequest,
    admin: dict = Depends(require_admin),
):
    """
    Admin: verify a pending donation. Records an INCOME transaction in the
    ledger and links it back to the donation row.
    """
    supabase = get_supabase_client()

    donation_res = await run_query(
        lambda: supabase.table("donations")
        .select("id, donor_name, amount, payment_reference, status")
        .eq("id", donation_id)
        .single()
        .execute()
    )
    if not donation_res.data:
        raise HTTPException(status_code=404, detail="Donation not found")

    donation = donation_res.data
    if donation["status"] != "PENDING":
        raise HTTPException(
            status_code=400,
            detail=f"Donation is already {donation['status']}",
        )

    tx_res = await run_query(
        lambda: supabase.table("transactions").insert({
            "type":             "INCOME",
            "category":         "DONATION",
            "amount":           donation["amount"],
            "description":      f"Donation from {donation['donor_name']} (UTR {donation['payment_reference']})",
            "recorded_by":      admin["id"],
            "transaction_date": date.today().isoformat(),
        }).execute()
    )
    transaction_id = tx_res.data[0]["id"] if tx_res.data else None

    update = {
        "status":         "VERIFIED",
        "admin_notes":    payload.admin_notes,
        "verified_by":    admin["id"],
        "verified_at":    datetime.now(timezone.utc).isoformat(),
        "transaction_id": transaction_id,
    }
    await run_query(
        lambda: supabase.table("donations").update(update).eq("id", donation_id).execute()
    )

    logger.info(
        "Admin %s verified donation %s (₹%.2f, tx %s)",
        admin["id"], donation_id, donation["amount"], transaction_id,
    )
    return {"message": "Donation verified.", "transaction_id": transaction_id}


@router.post("/{donation_id}/reject")
async def reject_donation(
    donation_id: str,
    payload: DonationRejectRequest,
    admin: dict = Depends(require_admin),
):
    """Admin: reject a pending donation (e.g. UTR not found in bank statement)."""
    supabase = get_supabase_client()

    donation_res = await run_query(
        lambda: supabase.table("donations")
        .select("id, status")
        .eq("id", donation_id)
        .single()
        .execute()
    )
    if not donation_res.data:
        raise HTTPException(status_code=404, detail="Donation not found")
    if donation_res.data["status"] != "PENDING":
        raise HTTPException(
            status_code=400,
            detail=f"Donation is already {donation_res.data['status']}",
        )

    await run_query(
        lambda: supabase.table("donations").update({
            "status":      "REJECTED",
            "admin_notes": payload.admin_notes,
            "verified_by": admin["id"],
            "verified_at": datetime.now(timezone.utc).isoformat(),
        }).eq("id", donation_id).execute()
    )
    logger.info("Admin %s rejected donation %s", admin["id"], donation_id)
    return {"message": "Donation rejected."}
