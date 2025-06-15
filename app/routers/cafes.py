from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from typing import List, Optional, Set
from app.database import database
from app.models import cafes
from app.routers.user import get_current_user, UserProfile
from sqlalchemy import select, and_, or_, func, cast, Float
import json


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
    open_time: str
    close_time: str
    open_days: List[str]
    price_range_min: int
    price_range_max: int
    lighting: int
    no_time_limit: bool
    power_outlets: int
    noise_level: str
    payment_methods: List[str]
    wifi_strength: str
    has_toilet: bool

class CafeFilters(BaseModel):
    business_hours_start: Optional[float] = None
    business_hours_end: Optional[float] = None
    open_days: Optional[List[str]] = None
    price_min: Optional[int] = None
    price_max: Optional[int] = None
    lighting: Optional[int] = None
    no_time_limit: Optional[bool] = None
    power_outlets: Optional[int] = None
    noise_level: Optional[str] = None
    payment_methods: Optional[List[str]] = None
    wifi_strength: Optional[str] = None
    has_toilet: Optional[bool] = None

def time_to_float(time_str: str) -> float:
    """將時間字符串 (HH:MM) 轉換為浮點數表示"""
    if not time_str or ":" not in time_str:
        return 0.0
    
    hour, minute = time_str.split(":")
    return float(hour) + float(minute) / 60

def float_to_time(time_float: float) -> str:
    """將浮點數表示的時間轉換為時間字符串 (HH:MM)"""
    hour = int(time_float)
    minute = int((time_float - hour) * 60)
    return f"{hour:02d}:{minute:02d}"

@router.get("/", response_model=List[CafeOut])
async def list_cafes(
    business_hours_start: Optional[float] = Query(None, description="營業開始時間 (24小時制浮點數, 例如 9.5 代表 9:30)"),
    business_hours_end: Optional[float] = Query(None, description="營業結束時間 (24小時制浮點數)"),
    open_days: Optional[str] = Query(None, description="營業日 (逗號分隔, 例如 'monday,tuesday')"),
    price_min: Optional[int] = Query(None, description="最低價格"),
    price_max: Optional[int] = Query(None, description="最高價格"),
    lighting: Optional[int] = Query(None, description="光線程度 (1-5)"),
    no_time_limit: Optional[bool] = Query(None, description="是否不限時"),
    power_outlets: Optional[int] = Query(None, description="插座數量 (0-3)"),
    noise_level: Optional[str] = Query(None, description="吵雜程度 (quiet, moderate, noisy)"),
    payment_methods: Optional[str] = Query(None, description="支付方式 (逗號分隔, 例如 'electronic,cash')"),
    wifi_strength: Optional[str] = Query(None, description="WiFi 强度 (none, weak, strong)"),
    has_toilet: Optional[bool] = Query(None, description="是否有廁所"),
    current_user: UserProfile = Depends(get_current_user)
):
    conditions = []
    
    if business_hours_start is not None:
        conditions.append(func.cast(func.substring_index(cafes.c.open_time, ':', 1), Float) + 
                         func.cast(func.substring_index(cafes.c.open_time, ':', -1), Float) / 60 <= business_hours_start)
    
    if business_hours_end is not None:
        conditions.append(func.cast(func.substring_index(cafes.c.close_time, ':', 1), Float) + 
                         func.cast(func.substring_index(cafes.c.close_time, ':', -1), Float) / 60 >= business_hours_end)
    
    if open_days:
        requested_days = open_days.split(',')
        for day in requested_days:
            conditions.append(func.json_contains(cafes.c.open_days, f'"{day}"'))
    
    if price_min is not None:
        conditions.append(cafes.c.price_range_min >= price_min)
    
    if price_max is not None:
        conditions.append(cafes.c.price_range_max <= price_max)
    
    if lighting is not None:
        conditions.append(cafes.c.lighting == lighting)
    
    if no_time_limit is not None:
        conditions.append(cafes.c.no_time_limit == no_time_limit)
    
    if power_outlets is not None:
        conditions.append(cafes.c.power_outlets >= power_outlets)
    
    if noise_level is not None:
        conditions.append(cafes.c.noise_level == noise_level)
    
    if payment_methods:
        requested_methods = payment_methods.split(',')
        for method in requested_methods:
            conditions.append(func.json_contains(cafes.c.payment_methods, f'"{method}"'))
    
    if wifi_strength is not None:
        conditions.append(cafes.c.wifi_strength == wifi_strength)
    
    if has_toilet is not None:
        conditions.append(cafes.c.has_toilet == has_toilet)
    
    query = select(
        cafes.c.id,
        cafes.c.name,
        cafes.c.lat,
        cafes.c.lng,
        cafes.c.rating, 
        cafes.c.reviews,
        cafes.c.img,
        cafes.c.map_link,
        cafes.c.open_time,
        cafes.c.close_time,
        cafes.c.open_days,
        cafes.c.price_range_min,
        cafes.c.price_range_max,
        cafes.c.lighting,
        cafes.c.no_time_limit,
        cafes.c.power_outlets,
        cafes.c.noise_level,
        cafes.c.payment_methods,
        cafes.c.wifi_strength,
        cafes.c.has_toilet,
    )
    
    if conditions:
        query = query.where(and_(*conditions))
    
    rows = await database.fetch_all(query)
    
    result = []
    for row in rows:
        cafe_dict = dict(row)
        if isinstance(cafe_dict['open_days'], str):
            cafe_dict['open_days'] = json.loads(cafe_dict['open_days'])
        if isinstance(cafe_dict['payment_methods'], str):
            cafe_dict['payment_methods'] = json.loads(cafe_dict['payment_methods'])
        result.append(cafe_dict)
    
    return result

