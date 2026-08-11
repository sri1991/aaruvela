from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

CATEGORY_PATTERN = "^(GENERAL|EVENT|URGENT|MEETING)$"
STATUS_PATTERN = "^(DRAFT|PUBLISHED|ARCHIVED)$"


class AnnouncementCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    body: str = Field(..., min_length=1, max_length=5000)
    category: str = Field("GENERAL", pattern=CATEGORY_PATTERN)
    image_url: Optional[str] = None
    image_path: Optional[str] = None
    link_url: Optional[str] = Field(None, max_length=500)
    pinned: bool = False
    status: str = Field("PUBLISHED", pattern=STATUS_PATTERN)
    publish_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None


class AnnouncementUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=200)
    body: Optional[str] = Field(None, min_length=1, max_length=5000)
    category: Optional[str] = Field(None, pattern=CATEGORY_PATTERN)
    image_url: Optional[str] = None
    image_path: Optional[str] = None
    link_url: Optional[str] = Field(None, max_length=500)
    pinned: Optional[bool] = None
    status: Optional[str] = Field(None, pattern=STATUS_PATTERN)
    publish_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
