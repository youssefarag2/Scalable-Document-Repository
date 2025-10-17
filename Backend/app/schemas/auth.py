import email
from pydantic import BaseModel, EmailStr, Field
from typing import Optional


class RegisterRequest(BaseModel):
    name: str = Field(min_length=1, max_length= 150)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    department_id: Optional[int] = None
    role: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class MeResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: Optional[str]
    department_id: Optional[int]
    department_name: Optional[str]