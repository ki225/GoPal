from fastapi import FastAPI, Request
from app.database import database
from app.routers import user, match, message, plan, review, checkin, cafes
from fastapi.middleware.cors import CORSMiddleware
from app.routers import location_review
from app.chat_websocket import router as chat_ws_router

app = FastAPI()

@app.middleware("http")
async def log_request(request: Request, call_next):
    print(f"Incoming request: {request.method} {request.url}")
    try:
        body = await request.body()
        print(f"Body: {body.decode()}")
    except Exception as e:
        print(f"Failed to read body: {e}")

    response = await call_next(request)
    print(f"Response status: {response.status_code}")
    return response

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
app.include_router(cafes.router, prefix="/cafes", tags=["cafes"])
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