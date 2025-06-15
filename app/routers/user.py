from fastapi import APIRouter, HTTPException, Depends, Header, File, UploadFile, Form
from fastapi import Request
from typing import List
from uuid import uuid4, UUID
from app.database import database
from app.schemas.user import UserRegister, UserProfile, UserLogin, FriendRequest, CheckInCreate
from app.models import users, checkins, matches 
from passlib.context import CryptContext
from app.utils.jwt import create_access_token, verify_token
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from app.core import SECRET_KEY, ALGORITHM
import logging
from dotenv import load_dotenv
import os
from sqlalchemy import select, or_, and_
from typing import List, Optional
import shutil
import aiofiles
from datetime import datetime

load_dotenv()

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


async def get_current_user(request: Request) -> UserProfile:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="缺少或錯誤的 Authorization header")

    token = auth_header[len("Bearer "):]

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Token 無效")

        query = users.select().where(users.c.id == user_id)
        user_record = await database.fetch_one(query)
        if not user_record:
            raise HTTPException(status_code=404, detail="使用者不存在")

        return UserProfile(
            id=user_record["id"],
            name=user_record["name"],
            email=user_record["email"],
            travel_preferences=user_record["travel_preferences"].split(",") if user_record["travel_preferences"] else []
        )

    except JWTError as e:
        raise HTTPException(status_code=401, detail="Token 驗證失敗")

@router.get("/all")
async def list_friends(current_user: UserProfile = Depends(get_current_user)):
    query = matches.select().where(
        (matches.c.user_id == str(current_user.id)) | 
        (matches.c.matched_user_id == str(current_user.id))
    )
    match_rows = await database.fetch_all(query)

    friend_ids = set()
    for row in match_rows:
        if row["user_id"] != str(current_user.id):
            friend_ids.add(row["user_id"])
        if row["matched_user_id"] != str(current_user.id):
            friend_ids.add(row["matched_user_id"])

    if not friend_ids:
        return []

    user_query = users.select().where(users.c.id.in_(list(friend_ids)))
    user_rows = await database.fetch_all(user_query)

    return [
        {
            "id": row["id"],
            "name": row["name"],
            "email": row["email"]
        }
        for row in user_rows
    ]

@router.get("/{user_id}", response_model=UserProfile)
async def get_user_by_id(user_id: str, current_user: dict = Depends(get_current_user)):
    query = users.select().where(users.c.id == user_id)
    user = await database.fetch_one(query)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "id": user["id"],
        "name": user["name"],
        "email": user["email"],
        "travel_preferences": user["travel_preferences"].split(",") if user["travel_preferences"] else []
    }

@router.get("/{user_id}/friends")
async def get_friends(user_id: str):
    match_query = select(
        matches.c.user_id,
        matches.c.matched_user_id
    ).where(
        or_(
            matches.c.user_id == user_id,
            matches.c.matched_user_id == user_id
        )
    )

    match_rows = await database.fetch_all(match_query)

    friend_ids = {
        row["matched_user_id"] if row["user_id"] == user_id else row["user_id"]
        for row in match_rows
    }

    if not friend_ids:
        return []

    user_query = select(
        users.c.id,
        users.c.name,
        users.c.avatar_url
    ).where(users.c.id.in_(friend_ids))

    friends = await database.fetch_all(user_query)
    return friends

@router.post("/{user_id}/friends/add")
async def add_friend(user_id: str, req: FriendRequest, current_user: dict = Depends(get_current_user)):
    if req.target_user_id == user_id:
        raise HTTPException(status_code=400, detail="不能加自己為好友")

    if current_user["id"] != user_id:
        raise HTTPException(status_code=403, detail="沒有權限新增他人好友")

    query = matches.select().where(
        or_(
            and_(matches.c.user_id == user_id, matches.c.matched_user_id == req.target_user_id),
            and_(matches.c.user_id == req.target_user_id, matches.c.matched_user_id == user_id)
        )
    )
    existing = await database.fetch_one(query)
    if existing:
        return {"message": "已經是好友"}

    match_id = str(uuid4())
    insert_query = matches.insert().values(
        match_id=match_id,
        user_id=user_id,
        matched_user_id=req.target_user_id
    )
    await database.execute(insert_query)
    return {"message": "好友已新增"}

