from pydantic import BaseModel, EmailStr
from typing import List, Optional
from uuid import UUID

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str
    travel_preferences: Optional[List[str]] = []

class UserProfile(BaseModel):
    id: UUID
    email: EmailStr
    name: str
    travel_preferences: List[str]

class UserLogin(BaseModel):
    email: EmailStr
    password: str