from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List
from app.database import database
from app.models import cafes
from app.routers.user import get_current_user, UserProfile
from sqlalchemy import select, func, cast, Float


router = APIRouter()

class CafeOut(BaseModel):
    id: int
    name: str
    rating: str
    reviews: int
    img: str
    lat: float
    lng: float
    map_link: str

@router.get("/", response_model=List[CafeOut])
async def list_cafes(current_user: UserProfile = Depends(get_current_user)):
    query = select(
        cafes.c.id,
        cafes.c.name,
        cafes.c.lat,
        cafes.c.lng,
        cafes.c.rating, 
        cafes.c.reviews,
        cafes.c.img,
        cafes.c.map_link,
    )
    rows = await database.fetch_all(query)
    return [dict(row) for row in rows]
