from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from datetime import date, time
from decimal import Decimal

class UserBioData(BaseModel):
    father_guardian_name: Optional[str] = None
    age: Optional[int] = None
    dob: Optional[date] = None
    tob: Optional[time] = None
    gotram: Optional[str] = None
    sub_sect: Optional[str] = None
    occupation: Optional[str] = None
    annual_income: Optional[Decimal] = None
    star_pada: Optional[str] = None
    address: Optional[str] = None
    cell_no: Optional[str] = None
    email: Optional[EmailStr] = None
    photo_url: Optional[str] = None
    payment_proof_url: Optional[str] = None
    requirement: Optional[str] = None
    particulars: Optional[str] = None

class MembershipApplicationRequest(BaseModel):
    requested_role: str = Field(..., pattern="^(PERMANENT|NORMAL|ASSOCIATED)$")
    bio_data: UserBioData

class MembershipApplicationResponse(BaseModel):
    message: str
    application_id: str
    status: str
