from fastapi import APIRouter, Depends, HTTPException
from typing import List
from uuid import uuid4
from pydantic import BaseModel
from app.database import database
from app.models import location_reviews
from app.routers.user import get_current_user, UserProfile
from sqlalchemy import select, join
from app.models import location_reviews, users

router = APIRouter()

class LocationReviewCreate(BaseModel):
    checkin_id: str
    rating: int
    comment: str

class LocationReviewInfo(LocationReviewCreate):
    id: str
    reviewer_id: str
    created_at: str

@router.post("/", response_model=dict)
async def create_location_review(review: LocationReviewCreate, current_user: UserProfile = Depends(get_current_user)):
    if not (1 <= review.rating <= 5):
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")

    review_id = str(uuid4())
    await database.execute(location_reviews.insert().values(
        id=review_id,
        checkin_id=review.checkin_id,
        reviewer_id=str(current_user.id),
        rating=review.rating,
        comment=review.comment
    ))
    return {"id": review_id}

@router.get("/checkin/{checkin_id}", response_model=List[dict])
async def get_reviews_for_checkin(checkin_id: str):
    j = join(location_reviews, users, location_reviews.c.reviewer_id == users.c.id)
    query = select(
        location_reviews.c.id,
        location_reviews.c.reviewer_id,
        location_reviews.c.comment,
        location_reviews.c.rating,
        location_reviews.c.created_at,
        users.c.name.label("reviewer_name")
    ).select_from(j).where(location_reviews.c.checkin_id == checkin_id)

    rows = await database.fetch_all(query)
    return [dict(row) for row in rows]