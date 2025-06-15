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
)