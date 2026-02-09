from pydantic import BaseModel, Field
from typing import Optional


class SetPINRequest(BaseModel):
    """Request model for setting a user's PIN"""
    pin: str = Field(..., min_length=4, max_length=4, pattern="^[0-9]{4}$")
    
    class Config:
        json_schema_extra = {
            "example": {
                "pin": "1234"
            }
        }


class VerifyPINRequest(BaseModel):
    """Request model for verifying a user's PIN"""
    identifier: str = Field(..., description="Email or phone number")
    pin: str = Field(..., min_length=4, max_length=4, pattern="^[0-9]{4}$")
    
    class Config:
        json_schema_extra = {
            "example": {
                "identifier": "user@example.com",
                "pin": "1234"
            }
        }


class UnlockAccountRequest(BaseModel):
    """Request model for unlocking a locked account (admin only)"""
    user_id: str = Field(..., description="User UUID to unlock")
    
    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "123e4567-e89b-12d3-a456-426614174000"
            }
        }


class AuthResponse(BaseModel):
    """Response model for successful authentication"""
    access_token: str
    token_type: str = "bearer"
    user_id: str
    identifier: str
    role: Optional[str] = None
    status: str


class MessageResponse(BaseModel):
    """Generic message response"""
    message: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "message": "Operation successful"
            }
        }


class RegisterRequest(BaseModel):
    """Request model for user registration"""
    phone: str = Field(..., example="+919876543210")
    pin: str = Field(..., min_length=4, max_length=4, pattern="^[0-9]{4}$", example="1234")
    full_name: str = Field(..., example="John Doe")


class LoginRequest(BaseModel):
    """Request model for phone/PIN login"""
    phone: str = Field(..., example="+919876543210")
    pin: str = Field(..., min_length=4, max_length=4, pattern="^[0-9]{4}$", example="1234")
