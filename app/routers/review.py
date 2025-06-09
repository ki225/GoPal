from fastapi import APIRouter, Depends, HTTPException
from typing import List
from uuid import uuid4, UUID
from pydantic import BaseModel
from app.database import database
from app.models import reviews
from app.routers.user import get_current_user, UserProfile

router = APIRouter()

class ReviewCreate(BaseModel):
    target_user_id: UUID
    rating: int  # 1~5
    comment: str

class ReviewInfo(ReviewCreate):
    review_id: UUID
    reviewer_id: UUID

@router.post("/")
async def create_review(review: ReviewCreate, current_user: UserProfile = Depends(get_current_user)):
    if review.rating < 1 or review.rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")
    review_id = str(uuid4())
    await database.execute(reviews.insert().values(
        review_id=review_id,
        reviewer_id=str(current_user.id),
        target_user_id=str(review.target_user_id),
        rating=review.rating,
        comment=review.comment
    ))
    return {"review_id": review_id}

@router.get("/target/{user_id}", response_model=List[ReviewInfo])
async def get_reviews(user_id: UUID):
    query = reviews.select().where(reviews.c.target_user_id == str(user_id))
    rows = await database.fetch_all(query)
    return [ReviewInfo(
        review_id=row["review_id"],
        reviewer_id=row["reviewer_id"],
        target_user_id=row["target_user_id"],
        rating=row["rating"],
        comment=row["comment"]
    ) for row in rows]