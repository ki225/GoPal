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

class FriendRequest(BaseModel):
    target_user_id: str

class CheckInCreate(BaseModel):
    location_name: str
    latitude: float
    longitude: float
    comment: Optional[str] = None
    visibility: str = "public"
    image_url: Optional[str] = None