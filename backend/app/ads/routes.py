import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status

from app.ads.models import AdCreate, AdUpdate
from app.auth.dependencies import require_admin
from app.auth.routes import limiter
from app.common.storage import delete_objects
from app.db import get_supabase_client, run_query

logger = logging.getLogger(__name__)
router = APIRouter()

PUBLIC_FIELDS = "id, title, subtitle, image_url, target_url, placement, advertiser_name"
PLACEMENTS = {"HOME_BANNER", "NEWS_LIST", "MATRIMONY", "FOOTER"}


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


async def _bump_counter(ad_id: str, counter: str) -> None:
    """Atomic +1 via the increment_ad_counter SQL function. Never raises."""
    supabase = get_supabase_client()
    try:
        await run_query(
            lambda: supabase.rpc(
                "increment_ad_counter", {"ad_id": ad_id, "counter": counter}
            ).execute()
        )
    except Exception:
        logger.exception("Failed to bump %s for ad %s", counter, ad_id)


@router.get("")
@limiter.limit("120/minute")
async def list_live_ads(
    request: Request,
    placement: str = Query("HOME_BANNER"),
):
    """Public: ads currently in flight for a placement."""
    if placement not in PLACEMENTS:
        raise HTTPException(status_code=400, detail="Unknown placement")

    supabase = get_supabase_client()
    now = _now_iso()
    result = await run_query(
        lambda: supabase.table("ads")
        .select(PUBLIC_FIELDS)
        .eq("placement", placement)
        .eq("active", True)
        .lte("starts_at", now)
        .or_(f"ends_at.is.null,ends_at.gt.{now}")
        .order("sort_order")
        .order("created_at", desc=True)
        .execute()
    )
    return result.data


@router.get("/all")
async def list_all_ads(current_user: dict = Depends(require_admin)):
    """Admin: every ad, including inactive and finished campaigns."""
    supabase = get_supabase_client()
    result = await run_query(
        lambda: supabase.table("ads")
        .select("*")
        .order("active", desc=True)
        .order("sort_order")
        .order("created_at", desc=True)
        .execute()
    )
    return result.data


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_ad(payload: AdCreate, current_user: dict = Depends(require_admin)):
    """Admin: create an ad."""
    supabase = get_supabase_client()
    data = payload.model_dump(mode="json", exclude_none=True)
    data["created_by"] = current_user["id"]
    data.setdefault("starts_at", _now_iso())

    result = await run_query(lambda: supabase.table("ads").insert(data).execute())
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create ad")
    logger.info("Admin %s created ad: %s", current_user["id"], payload.title)
    return result.data[0]


@router.put("/{ad_id}")
async def update_ad(
    ad_id: str,
    payload: AdUpdate,
    current_user: dict = Depends(require_admin),
):
    """Admin: update an ad. Only the fields sent are changed."""
    supabase = get_supabase_client()

    existing = await run_query(
        lambda: supabase.table("ads").select("id, image_path").eq("id", ad_id).limit(1).execute()
    )
    if not existing.data:
        raise HTTPException(status_code=404, detail="Ad not found")

    data = payload.model_dump(mode="json", exclude_unset=True)
    if not data:
        raise HTTPException(status_code=400, detail="Nothing to update")

    old_image_path = existing.data[0].get("image_path")
    replacing_image = "image_path" in data and data["image_path"] != old_image_path

    await run_query(lambda: supabase.table("ads").update(data).eq("id", ad_id).execute())

    if replacing_image and old_image_path:
        await delete_objects("ads", [old_image_path])

    logger.info("Admin %s updated ad %s", current_user["id"], ad_id)
    return {"message": "Ad updated."}


@router.delete("/{ad_id}")
async def delete_ad(ad_id: str, current_user: dict = Depends(require_admin)):
    """Admin: delete an ad and its creative."""
    supabase = get_supabase_client()

    existing = await run_query(
        lambda: supabase.table("ads").select("id, image_path").eq("id", ad_id).limit(1).execute()
    )
    if not existing.data:
        raise HTTPException(status_code=404, detail="Ad not found")

    await delete_objects("ads", [existing.data[0].get("image_path")])
    await run_query(lambda: supabase.table("ads").delete().eq("id", ad_id).execute())
    logger.info("Admin %s deleted ad %s", current_user["id"], ad_id)
    return {"message": "Ad deleted."}


@router.post("/{ad_id}/impression", status_code=status.HTTP_202_ACCEPTED)
@limiter.limit("120/minute")
async def track_impression(request: Request, ad_id: str):
    """Public: count one render of this ad."""
    await _bump_counter(ad_id, "impressions")
    return {"ok": True}


@router.post("/{ad_id}/click", status_code=status.HTTP_202_ACCEPTED)
@limiter.limit("120/minute")
async def track_click(request: Request, ad_id: str):
    """Public: count one click on this ad."""
    await _bump_counter(ad_id, "clicks")
    return {"ok": True}