@router.post("/login")
async def login(user: UserLogin):
    query = users.select().where(users.c.email == user.email)
    user_record = await database.fetch_one(query)

    if not user_record or not pwd_context.verify(user.password, user_record["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({"sub": user_record["id"]})
    return {"token": token, "userId": user_record["id"]}


@router.post("/register")
async def register(user: UserRegister):
    query = users.select().where(users.c.email == user.email)
    existing_user = await database.fetch_one(query)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_pw = pwd_context.hash(user.password)
    user_id = str(uuid4())
    prefs_str = ",".join(user.travel_preferences) if user.travel_preferences else ""

    insert_query = users.insert().values(
        id=user_id,
        email=user.email,
        name=user.name,
        travel_preferences=prefs_str,
        password=hashed_pw
    )
    await database.execute(insert_query)
    return {"user_id": user_id}

@router.get("/profile", response_model=UserProfile)
async def get_profile(current_user: UserProfile = Depends(get_current_user)):
    return current_user

@router.put("/profile")
async def update_profile(profile: UserRegister, current_user: UserProfile = Depends(get_current_user)):
    prefs_str = ",".join(profile.travel_preferences) if profile.travel_preferences else ""

    update_query = users.update().where(users.c.id == str(current_user.id)).values(
        name=profile.name,
        travel_preferences=prefs_str
    )
    await database.execute(update_query)
    return {"message": "Profile updated"}

@router.get("/all")
async def list_users(current_user: UserProfile = Depends(get_current_user)):
    query = users.select()
    rows = await database.fetch_all(query)
    return [
        {
            "id": row["id"],
            "name": row["name"],
            "email": row["email"]
        }
        for row in rows
    ]

@router.get("/{user_id}/checkins")
async def show_my_checkins(user_id: str, current_user: Optional[UserProfile] = Depends(get_current_user)):
    if str(current_user.id) == user_id:
        query = checkins.select().where(checkins.c.user_id == user_id)
    else:
        query = checkins.select().where(
            and_(
                checkins.c.user_id == user_id,
                checkins.c.visibility == "public"
            )
        )
    
    results = await database.fetch_all(query)

    return [
        {
            "id": row["id"],
            "location_name": row["location_name"],
            "timestamp": row["timestamp"],
            "comment": row["comment"],  
            "lat": row["latitude"],
            "lng": row["longitude"],
            "visibility": row["visibility"],
            "has_image": row["image_data"] is not None,
        }
        for row in results
    ]

@router.get("/{user_id}/friends")
async def get_friends(user_id: str, current_user: UserProfile = Depends(get_current_user)):
    """獲取用戶的好友列表"""
    
    # 檢查是否有權限查看好友列表
    if str(current_user.id) != user_id and not await is_admin(current_user.id):
        raise HTTPException(status_code=403, detail="無權訪問此用戶的好友列表")
    
    match_query = """
    SELECT user_id, matched_user_id 
    FROM matches 
    WHERE user_id = :user_id OR matched_user_id = :user_id
    """
    
    match_rows = await database.fetch_all(
        query=match_query,
        values={"user_id": user_id}
    )
    
    friend_ids = {
        row["matched_user_id"] if row["user_id"] == user_id else row["user_id"]
        for row in match_rows
    }
    
    if not friend_ids:
        return []
    
    user_query = """
    SELECT id, name, avatar_url 
    FROM users 
    WHERE id IN :friend_ids
    """
    
    friends = await database.fetch_all(
        query=user_query,
        values={"friend_ids": tuple(friend_ids) if len(friend_ids) > 1 else f"('{list(friend_ids)[0]}')" }
    )
    
    return [
        {
            "id": friend["id"],
            "name": friend["name"],
            "avatar_url": friend["avatar_url"]
        }
        for friend in friends
    ]

# 添加刪除好友功能
@router.delete("/{user_id}/friends/{friend_id}")
async def remove_friend(
    user_id: str, 
    friend_id: str, 
    current_user: UserProfile = Depends(get_current_user)
):
    """刪除好友關係"""
    
    # 驗證當前用戶
    if str(current_user.id) != user_id:
        raise HTTPException(status_code=403, detail="無權刪除此用戶的好友")
    
    # 檢查好友關係是否存在
    check_query = """
    SELECT match_id FROM matches 
    WHERE (user_id = :user_id AND matched_user_id = :friend_id)
       OR (user_id = :friend_id AND matched_user_id = :user_id)
    """
    
    match = await database.fetch_one(
        query=check_query,
        values={
            "user_id": user_id,
            "friend_id": friend_id
        }
    )
    
    if not match:
        raise HTTPException(status_code=404, detail="好友關係不存在")
    
    # 刪除好友關係
    delete_query = """
    DELETE FROM matches 
    WHERE (user_id = :user_id AND matched_user_id = :friend_id)
       OR (user_id = :friend_id AND matched_user_id = :user_id)
    """
    
    await database.execute(
        query=delete_query,
        values={
            "user_id": user_id,
            "friend_id": friend_id
        }
    )
    
    return {"message": "好友已刪除"}