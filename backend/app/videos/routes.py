import logging
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status

from app.auth.dependencies import require_active_status, require_admin, require_admin_or_cron
from app.common.storage import (
    assert_owned_path,
    build_object_path,
    create_signed_upload,
    delete_objects,
    public_url,
)
from app.db import get_supabase_client, run_query
from app.videos.models import (
    ALLOWED_VIDEO_TYPES,
    MAX_PENDING_PER_MEMBER,
    MAX_PUBLISHED_PER_MEMBER,
    MAX_VIDEO_BYTES,
    VISIBLE_DAYS,
    VideoReviewRequest,
    VideoSubmitRequest,
    VideoUploadUrlRequest,
)

logger = logging.getLogger(__name__)
router = APIRouter()

BUCKET = "videos"
POSTER_SUFFIX = ".poster.jpg"


def _now() -> datetime:
    return datetime.now(timezone.utc)


async def _assert_within_quota(user_id: str) -> None:
    """A member may hold one pending submission and two live videos at a time.

    Checked before the signed upload URL is issued as well as at submit time, so
    an over-quota member never spends the bandwidth uploading in the first place.
    """
    supabase = get_supabase_client()
    now_iso = _now().isoformat()

    pending = await run_query(
        lambda: supabase.table("videos")
        .select("id")
        .eq("submitted_by", user_id)
        .eq("status", "PENDING")
        .execute()
    )
    if len(pending.data) >= MAX_PENDING_PER_MEMBER:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You already have a video awaiting review. Please wait for it to be reviewed.",
        )

    live = await run_query(
        lambda: supabase.table("videos")
        .select("id")
        .eq("submitted_by", user_id)
        .eq("status", "PUBLISHED")
        .gt("expires_at", now_iso)
        .execute()
    )
    if len(live.data) >= MAX_PUBLISHED_PER_MEMBER:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"You already have {MAX_PUBLISHED_PER_MEMBER} videos live. "
                   "Please wait for one to expire before submitting another.",
        )


@router.get("")
async def list_published_videos(current_user: dict = Depends(require_active_status)):
    """List videos that are currently live (published and not yet expired)."""
    supabase = get_supabase_client()
    now_iso = _now().isoformat()
    result = await run_query(
        lambda: supabase.table("videos")
        .select(
            "id, title, description, video_url, thumbnail_url, mime_type, duration_secs, "
            "published_at, expires_at, submitted_by, users!videos_submitted_by_fkey(full_name, member_id)"
        )
        .eq("status", "PUBLISHED")
        .gt("expires_at", now_iso)
        .order("published_at", desc=True)
        .execute()
    )
    return result.data


@router.get("/my-submissions")
async def my_submissions(current_user: dict = Depends(require_active_status)):
    """The current member's video submission history."""
    supabase = get_supabase_client()
    result = await run_query(
        lambda: supabase.table("videos")
        .select("id, title, description, thumbnail_url, status, admin_notes, created_at, published_at, expires_at")
        .eq("submitted_by", current_user["id"])
        .order("created_at", desc=True)
        .execute()
    )
    return result.data


@router.get("/pending")
async def list_pending_videos(current_user: dict = Depends(require_admin)):
    """Admin: videos awaiting review."""
    supabase = get_supabase_client()
    result = await run_query(
        lambda: supabase.table("videos")
        .select(
            "id, title, description, video_url, thumbnail_url, mime_type, size_bytes, duration_secs, "
            "created_at, submitted_by, users!videos_submitted_by_fkey(full_name, member_id)"
        )
        .eq("status", "PENDING")
        .order("created_at", desc=True)
        .execute()
    )
    return result.data


