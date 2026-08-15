from pydantic import BaseModel, Field
from typing import Optional


# Document types. There is deliberately no "NEWS" here — short, timely notices
# are Announcements, which are public and text-based. Articles are documents.
CATEGORY_PATTERN = "^(ARTICLE|CIRCULAR|MAGAZINE)$"


class ArticleSubmitRequest(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    summary: Optional[str] = Field(None, max_length=500)
    category: str = Field("ARTICLE", pattern=CATEGORY_PATTERN)
    pdf_url: str
    pdf_path: str


class ArticlePublishRequest(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    summary: Optional[str] = Field(None, max_length=500)
    category: str = Field("ARTICLE", pattern=CATEGORY_PATTERN)
    pdf_url: str
    pdf_path: str


class ArticleReviewRequest(BaseModel):
    action: str = Field(..., pattern="^(APPROVE|REJECT)$")
    admin_notes: Optional[str] = None
