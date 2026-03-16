import logging
from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from app.auth.dependencies import require_admin
from app.db import get_supabase_client, run_query
from app.accounts.models import TransactionCreate

logger = logging.getLogger(__name__)
router = APIRouter()

MEMBERSHIP_FEES = {"PERMANENT": 5000, "NORMAL": 100, "ASSOCIATED": 500}


@router.get("/summary")
async def get_summary(admin: dict = Depends(require_admin)):
    """Total income, expenses and net balance."""
    supabase = get_supabase_client()
    result = await run_query(
        lambda: supabase.table("transactions").select("type, amount").execute()
    )
    income  = sum(r["amount"] for r in result.data if r["type"] == "INCOME")
    expense = sum(r["amount"] for r in result.data if r["type"] == "EXPENSE")
    return {
        "total_income":  income,
        "total_expense": expense,
        "net_balance":   income - expense,
    }


@router.get("/transactions")
async def list_transactions(admin: dict = Depends(require_admin)):
    """Full ledger, newest first. Fetches member names in a second query to avoid join issues."""
    supabase = get_supabase_client()

    # Fetch transactions
    tx_result = await run_query(
        lambda: supabase.table("transactions")
        .select("*")
        .order("transaction_date", desc=True)
        .order("created_at", desc=True)
        .execute()
    )
    transactions = tx_result.data

    # Enrich with member name/id for those linked to a user
    user_ids = list({t["reference_user_id"] for t in transactions if t.get("reference_user_id")})
    users_map = {}
    if user_ids:
        users_result = await run_query(
            lambda: supabase.table("users")
            .select("id, full_name, member_id")
            .in_("id", user_ids)
            .execute()
        )
        users_map = {u["id"]: u for u in users_result.data}

    for tx in transactions:
        uid = tx.get("reference_user_id")
        tx["member"] = users_map.get(uid) if uid else None

    return transactions


@router.post("/transactions", status_code=201)
async def add_transaction(
    payload: TransactionCreate,
    admin: dict = Depends(require_admin),
):
    """Manually add an income or expense entry."""
    supabase = get_supabase_client()
    data = {
        "type":             payload.type,
        "category":         payload.category,
        "amount":           payload.amount,
        "description":      payload.description,
        "recorded_by":      admin["id"],
        "transaction_date": (payload.transaction_date or date.today()).isoformat(),
    }
    result = await run_query(
        lambda: supabase.table("transactions").insert(data).execute()
    )
    logger.info("Admin %s added %s ₹%.2f (%s)", admin["id"], payload.type, payload.amount, payload.category)
    return result.data[0]


@router.post("/backfill", status_code=201)
async def backfill_membership_fees(admin: dict = Depends(require_admin)):
    """
    Seed INCOME transactions for all existing active members who don't
    already have a MEMBERSHIP_FEE transaction recorded.
    Safe to call multiple times — skips members already in the ledger.
    """
    supabase = get_supabase_client()

    # Get all active non-HEAD members
    members_result = await run_query(
        lambda: supabase.table("users")
        .select("id, full_name, member_id, role, joined_at, created_at")
        .eq("status", "ACTIVE")
        .neq("role", "HEAD")
        .execute()
    )
    members = members_result.data

    # Get user IDs that already have a MEMBERSHIP_FEE transaction
    existing_result = await run_query(
        lambda: supabase.table("transactions")
        .select("reference_user_id")
        .eq("category", "MEMBERSHIP_FEE")
        .execute()
    )
    already_recorded = {r["reference_user_id"] for r in existing_result.data if r.get("reference_user_id")}

    created = 0
    skipped = 0
    for m in members:
        if m["id"] in already_recorded:
            skipped += 1
            continue
        fee = MEMBERSHIP_FEES.get(m["role"])
        if not fee:
            skipped += 1
            continue

        # Use joined_at or created_at as the transaction date
        tx_date = (m.get("joined_at") or m.get("created_at") or date.today().isoformat())[:10]
        mid = m.get("member_id") or "—"

        await run_query(
            lambda: supabase.table("transactions").insert({
                "type":               "INCOME",
                "category":           "MEMBERSHIP_FEE",
                "amount":             fee,
                "description":        f"Registration fee — {mid} ({m['role']})",
                "reference_user_id":  m["id"],
                "recorded_by":        admin["id"],
                "transaction_date":   tx_date,
            }).execute()
        )
        created += 1
        logger.info("Backfill: recorded ₹%d for %s (%s)", fee, m["full_name"], mid)

    return {
        "message": f"Backfill complete. {created} transaction(s) created, {skipped} skipped (already recorded or no fee).",
        "created": created,
        "skipped": skipped,
    }
