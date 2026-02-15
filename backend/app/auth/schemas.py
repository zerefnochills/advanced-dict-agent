from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional


class UserSignup(BaseModel):
    """Schema for user signup"""
    email: EmailStr
    full_name: str = Field(..., min_length=1, max_length=255)
    password: str = Field(..., min_length=8, max_length=100)


class UserLogin(BaseModel):
    """Schema for user login"""
    email: EmailStr
    password: str
    remember_me: bool = False


class UserResponse(BaseModel):
    """Schema for user data in responses"""
    id: int
    email: str
    full_name: str
    created_at: datetime
    has_api_key: bool = False
    
    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    """Schema for authentication token response"""
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse


class ApiKeyUpdate(BaseModel):
    """Schema for updating API key"""
    api_key: str = Field(..., min_length=10)