@router.get("/published")
async def list_published_for_admin(current_user: dict = Depends(require_admin)):
    """Admin: live videos, plus how much storage the library is using."""
    supabase = get_supabase_client()
    now_iso = _now().isoformat()
    result = await run_query(
        lambda: supabase.table("videos")
        .select(
            "id, title, video_url, thumbnail_url, size_bytes, published_at, expires_at, "
            "submitted_by, users!videos_submitted_by_fkey(full_name, member_id)"
        )
        .eq("status", "PUBLISHED")
        .gt("expires_at", now_iso)
        .order("published_at", desc=True)
        .execute()
    )

    stored = await run_query(
        lambda: supabase.table("videos").select("size_bytes").neq("status", "REJECTED").execute()
    )
    total_bytes = sum(v.get("size_bytes") or 0 for v in stored.data)

    return {"videos": result.data, "total_bytes": total_bytes, "count": len(result.data)}


@router.post("/upload-url")
async def create_video_upload_url(
    request: VideoUploadUrlRequest,
    current_user: dict = Depends(require_active_status),
):
    """Issue signed upload URLs for the video and its poster frame.

    The browser uploads straight to Supabase Storage with these; it never gets
    blanket write access to the bucket.
    """
    if request.content_type not in ALLOWED_VIDEO_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only MP4, WebM and MOV videos are accepted.",
        )
    if request.size_bytes > MAX_VIDEO_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Video is too large (max {MAX_VIDEO_BYTES // (1024 * 1024)} MB). "
                   "Please upload a shorter clip or record at a lower quality.",
        )

    await _assert_within_quota(current_user["id"])

    prefix = f"submissions/{current_user['id']}"
    video = await create_signed_upload(BUCKET, build_object_path(prefix, request.file_name))
    thumbnail = await create_signed_upload(BUCKET, f"{video['path']}{POSTER_SUFFIX}")

    return {"video": video, "thumbnail": thumbnail}


@router.post("/submit", status_code=status.HTTP_201_CREATED)
async def submit_video(
    request: VideoSubmitRequest,
    current_user: dict = Depends(require_active_status),
):
    """Active member submits an uploaded video for admin review."""
    if request.size_bytes and request.size_bytes > MAX_VIDEO_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Video is too large (max {MAX_VIDEO_BYTES // (1024 * 1024)} MB).",
        )

    # The member could have opened two tabs; re-check before inserting.
    await _assert_within_quota(current_user["id"])

    # The client tells us where it uploaded, and that path is what gets deleted
    # on rejection and at cleanup. Pin it to this member's own prefix so nobody
    # can have someone else's video deleted by submitting its path.
    prefix = f"submissions/{current_user['id']}/"
    video_path = assert_owned_path(request.video_path, prefix)
    thumbnail_path = request.thumbnail_path
    if thumbnail_path is not None and thumbnail_path != f"{video_path}{POSTER_SUFFIX}":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Thumbnail path does not match your upload.",
        )

    supabase = get_supabase_client()
    data = request.model_dump(exclude_none=True)
    data["status"] = "PENDING"
    data["submitted_by"] = current_user["id"]
    # URLs are derived from the verified paths, never taken from the client, so a
    # record can only ever point at an object in our own bucket.
    data["video_path"] = video_path
    data["video_url"] = await public_url(BUCKET, video_path)
    if thumbnail_path:
        data["thumbnail_path"] = thumbnail_path
        data["thumbnail_url"] = await public_url(BUCKET, thumbnail_path)
    else:
        data.pop("thumbnail_path", None)
        data.pop("thumbnail_url", None)

    result = await run_query(lambda: supabase.table("videos").insert(data).execute())
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to submit video")

    logger.info("User %s submitted video: %s", current_user["id"], request.title)
    return {"message": "Video submitted for review.", "id": result.data[0]["id"]}


@router.post("/{video_id}/review")
async def review_video(
    video_id: str,
    request: VideoReviewRequest,
    current_user: dict = Depends(require_admin),
):
    """Admin: approve (live for 7 days) or reject (file deleted immediately)."""
    supabase = get_supabase_client()

    video = await run_query(
        lambda: supabase.table("videos")
        .select("id, status, video_path, thumbnail_path, title")
        .eq("id", video_id)
        .limit(1)
        .execute()
    )
    if not video.data:
        raise HTTPException(status_code=404, detail="Video not found")
    video = video.data[0]
    if video["status"] != "PENDING":
        raise HTTPException(status_code=400, detail="Video is not in PENDING state")

    now = _now()
    if request.action == "APPROVE":
        update = {
            "status": "PUBLISHED",
            "reviewed_by": current_user["id"],
            "admin_notes": request.admin_notes,
            "published_at": now.isoformat(),
            "expires_at": (now + timedelta(days=VISIBLE_DAYS)).isoformat(),
        }
        message = f"Video approved — live for {VISIBLE_DAYS} days."
    else:
        update = {
            "status": "REJECTED",
            "reviewed_by": current_user["id"],
            "admin_notes": request.admin_notes,
            "video_url": None,
            "thumbnail_url": None,
        }
        message = "Video rejected."

    await run_query(
        lambda: supabase.table("videos").update(update).eq("id", video_id).execute()
    )

    # A rejected video should not keep occupying the bucket.
    if request.action == "REJECT":
        await delete_objects(BUCKET, [video.get("video_path"), video.get("thumbnail_path")])

    logger.info("Admin %s %s video %s", current_user["id"], request.action, video_id)
    return {"message": message}


@router.delete("/{video_id}")
async def delete_video(video_id: str, current_user: dict = Depends(require_admin)):
    """Admin: take a video down and delete its files."""
    supabase = get_supabase_client()

    video = await run_query(
        lambda: supabase.table("videos")
        .select("id, video_path, thumbnail_path")
        .eq("id", video_id)
        .limit(1)
        .execute()
    )
    if not video.data:
        raise HTTPException(status_code=404, detail="Video not found")

    await delete_objects(BUCKET, [video.data[0].get("video_path"), video.data[0].get("thumbnail_path")])
    await run_query(lambda: supabase.table("videos").delete().eq("id", video_id).execute())

    logger.info("Admin %s deleted video %s", current_user["id"], video_id)
    return {"message": "Video deleted."}


@router.post("/cleanup")
async def cleanup_expired_videos(actor: dict = Depends(require_admin_or_cron)):
    """Remove expired videos and sweep up any rejected files left behind.

    Called daily by a scheduled job (X-Cron-Secret header) and available to
    admins from the dashboard.

    Rejected rows are deliberately kept: their files are already deleted at
    review time, and the row is what shows the member why their video was turned
    down. Their paths are still swept in case that review-time delete failed.
    """
    supabase = get_supabase_client()
    now_iso = _now().isoformat()

    expired = await run_query(
        lambda: supabase.table("videos")
        .select("id, video_path, thumbnail_path")
        .eq("status", "PUBLISHED")
        .lt("expires_at", now_iso)
        .execute()
    )
    rejected = await run_query(
        lambda: supabase.table("videos")
        .select("id, video_path, thumbnail_path")
        .eq("status", "REJECTED")
        .execute()
    )

    expired_rows = expired.data or []
    # Only rejected rows that still carry a path need sweeping; once swept their
    # paths are cleared so the same dead files aren't retried every night.
    orphans = [v for v in (rejected.data or []) if v.get("video_path") or v.get("thumbnail_path")]
    stale = expired_rows + orphans
    if not stale:
        return {"message": "Nothing to clean up.", "deleted": 0}

    paths = [p for v in stale for p in (v.get("video_path"), v.get("thumbnail_path"))]
    await delete_objects(BUCKET, paths)

    ids = [v["id"] for v in expired_rows]
    if ids:
        await run_query(lambda: supabase.table("videos").delete().in_("id", ids).execute())

    if orphans:
        orphan_ids = [v["id"] for v in orphans]
        await run_query(
            lambda: supabase.table("videos")
            .update({"video_path": None, "thumbnail_path": None})
            .in_("id", orphan_ids)
            .execute()
        )

    logger.info(
        "Video cleanup by %s: removed %d expired video(s), swept %d rejected file(s)",
        actor.get("role"), len(ids), len(orphans),
    )
    return {"message": f"Deleted {len(ids)} video(s).", "deleted": len(ids)}
