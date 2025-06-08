from fastapi import APIRouter, HTTPException, Depends, Header
from fastapi import Request
from typing import List
from uuid import uuid4, UUID
from app.database import database
from app.schemas.user import UserRegister, UserProfile, UserLogin
from app.models import users
from passlib.context import CryptContext
from app.utils.jwt import create_access_token, verify_token
from app.models import users, matches 
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from app.core import SECRET_KEY, ALGORITHM
import logging

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# oauth2_scheme = OAuth2PasswordBearer(tokenUrl="users/login")

def get_current_user(request: Request):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="缺少或錯誤的 Authorization header")

    token = auth_header[len("Bearer "):]
    print("後端收到 token:", token)

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Token 無效")
        return UserProfile(id=user_id)
    except JWTError as e:
        print("JWT 錯誤:", str(e))
        raise HTTPException(status_code=401, detail="Token 驗證失敗")

@router.get("/all")
async def list_friends(current_user: UserProfile = Depends(get_current_user)):
    # 找出與當前使用者有 match 關係的 user id（不論誰是 initiator）
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