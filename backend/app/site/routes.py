import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException

from app.auth.dependencies import require_admin
from app.common.storage import build_object_path, create_signed_upload, delete_objects
from app.db import get_supabase_client, run_query
from app.site.models import AdminUploadUrlRequest, ChairmanNoticeUpdate

logger = logging.getLogger(__name__)
router = APIRouter()

CHAIRMAN_NOTICE_KEY = "chairman_notice"

# Keys the public endpoint is allowed to serve. Everything else in site_settings
# stays private, so this table can also hold internal config later.
PUBLIC_SETTING_KEYS = {CHAIRMAN_NOTICE_KEY}


@router.get("/settings/{key}")
async def get_setting(key: str):
    """Public: read one site setting (e.g. the current Chairman's notice)."""
    if key not in PUBLIC_SETTING_KEYS:
        raise HTTPException(status_code=404, detail="Setting not found")

    supabase = get_supabase_client()
    result = await run_query(
        lambda: supabase.table("site_settings")
        .select("key, value, updated_at")
        .eq("key", key)
        .limit(1)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Setting not found")
    return result.data[0]


@router.post("/upload-url")
async def create_admin_upload_url(
    request: AdminUploadUrlRequest,
    current_user: dict = Depends(require_admin),
):
    """Admin: get a signed URL for uploading an asset straight to Supabase Storage."""
    return await create_signed_upload(
        request.bucket,
        build_object_path(request.bucket, request.file_name),
    )


@router.put("/chairman-notice")
async def update_chairman_notice(
    request: ChairmanNoticeUpdate,
    current_user: dict = Depends(require_admin),
):
    """Admin: replace the Chairman's notice PDF shown on the Administration page."""
    supabase = get_supabase_client()

    existing = await run_query(
        lambda: supabase.table("site_settings")
        .select("value")
        .eq("key", CHAIRMAN_NOTICE_KEY)
        .limit(1)
        .execute()
    )
    previous_path = (existing.data[0]["value"] or {}).get("pdf_path") if existing.data else None

    value = {
        "pdf_url": request.pdf_url,
        "pdf_path": request.pdf_path,
        "file_name": request.file_name,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    await run_query(
        lambda: supabase.table("site_settings")
        .upsert({
            "key": CHAIRMAN_NOTICE_KEY,
            "value": value,
            "updated_by": current_user["id"],
            "updated_at": datetime.now(timezone.utc).isoformat(),
        })
        .execute()
    )

    # Only one Chairman notice is ever live — drop the replaced file.
    if previous_path and previous_path != request.pdf_path:
        await delete_objects("chairman", [previous_path])

    logger.info("Admin %s replaced the chairman notice: %s", current_user["id"], request.file_name)
    return {"message": "Chairman's notice updated.", "value": value}
