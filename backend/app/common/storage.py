"""Shared Supabase Storage helpers.

Uploads are done by the browser straight to Supabase Storage, but the browser is
never given blanket write access to a bucket. Instead the backend (which holds
the service-role key) issues a short-lived signed upload URL for one specific
object path, after it has checked that the caller is allowed to upload at all.
"""

import logging
import re
import time
from typing import Iterable, Optional

from fastapi import HTTPException

from app.db import get_supabase_client, run_query

logger = logging.getLogger(__name__)

_UNSAFE_CHARS = re.compile(r"[^A-Za-z0-9._-]+")
_REPEATED_DOTS = re.compile(r"\.{2,}")


def sanitize_filename(name: str, fallback: str = "upload") -> str:
    """Reduce a user-supplied file name to a safe storage object name."""
    name = (name or "").strip().replace("\\", "/").split("/")[-1]
    name = _UNSAFE_CHARS.sub("_", name)
    name = _REPEATED_DOTS.sub(".", name).strip("._")
    if not name:
        name = fallback
    return name[:120]


def build_object_path(prefix: str, file_name: str) -> str:
    """`prefix/1723456789_my_file.pdf` — timestamped so uploads never collide."""
    return f"{prefix.strip('/')}/{int(time.time() * 1000)}_{sanitize_filename(file_name)}"


def assert_owned_path(path: str, prefix: str) -> str:
    """Reject an object path the caller was not issued.

    Clients tell us where they uploaded, and that path is later handed to
    `delete_objects`. Without this check a member could claim another member's
    object path and have it deleted on their behalf.
    """
    if not path or ".." in path or not path.startswith(prefix):
        raise HTTPException(status_code=400, detail="Upload path does not match your upload.")
    return path


async def public_url(bucket: str, path: str) -> str:
    """The canonical public URL for an object. Derived here rather than trusted
    from the client, so a stored record can only ever point into our own bucket."""
    supabase = get_supabase_client()
    return await run_query(lambda: supabase.storage.from_(bucket).get_public_url(path))


async def create_signed_upload(bucket: str, path: str) -> dict:
    """Issue a signed upload URL the browser can PUT to, plus the eventual public URL."""
    supabase = get_supabase_client()
    try:
        signed = await run_query(
            lambda: supabase.storage.from_(bucket).create_signed_upload_url(path)
        )
    except Exception:
        logger.exception("Failed to create signed upload URL for %s/%s", bucket, path)
        raise HTTPException(status_code=502, detail="Could not prepare the upload. Please try again.")

    public_url = await run_query(lambda: supabase.storage.from_(bucket).get_public_url(path))

    return {
        "bucket": bucket,
        "path": path,
        "token": signed["token"],
        "signed_url": signed["signed_url"],
        "public_url": public_url,
    }


async def delete_objects(bucket: str, paths: Iterable[Optional[str]]) -> None:
    """Best-effort delete. Storage failures are logged, never raised — a missing
    file must not block deleting the database row that points at it."""
    targets = [p for p in paths if p]
    if not targets:
        return
    supabase = get_supabase_client()
    try:
        await run_query(lambda: supabase.storage.from_(bucket).remove(targets))
    except Exception:
        logger.exception("Failed to remove %d object(s) from bucket %s", len(targets), bucket)