@router.post("/filter", response_model=List[CafeOut])
async def filter_cafes(
    filters: CafeFilters,
    current_user: UserProfile = Depends(get_current_user)
):
    """使用 POST 請求篩選咖啡廳，適用於複雜篩選條件"""
    
    conditions = []
    
    if filters.business_hours_start is not None:
        open_time_float = func.cast(func.substring_index(cafes.c.open_time, ':', 1), Float) + \
                         func.cast(func.substring_index(cafes.c.open_time, ':', -1), Float) / 60
        conditions.append(open_time_float <= filters.business_hours_start)
    
    if filters.business_hours_end is not None:
        close_time_float = func.cast(func.substring_index(cafes.c.close_time, ':', 1), Float) + \
                          func.cast(func.substring_index(cafes.c.close_time, ':', -1), Float) / 60
        conditions.append(close_time_float >= filters.business_hours_end)
    
    if filters.open_days:
        for day in filters.open_days:
            conditions.append(func.json_contains(cafes.c.open_days, f'"{day}"'))
    
    if filters.price_min is not None:
        conditions.append(cafes.c.price_range_min >= filters.price_min)
    
    if filters.price_max is not None:
        conditions.append(cafes.c.price_range_max <= filters.price_max)
    
    if filters.lighting is not None:
        conditions.append(cafes.c.lighting == filters.lighting)
    
    if filters.no_time_limit is not None:
        conditions.append(cafes.c.no_time_limit == filters.no_time_limit)
    
    if filters.power_outlets is not None:
        conditions.append(cafes.c.power_outlets >= filters.power_outlets)
    
    if filters.noise_level is not None:
        conditions.append(cafes.c.noise_level == filters.noise_level)
    
    if filters.payment_methods:
        for method in filters.payment_methods:
            conditions.append(func.json_contains(cafes.c.payment_methods, f'"{method}"'))
    
    if filters.wifi_strength is not None:
        conditions.append(cafes.c.wifi_strength == filters.wifi_strength)
    
    if filters.has_toilet is not None:
        conditions.append(cafes.c.has_toilet == filters.has_toilet)
    
    query = select(
        cafes.c.id,
        cafes.c.name,
        cafes.c.lat,
        cafes.c.lng,
        cafes.c.rating, 
        cafes.c.reviews,
        cafes.c.img,
        cafes.c.map_link,
        cafes.c.open_time,
        cafes.c.close_time,
        cafes.c.open_days,
        cafes.c.price_range_min,
        cafes.c.price_range_max,
        cafes.c.lighting,
        cafes.c.no_time_limit,
        cafes.c.power_outlets,
        cafes.c.noise_level,
        cafes.c.payment_methods,
        cafes.c.wifi_strength,
        cafes.c.has_toilet,
    )
    
    if conditions:
        query = query.where(and_(*conditions))
    
    rows = await database.fetch_all(query)
    
    result = []
    for row in rows:
        cafe_dict = dict(row)
        if isinstance(cafe_dict['open_days'], str):
            cafe_dict['open_days'] = json.loads(cafe_dict['open_days'])
        if isinstance(cafe_dict['payment_methods'], str):
            cafe_dict['payment_methods'] = json.loads(cafe_dict['payment_methods'])
        result.append(cafe_dict)

    print(f"Filtered cafes: {len(result)} found: {result}")
    
    return result