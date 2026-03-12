import logging
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from app.auth.dependencies import require_active_status, require_admin
from app.db import get_supabase_client, run_query
from app.articles.models import ArticleSubmitRequest, ArticlePublishRequest, ArticleReviewRequest

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("")
async def list_published_articles(
    current_user: dict = Depends(require_active_status),
):
    """List all currently published (non-expired) articles."""
    supabase = get_supabase_client()
    now = datetime.now(timezone.utc).isoformat()
    result = await run_query(
        lambda: supabase.table("articles")
        .select("id, title, summary, pdf_url, category, published_at, expires_at, submitted_by")
        .eq("status", "PUBLISHED")
        .gt("expires_at", now)
        .order("published_at", desc=True)
        .execute()
    )
    return result.data


@router.get("/my-submissions")
async def my_submissions(
    current_user: dict = Depends(require_active_status),
):
    """Get the current member's article submission history."""
    supabase = get_supabase_client()
    result = await run_query(
        lambda: supabase.table("articles")
        .select("id, title, summary, category, status, admin_notes, created_at, published_at")
        .eq("submitted_by", current_user["id"])
        .order("created_at", desc=True)
        .execute()
    )
    return result.data


@router.get("/pending")
async def list_pending_articles(
    current_user: dict = Depends(require_admin),
):
    """Admin: list all articles awaiting review."""
    supabase = get_supabase_client()
    result = await run_query(
        lambda: supabase.table("articles")
        .select("id, title, summary, pdf_url, category, created_at, submitted_by, users!articles_submitted_by_fkey(full_name, member_id)")
        .eq("status", "PENDING")
        .order("created_at", desc=True)
        .execute()
    )
    return result.data


@router.post("/submit", status_code=status.HTTP_201_CREATED)
async def submit_article(
    request: ArticleSubmitRequest,
    current_user: dict = Depends(require_active_status),
):
    """Active member submits an article for admin review."""
    supabase = get_supabase_client()
    data = {
        "title": request.title,
        "summary": request.summary,
        "category": request.category,
        "pdf_url": request.pdf_url,
        "pdf_path": request.pdf_path,
        "status": "PENDING",
        "submitted_by": current_user["id"],
    }
    result = await run_query(
        lambda: supabase.table("articles").insert(data).execute()
    )
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to submit article")
    logger.info("User %s submitted article: %s", current_user["id"], request.title)
    return {"message": "Article submitted for review.", "id": result.data[0]["id"]}


@router.post("/publish", status_code=status.HTTP_201_CREATED)
async def publish_article(
    request: ArticlePublishRequest,
    current_user: dict = Depends(require_admin),
):
    """Admin: publish an article directly (no review step)."""
    supabase = get_supabase_client()
    now = datetime.now(timezone.utc)
    data = {
        "title": request.title,
        "summary": request.summary,
        "category": request.category,
        "pdf_url": request.pdf_url,
        "pdf_path": request.pdf_path,
        "status": "PUBLISHED",
        "reviewed_by": current_user["id"],
        "published_at": now.isoformat(),
        "expires_at": (now + timedelta(days=30)).isoformat(),
    }
    result = await run_query(
        lambda: supabase.table("articles").insert(data).execute()
    )
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to publish article")
    logger.info("Admin %s published article: %s", current_user["id"], request.title)
    return {"message": "Article published.", "id": result.data[0]["id"]}


@router.post("/{article_id}/review")
async def review_article(
    article_id: str,
    request: ArticleReviewRequest,
    current_user: dict = Depends(require_admin),
):
    """Admin: approve or reject a pending article submission."""
    supabase = get_supabase_client()

    # Fetch the article
    article = await run_query(
        lambda: supabase.table("articles")
        .select("id, status, pdf_path")
        .eq("id", article_id)
        .single()
        .execute()
    )
    if not article.data:
        raise HTTPException(status_code=404, detail="Article not found")
    if article.data["status"] != "PENDING":
        raise HTTPException(status_code=400, detail="Article is not in PENDING state")

    now = datetime.now(timezone.utc)
    if request.action == "APPROVE":
        update = {
            "status": "PUBLISHED",
            "reviewed_by": current_user["id"],
            "admin_notes": request.admin_notes,
            "published_at": now.isoformat(),
            "expires_at": (now + timedelta(days=30)).isoformat(),
        }
        msg = "Article approved and published."
    else:
        update = {
            "status": "REJECTED",
            "reviewed_by": current_user["id"],
            "admin_notes": request.admin_notes,
        }
        msg = "Article rejected."

    await run_query(
        lambda: supabase.table("articles").update(update).eq("id", article_id).execute()
    )
    logger.info("Admin %s %s article %s", current_user["id"], request.action, article_id)
    return {"message": msg}


@router.delete("/{article_id}")
async def delete_article(
    article_id: str,
    current_user: dict = Depends(require_admin),
):
    """Admin: delete an article and its PDF from storage."""
    supabase = get_supabase_client()

    article = await run_query(
        lambda: supabase.table("articles")
        .select("id, pdf_path")
        .eq("id", article_id)
        .single()
        .execute()
    )
    if not article.data:
        raise HTTPException(status_code=404, detail="Article not found")

    pdf_path = article.data.get("pdf_path")

    # Delete storage file
    if pdf_path:
        await run_query(
            lambda: supabase.storage.from_("articles").remove([pdf_path])
        )

    # Delete DB record
    await run_query(
        lambda: supabase.table("articles").delete().eq("id", article_id).execute()
    )
    logger.info("Admin %s deleted article %s", current_user["id"], article_id)
    return {"message": "Article deleted."}


@router.post("/cleanup")
async def cleanup_expired_articles(
    current_user: dict = Depends(require_admin),
):
    """Admin: manually delete all expired articles and their storage files."""
    supabase = get_supabase_client()
    now = datetime.now(timezone.utc).isoformat()

    expired = await run_query(
        lambda: supabase.table("articles")
        .select("id, pdf_path")
        .lt("expires_at", now)
        .execute()
    )

    if not expired.data:
        return {"message": "No expired articles found.", "deleted": 0}

    paths = [a["pdf_path"] for a in expired.data if a.get("pdf_path")]
    ids = [a["id"] for a in expired.data]

    # Remove storage files in batch
    if paths:
        await run_query(lambda: supabase.storage.from_("articles").remove(paths))

    # Delete DB records
    for article_id in ids:
        await run_query(
            lambda: supabase.table("articles").delete().eq("id", article_id).execute()
        )

    logger.info("Cleanup: deleted %d expired articles", len(ids))
    return {"message": f"Deleted {len(ids)} expired article(s).", "deleted": len(ids)}
