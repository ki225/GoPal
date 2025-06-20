from sqlalchemy import Table, Column, String, MetaData, Date, Integer, Text, TIMESTAMP, Boolean, DateTime, JSON, Float, Enum, DateTime, ForeignKey
from sqlalchemy.dialects.mysql import CHAR, LONGBLOB
from sqlalchemy.sql import func

metadata = MetaData()

users = Table(
    "users",
    metadata,
    Column("id", CHAR(36), primary_key=True),
    Column("email", String(255), unique=True),
    Column("password", String(255)),
    Column("name", String(100)),
    Column("travel_preferences", Text),
    Column("avatar_url", String(255)),
    Column("bio", Text)
)

matches = Table(
    "matches",
    metadata,
    Column("match_id", CHAR(36), primary_key=True),
    Column("user_id", CHAR(36)),
    Column("matched_user_id", CHAR(36)),
    Column("destination", String(255)),
    Column("start_date", Date),
    Column("end_date", Date),
    Column("status", CHAR(36))
)

messages = Table(
    "messages",
    metadata,
    Column("message_id", CHAR(36), primary_key=True),
    Column("sender_id", CHAR(36)),
    Column("receiver_id", CHAR(36)),
    Column("content", Text),
    Column("timestamp", TIMESTAMP, server_default=func.now()),
)

plans = Table(
    "plans",
    metadata,
    Column("plan_id", CHAR(36), primary_key=True),
    Column("user_id", CHAR(36)),
    Column("title", String(255)),
    Column("destination", String(255)),
    Column("start_date", Date),
    Column("end_date", Date),
    Column("description", Text),
)

reviews = Table(
    "reviews",
    metadata,
    Column("review_id", CHAR(36), primary_key=True),
    Column("reviewer_id", CHAR(36)),
    Column("target_user_id", CHAR(36)),
    Column("rating", Integer),
    Column("comment", Text),
    Column("timestamp", TIMESTAMP, server_default=func.now()),
)

location_reviews = Table(
    "location_reviews",
    metadata,
    Column("id", CHAR(36), primary_key=True),
    Column("checkin_id", String),
    Column("reviewer_id", String),
    Column("rating", Integer),
    Column("comment", Text),
    Column("created_at", TIMESTAMP, server_default=func.now())
)

checkins = Table(
    "checkins",
    metadata,
    Column("id", String(36), primary_key=True),
    Column("user_id", String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
    Column("location_name", String(255), nullable=False),
    Column("latitude", Float, nullable=False),
    Column("longitude", Float, nullable=False),
    Column("timestamp", DateTime, nullable=False, server_default=func.now()),
    Column("visibility", Enum("public", "private"), default="public"),
    Column("comment", Text, nullable=True),
    Column("image_url", String(255), nullable=True),
    Column("image_data", LONGBLOB, nullable=True),
    Column("image_format", String(50), nullable=True)  
)

cafes = Table(
    "cafes",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("name", String(255), nullable=False),
    Column("rating", String(20)),
    Column("reviews", Integer),
    Column("img", Text),
    Column("lat", Float, nullable=False),
    Column("lng", Float, nullable=False),
    Column("map_link", Text),
    Column("open_time", String(5), default="09:00"),  # 開店時間 HH:MM
    Column("close_time", String(5), default="21:00"),  # 關店時間 HH:MM
    Column("open_days", JSON, default=["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]),  # 營業日
    Column("price_range_min", Integer, default=0),  # 最低消費
    Column("price_range_max", Integer, default=500),  # 最高消費
    Column("lighting", Integer, default=3),  # 光線程度 1-5
    Column("no_time_limit", Boolean, default=False),  # 是否不限時
    Column("power_outlets", Integer, default=1),  # 插座數量 0-3
    Column("noise_level", String(10), default="moderate"),  # 吵雜程度: quiet, moderate, noisy
    Column("payment_methods", JSON, default=["electronic", "cash"]),  # 支付方式
    Column("wifi_strength", String(10), default="strong"),  # WiFi強度: none, weak, strong
    Column("has_toilet", Boolean, default=True),  # 是否有廁所
)