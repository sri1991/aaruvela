import logging
from datetime import date
from fastapi import APIRouter, Depends
from app.auth.dependencies import require_admin
from app.db import get_supabase_client, run_query
from app.accounts.models import TransactionCreate

logger = logging.getLogger(__name__)
router = APIRouter()


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
    """Full ledger, newest first."""
    supabase = get_supabase_client()
    result = await run_query(
        lambda: supabase.table("transactions")
        .select("*, users!transactions_reference_user_id_fkey(full_name, member_id)")
        .order("transaction_date", desc=True)
        .order("created_at", desc=True)
        .execute()
    )
    return result.data


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
