from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from uuid import uuid4, UUID
from pydantic import BaseModel
from app.database import database
from app.models import plans
from app.routers.user import get_current_user, UserProfile

router = APIRouter()

class PlanCreate(BaseModel):
    title: str
    destination: str
    start_date: str
    end_date: str
    description: Optional[str] = None

class PlanInfo(PlanCreate):
    plan_id: UUID
    user_id: UUID

@router.post("/")
async def create_plan(plan: PlanCreate, current_user: UserProfile = Depends(get_current_user)):
    plan_id = str(uuid4())
    await database.execute(plans.insert().values(
        plan_id=plan_id,
        user_id=str(current_user.id),
        title=plan.title,
        destination=plan.destination,
        start_date=plan.start_date,
        end_date=plan.end_date,
        description=plan.description
    ))
    return {"plan_id": plan_id}

@router.get("/", response_model=List[PlanInfo])
async def list_plans(current_user: UserProfile = Depends(get_current_user)):
    query = plans.select().where(plans.c.user_id == str(current_user.id))
    rows = await database.fetch_all(query)
    return [PlanInfo(
        plan_id=row["plan_id"],
        user_id=row["user_id"],
        title=row["title"],
        destination=row["destination"],
        start_date=str(row["start_date"]),
        end_date=str(row["end_date"]),
        description=row["description"]
    ) for row in rows]

@router.get("/{plan_id}", response_model=PlanInfo)
async def get_plan(plan_id: UUID, current_user: UserProfile = Depends(get_current_user)):
    query = plans.select().where(plans.c.plan_id == str(plan_id))
    row = await database.fetch_one(query)
    if not row or row["user_id"] != str(current_user.id):
        raise HTTPException(status_code=404, detail="Plan not found")
    return PlanInfo(
        plan_id=row["plan_id"],
        user_id=row["user_id"],
        title=row["title"],
        destination=row["destination"],
        start_date=str(row["start_date"]),
        end_date=str(row["end_date"]),
        description=row["description"]
    )