from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from uuid import uuid4
from app.database import database
from app.models import checkins
from app.routers.user import get_current_user, UserProfile

router = APIRouter()

class Coordinates(BaseModel):
    lat: float
    lng: float

class CheckInCreate(BaseModel):
    location_name: str
    coordinates: Coordinates
    description: str = ""
    is_public: bool = True

@router.post("/checkins")
async def create_checkin(data: CheckInCreate, current_user: UserProfile = Depends(get_current_user)):
    await database.execute(checkins.insert().values(
        id=str(uuid4()),
        user_id=str(current_user.id),
        location_name=data.location_name,
        coordinates={"lat": data.coordinates.lat, "lng": data.coordinates.lng},
        description=data.description,
        is_public=data.is_public,
    ))
    return {"message": "打卡成功"}

@router.get("/checkins")
async def list_checkins(current_user: UserProfile = Depends(get_current_user)):
    query = checkins.select().where(
        (checkins.c.visibility == "public") | (checkins.c.user_id == str(current_user.id))
    )
    return await database.fetch_all(query)
