from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from uuid import uuid4, UUID
from pydantic import BaseModel
from app.database import database
from app.models import matches, users
from app.routers.user import get_current_user, UserProfile

router = APIRouter()

class MatchRequest(BaseModel):
    destination: str
    start_date: str
    end_date: str
    preferences: Optional[List[str]] = []

class MatchInfo(BaseModel):
    match_id: UUID
    user_id: UUID
    matched_user_id: UUID
    destination: str
    start_date: str
    end_date: str

@router.post("/search", response_model=List[MatchInfo])
async def search_match(request: MatchRequest, current_user: UserProfile = Depends(get_current_user)):
    query = users.select().where(users.c.id != str(current_user.id))
    all_users = await database.fetch_all(query)
    results = []

    for user in all_users:
        prefs = user["travel_preferences"].split(",") if user["travel_preferences"] else []
        if request.destination in prefs:
            match_id = str(uuid4())
            match_record = {
                "match_id": match_id,
                "user_id": str(current_user.id),
                "matched_user_id": user["id"],
                "destination": request.destination,
                "start_date": request.start_date,
                "end_date": request.end_date,
            }
            await database.execute(matches.insert().values(match_record))
            results.append(MatchInfo(**match_record))
    return results