from pydantic import BaseModel, Field


class ChairmanNoticeUpdate(BaseModel):
    pdf_url: str
    pdf_path: str
    file_name: str = Field(..., min_length=1, max_length=200)


class AdminUploadUrlRequest(BaseModel):
    """Ask for a signed upload URL into one of the admin-writable buckets."""
    bucket: str = Field(..., pattern="^(chairman|announcements|ads)$")
    file_name: str = Field(..., min_length=1, max_length=200)
