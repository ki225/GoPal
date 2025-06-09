from fastapi import FastAPI
from app.database import database
from app.routers import user, match, message, plan, review, checkin
from fastapi.middleware.cors import CORSMiddleware
from app.routers import location_review
from app.chat_websocket import router as chat_ws_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(user.router, prefix="/users", tags=["users"])
app.include_router(match.router, prefix="/matches", tags=["matches"])
app.include_router(message.router, prefix="/messages", tags=["messages"])
app.include_router(plan.router, prefix="/plans", tags=["plans"])
app.include_router(review.router, prefix="/reviews", tags=["reviews"])
app.include_router(checkin.router, tags=["checkins"])
app.include_router(location_review.router, prefix="/location_reviews", tags=["location_reviews"])
app.include_router(chat_ws_router)

@app.on_event("startup")
async def startup():
    await database.connect()

@app.on_event("shutdown")
async def shutdown():
    await database.disconnect()

@app.get("/")
async def health_check():
    return {"status": "ok"}