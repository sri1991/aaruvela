from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

PLACEMENT_PATTERN = "^(HOME_BANNER|NEWS_LIST|MATRIMONY|FOOTER)$"


class AdCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=200)
    subtitle: Optional[str] = Field(None, max_length=300)
    image_url: Optional[str] = None
    image_path: Optional[str] = None
    target_url: Optional[str] = Field(None, max_length=500)
    placement: str = Field("HOME_BANNER", pattern=PLACEMENT_PATTERN)
    advertiser_name: Optional[str] = Field(None, max_length=200)
    contact_info: Optional[str] = Field(None, max_length=200)
    payment_ref: Optional[str] = Field(None, max_length=100)
    sort_order: int = 0
    active: bool = True
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None


class AdUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=2, max_length=200)
    subtitle: Optional[str] = Field(None, max_length=300)
    image_url: Optional[str] = None
    image_path: Optional[str] = None
    target_url: Optional[str] = Field(None, max_length=500)
    placement: Optional[str] = Field(None, pattern=PLACEMENT_PATTERN)
    advertiser_name: Optional[str] = Field(None, max_length=200)
    contact_info: Optional[str] = Field(None, max_length=200)
    payment_ref: Optional[str] = Field(None, max_length=100)
    sort_order: Optional[int] = None
    active: Optional[bool] = None
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None
