from pydantic import BaseModel, Field
from typing import Optional


class ArticleSubmitRequest(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    summary: Optional[str] = Field(None, max_length=500)
    category: str = Field("ARTICLE", pattern="^(NEWS|ARTICLE)$")
    pdf_url: str
    pdf_path: str


class ArticlePublishRequest(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    summary: Optional[str] = Field(None, max_length=500)
    category: str = Field("NEWS", pattern="^(NEWS|ARTICLE)$")
    pdf_url: str
    pdf_path: str


class ArticleReviewRequest(BaseModel):
    action: str = Field(..., pattern="^(APPROVE|REJECT)$")
    admin_notes: Optional[str] = None
