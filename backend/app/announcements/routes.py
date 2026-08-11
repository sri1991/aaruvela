import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status

from app.announcements.models import AnnouncementCreate, AnnouncementUpdate
from app.auth.dependencies import require_admin
from app.auth.routes import limiter
from app.common.storage import delete_objects
from app.db import get_supabase_client, run_query

logger = logging.getLogger(__name__)
router = APIRouter()

PUBLIC_FIELDS = "id, title, body, category, image_url, link_url, pinned, publish_at, expires_at, created_at"


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


@router.get("")
@limiter.limit("60/minute")
async def list_public_announcements(
    request: Request,
    limit: int = Query(50, ge=1, le=100),
):
    """Public: live announcements, pinned first, then newest."""
    supabase = get_supabase_client()
    now = _now_iso()
    result = await run_query(
        lambda: supabase.table("announcements")
        .select(PUBLIC_FIELDS)
        .eq("status", "PUBLISHED")
        .lte("publish_at", now)
        .or_(f"expires_at.is.null,expires_at.gt.{now}")
        .order("pinned", desc=True)
        .order("publish_at", desc=True)
        .limit(limit)
        .execute()
    )
    return result.data


@router.get("/all")
async def list_all_announcements(current_user: dict = Depends(require_admin)):
    """Admin: every announcement including drafts, archived and expired."""
    supabase = get_supabase_client()
    result = await run_query(
        lambda: supabase.table("announcements")
        .select("*")
        .order("pinned", desc=True)
        .order("created_at", desc=True)
        .execute()
    )
    return result.data


@router.get("/{announcement_id}")
@limiter.limit("60/minute")
async def get_public_announcement(request: Request, announcement_id: str):
    """Public: a single live announcement."""
    supabase = get_supabase_client()
    now = _now_iso()
    result = await run_query(
        lambda: supabase.table("announcements")
        .select(PUBLIC_FIELDS)
        .eq("id", announcement_id)
        .eq("status", "PUBLISHED")
        .lte("publish_at", now)
        .or_(f"expires_at.is.null,expires_at.gt.{now}")
        .limit(1)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Announcement not found")
    return result.data[0]


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_announcement(
    payload: AnnouncementCreate,
    current_user: dict = Depends(require_admin),
):
    """Admin: create an announcement (draft or published)."""
    supabase = get_supabase_client()
    data = payload.model_dump(mode="json", exclude_none=True)
    data["created_by"] = current_user["id"]
    data.setdefault("publish_at", _now_iso())

    result = await run_query(
        lambda: supabase.table("announcements").insert(data).execute()
    )
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create announcement")
    logger.info("Admin %s created announcement: %s", current_user["id"], payload.title)
    return result.data[0]


@router.put("/{announcement_id}")
async def update_announcement(
    announcement_id: str,
    payload: AnnouncementUpdate,
    current_user: dict = Depends(require_admin),
):
    """Admin: update an announcement. Only the fields sent are changed."""
    supabase = get_supabase_client()

    existing = await run_query(
        lambda: supabase.table("announcements")
        .select("id, image_path")
        .eq("id", announcement_id)
        .limit(1)
        .execute()
    )
    if not existing.data:
        raise HTTPException(status_code=404, detail="Announcement not found")

    data = payload.model_dump(mode="json", exclude_unset=True)
    if not data:
        raise HTTPException(status_code=400, detail="Nothing to update")

    old_image_path = existing.data[0].get("image_path")
    replacing_image = "image_path" in data and data["image_path"] != old_image_path

    await run_query(
        lambda: supabase.table("announcements").update(data).eq("id", announcement_id).execute()
    )

    if replacing_image and old_image_path:
        await delete_objects("announcements", [old_image_path])

    logger.info("Admin %s updated announcement %s", current_user["id"], announcement_id)
    return {"message": "Announcement updated."}


@router.delete("/{announcement_id}")
async def delete_announcement(
    announcement_id: str,
    current_user: dict = Depends(require_admin),
):
    """Admin: delete an announcement and its image."""
    supabase = get_supabase_client()

    existing = await run_query(
        lambda: supabase.table("announcements")
        .select("id, image_path")
        .eq("id", announcement_id)
        .limit(1)
        .execute()
    )
    if not existing.data:
        raise HTTPException(status_code=404, detail="Announcement not found")

    await delete_objects("announcements", [existing.data[0].get("image_path")])
    await run_query(
        lambda: supabase.table("announcements").delete().eq("id", announcement_id).execute()
    )
    logger.info("Admin %s deleted announcement %s", current_user["id"], announcement_id)
    return {"message": "Announcement deleted."}
