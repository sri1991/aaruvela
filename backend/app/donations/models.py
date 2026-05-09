from pydantic import BaseModel, Field, field_validator
from typing import Optional


class DonationCreate(BaseModel):
    donor_name: str = Field(..., min_length=1, max_length=200)
    phone: str = Field(..., pattern=r"^\d{10}$")
    place: Optional[str] = Field(None, max_length=200)
    amount: float = Field(..., gt=0, le=10_000_000)
    payment_reference: str = Field(..., min_length=4, max_length=100)

    @field_validator("donor_name", "place", "payment_reference")
    @classmethod
    def _strip(cls, v):
        return v.strip() if isinstance(v, str) else v


class DonationVerifyRequest(BaseModel):
    admin_notes: Optional[str] = Field(None, max_length=1000)


class DonationRejectRequest(BaseModel):
    admin_notes: Optional[str] = Field(None, max_length=1000)
