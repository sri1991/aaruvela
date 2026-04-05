from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional
from datetime import date, time
from typing import Literal


def _word_count(text: str) -> int:
    return len(text.split()) if text else 0


class MatrimonyProfileCreate(BaseModel):
    parishat_id: Optional[str] = None
    full_name: str
    gender: Literal["MALE", "FEMALE"]
    father_guardian_name: Optional[str] = None
    age: Optional[int] = None
    dob: date
    tob: time
    gotram: Optional[str] = None
    star_with_pada: Optional[str] = None
    occupation: Optional[str] = None
    annual_income: Optional[str] = None
    particulars: Optional[str] = None
    requirement: Optional[str] = None
    contact_no: Optional[str] = None
    email: Optional[EmailStr] = None
    photo_url: str  # mandatory
    payment_reference: str  # mandatory

    @field_validator("particulars")
    @classmethod
    def particulars_word_limit(cls, v):
        if v and _word_count(v) > 100:
            raise ValueError("Particulars must not exceed 100 words")
        return v

    @field_validator("requirement")
    @classmethod
    def requirement_word_limit(cls, v):
        if v and _word_count(v) > 50:
            raise ValueError("Requirements must not exceed 50 words")
        return v

    @field_validator("photo_url")
    @classmethod
    def photo_required(cls, v):
        if not v or not v.strip():
            raise ValueError("Profile photo is required")
        return v

    @field_validator("payment_reference")
    @classmethod
    def payment_ref_required(cls, v):
        if not v or not v.strip():
            raise ValueError("Payment reference is required")
        return v


class MatrimonyRenewRequest(BaseModel):
    payment_reference: str


class MatrimonyProfileResponse(BaseModel):
    id: str
    user_id: str
    parishat_id: Optional[str]
    full_name: str
    gender: str
    father_guardian_name: Optional[str]
    age: Optional[int]
    dob: date
    tob: time
    gotram: Optional[str]
    star_with_pada: Optional[str]
    occupation: Optional[str]
    annual_income: Optional[str]
    particulars: Optional[str]
    requirement: Optional[str]
    contact_no: Optional[str]
    email: Optional[EmailStr]
    photo_url: Optional[str]
    payment_status: str
    status: str
    subscription_expires_at: Optional[str]
    created_at: str

    class Config:
        from_attributes = True


class MatrimonyMatchResponse(BaseModel):
    id: str
    full_name: str
    gender: str
    age: Optional[int]
    gotram: Optional[str]
    star_with_pada: Optional[str]
    occupation: Optional[str]
    photo_url: Optional[str]
    # Limiting exposed full fields until detailed view is clicked
