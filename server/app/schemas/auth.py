"""Request/response schemas for authentication."""
import uuid
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class RegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    email: EmailStr
    role: Literal["STUDENT", "TEACHER"]
    xp: int
    level: int


class AuthResponse(BaseModel):
    user: UserOut
    token: str
