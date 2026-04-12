from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List
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
    place_of_birth: Optional[str] = None
    current_city: Optional[str] = None
    occupation: Optional[str] = None
    annual_income: Optional[str] = None
    sub_sect: Optional[str] = None   # AID members only — 'Yes' | 'No'
    sect_no: Optional[str] = None    # AID members only — 'Yes' | 'No'
    brothers: Optional[int] = None
    sisters: Optional[int] = None
    willing_to_relocate: Optional[bool] = None
    particulars: Optional[str] = None
    requirement: Optional[str] = None
    contact_no: Optional[str] = None
    email: Optional[EmailStr] = None
    photos: List[str]  # mandatory, 1–3 URLs
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

    @field_validator("photos")
    @classmethod
    def photos_required(cls, v):
        if not v or len(v) == 0:
            raise ValueError("At least one profile photo is required")
        if len(v) > 3:
            raise ValueError("Maximum 3 photos allowed")
        if any(not url or not url.strip() for url in v):
            raise ValueError("Photo URLs must not be empty")
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
    place_of_birth: Optional[str]
    current_city: Optional[str]
    occupation: Optional[str]
    annual_income: Optional[str]
    sub_sect: Optional[str]
    sect_no: Optional[str]
    brothers: Optional[int]
    sisters: Optional[int]
    willing_to_relocate: Optional[bool]
    particulars: Optional[str]
    requirement: Optional[str]
    contact_no: Optional[str]
    email: Optional[EmailStr]
    photo_url: Optional[str]
    photos: Optional[List[str]]
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
    current_city: Optional[str]
    photo_url: Optional[str]
    photos: Optional[List[str]]
    # Limiting exposed full fields until detailed view is clicked
