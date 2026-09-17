import logging

from fastapi import APIRouter, Depends, HTTPException, Request, status

from app.auth.dependencies import require_admin
from app.auth.routes import limiter
from app.common.storage import delete_objects
from app.db import get_supabase_client, run_query
from app.gallery.models import GalleryImageCreate, GalleryImageUpdate

logger = logging.getLogger(__name__)
router = APIRouter()

PUBLIC_FIELDS = "id, image_url, caption, sort_order"


@router.get("")
@limiter.limit("120/minute")
async def list_active_images(request: Request):
    """Public: active gallery images for the home page carousel."""
    supabase = get_supabase_client()
    result = await run_query(
        lambda: supabase.table("gallery_images")
        .select(PUBLIC_FIELDS)
        .eq("active", True)
        .order("sort_order")
        .order("created_at", desc=True)
        .execute()
    )
    return result.data


@router.get("/all")
async def list_all_images(current_user: dict = Depends(require_admin)):
    """Admin: every gallery image, including inactive ones."""
    supabase = get_supabase_client()
    result = await run_query(
        lambda: supabase.table("gallery_images")
        .select("*")
        .order("sort_order")
        .order("created_at", desc=True)
        .execute()
    )
    return result.data


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_image(
    payload: GalleryImageCreate,
    current_user: dict = Depends(require_admin),
):
    """Admin: add an image to the gallery."""
    supabase = get_supabase_client()
    data = payload.model_dump(mode="json", exclude_none=True)
    data["created_by"] = current_user["id"]

    result = await run_query(
        lambda: supabase.table("gallery_images").insert(data).execute()
    )
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to add image")
    logger.info("Admin %s added gallery image %s", current_user["id"], result.data[0]["id"])
    return result.data[0]


@router.put("/{image_id}")
async def update_image(
    image_id: str,
    payload: GalleryImageUpdate,
    current_user: dict = Depends(require_admin),
):
    """Admin: update a gallery image. Only the fields sent are changed."""
    supabase = get_supabase_client()

    existing = await run_query(
        lambda: supabase.table("gallery_images")
        .select("id, image_path")
        .eq("id", image_id)
        .limit(1)
        .execute()
    )
    if not existing.data:
        raise HTTPException(status_code=404, detail="Image not found")

    data = payload.model_dump(mode="json", exclude_unset=True)
    if not data:
        raise HTTPException(status_code=400, detail="Nothing to update")

    old_image_path = existing.data[0].get("image_path")
    replacing_image = "image_path" in data and data["image_path"] != old_image_path

    await run_query(
        lambda: supabase.table("gallery_images").update(data).eq("id", image_id).execute()
    )

    if replacing_image and old_image_path:
        await delete_objects("gallery", [old_image_path])

    logger.info("Admin %s updated gallery image %s", current_user["id"], image_id)
    return {"message": "Image updated."}


@router.delete("/{image_id}")
async def delete_image(image_id: str, current_user: dict = Depends(require_admin)):
    """Admin: remove an image from the gallery."""
    supabase = get_supabase_client()

    existing = await run_query(
        lambda: supabase.table("gallery_images")
        .select("id, image_path")
        .eq("id", image_id)
        .limit(1)
        .execute()
    )
    if not existing.data:
        raise HTTPException(status_code=404, detail="Image not found")

    await delete_objects("gallery", [existing.data[0].get("image_path")])
    await run_query(
        lambda: supabase.table("gallery_images").delete().eq("id", image_id).execute()
    )
    logger.info("Admin %s deleted gallery image %s", current_user["id"], image_id)
    return {"message": "Image deleted."}
