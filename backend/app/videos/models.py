from typing import Optional

from pydantic import BaseModel, Field

# Keep in sync with the `videos` bucket limits in storage_rls_policies.sql
MAX_VIDEO_BYTES = 25 * 1024 * 1024
ALLOWED_VIDEO_TYPES = {"video/mp4", "video/webm", "video/quicktime"}

VISIBLE_DAYS = 7
MAX_PENDING_PER_MEMBER = 1
MAX_PUBLISHED_PER_MEMBER = 2


class VideoUploadUrlRequest(BaseModel):
    file_name: str = Field(..., min_length=1, max_length=200)
    content_type: str = Field(..., max_length=100)
    size_bytes: int = Field(..., gt=0)


class VideoSubmitRequest(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    video_url: str
    video_path: str
    thumbnail_url: Optional[str] = None
    thumbnail_path: Optional[str] = None
    mime_type: Optional[str] = Field(None, max_length=100)
    size_bytes: Optional[int] = Field(None, gt=0)
    duration_secs: Optional[int] = Field(None, ge=0)


class VideoReviewRequest(BaseModel):
    action: str = Field(..., pattern="^(APPROVE|REJECT)$")
    admin_notes: Optional[str] = Field(None, max_length=500)
