from typing import Optional

from pydantic import BaseModel, Field


class GalleryImageCreate(BaseModel):
    image_url: str
    image_path: str
    caption: Optional[str] = Field(None, max_length=200)
    sort_order: int = 0
    active: bool = True


class GalleryImageUpdate(BaseModel):
    image_url: Optional[str] = None
    image_path: Optional[str] = None
    caption: Optional[str] = Field(None, max_length=200)
    sort_order: Optional[int] = None
    active: Optional[bool] = None
