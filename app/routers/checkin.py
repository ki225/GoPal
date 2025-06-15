from fastapi import APIRouter, Depends, HTTPException, Response, File, UploadFile, Form
from typing import Optional
from uuid import uuid4
from app.database import database
from app.models import checkins
from app.routers.user import get_current_user, UserProfile

router = APIRouter()

async def user_validation(user_id):
    user_check_query = "SELECT id FROM users WHERE id = :user_id"
    user_exists = await database.fetch_one(
        query=user_check_query,
        values={"user_id": user_id}
    )
    
    if not user_exists:
        print(f"用戶 ID '{user_id}' 在數據庫中不存在")
        valid_id = "c5602952-d706-4e13-9778-6417e4db27e3"
        test_query = "SELECT id FROM users WHERE id = :valid_id"
        test_result = await database.fetch_one(
            query=test_query,
            values={"valid_id": valid_id}
        )
        
        if test_result:
            print(f"但有效的 ID '{valid_id}' 可以找到用戶")
        
        raise HTTPException(
            status_code=400, 
            detail=f"用戶 ID '{user_id}' 在數據庫中不存在"
        )

@router.post("/")
async def create_checkin(
    location_name: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    comment: Optional[str] = Form(None),
    visibility: str = Form("public"),
    image: Optional[UploadFile] = File(None),
    current_user: UserProfile = Depends(get_current_user)
):
    """創建新的打卡記錄，圖片數據直接存入數據庫"""
    
    checkin_id = str(uuid4())
    
    image_data = None
    image_format = None
    
    if image and image.filename:
        try:
            image_data = await image.read()
            image_format = image.content_type
            
            if not image_format.startswith('image/'):
                raise HTTPException(status_code=400, detail="只支持圖片文件")
            
            if len(image_data) > 10 * 1024 * 1024:
                raise HTTPException(status_code=400, detail="圖片大小不能超過 10MB")
        
        except Exception as e:
            print(f"處理圖片時發生錯誤: {str(e)}")
            raise HTTPException(status_code=500, detail=f"處理圖片失敗: {str(e)}")
    
    query = """
    INSERT INTO checkins (id, user_id, location_name, latitude, longitude, 
                         comment, visibility, image_data, image_format, timestamp)
    VALUES (:id, :user_id, :location_name, :latitude, :longitude, 
           :comment, :visibility, :image_data, :image_format, NOW())
    """
    
    user_id = str(current_user.id).replace('-', '-')
    
    try:
        user_validation(user_id)
        await database.execute(
            query=query,
            values={
                "id": checkin_id,
                "user_id": user_id,
                "location_name": location_name,
                "latitude": latitude,
                "longitude": longitude,
                "comment": comment,
                "visibility": visibility,
                "image_data": image_data,
                "image_format": image_format
            }
        )
        
        return {
            "id": checkin_id,
            "has_image": image_data is not None
        }
        
    except Exception as e:
        print(f"創建打卡記錄時發生錯誤: {str(e)}")
        raise HTTPException(status_code=500, detail=f"創建打卡失敗: {str(e)}")

@router.get("/")
async def get_checkins(
    current_user: UserProfile = Depends(get_current_user),
    limit: int = 20,
    offset: int = 0
):
    """獲取打卡列表，包含用戶名"""
    
    query = """
    SELECT 
        c.id, c.user_id, c.location_name, c.latitude, c.longitude, c.timestamp, 
        c.visibility, c.comment, 
        CASE WHEN c.image_data IS NOT NULL THEN TRUE ELSE FALSE END as has_image,
        u.name  -- 添加用戶名
    FROM checkins c
    LEFT JOIN users u ON c.user_id = u.id  -- 關聯用戶表
    WHERE 
        c.user_id = :user_id OR 
        (c.visibility = 'public')
    ORDER BY c.timestamp DESC
    LIMIT :limit OFFSET :offset
    """
    
    results = await database.fetch_all(
        query=query, 
        values={
            "user_id": current_user.id,
            "limit": limit,
            "offset": offset
        }
    )
    
    return [
        {
            "id": row.id,
            "user_id": row.user_id,
            "location_name": row.location_name,
            "lat": row.latitude,
            "lng": row.longitude,
            "timestamp": row.timestamp.isoformat() if row.timestamp else None,
            "visibility": row.visibility,
            "comment": row.comment,
            "has_image": row.has_image,
            "is_owner": row.user_id == current_user.id,
            "username": row.name  
        }
        for row in results
    ]

@router.get("/{checkin_id}/image")
async def get_checkin_image(checkin_id: str):
    """獲取打卡記錄的圖片"""
    
    query = "SELECT image_data, image_format FROM checkins WHERE id = :checkin_id"
    result = await database.fetch_one(query=query, values={"checkin_id": checkin_id})
    
    if not result or not result.image_data:
        raise HTTPException(status_code=404, detail="找不到圖片")
    
    content_type = result.image_format if result.image_format else "image/jpeg"
    
    return Response(
        content=result.image_data,
        media_type=content_type
    )