from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from typing import List, Dict
from uuid import uuid4, UUID
from pydantic import BaseModel
from app.database import database
from app.models import messages
from app.routers.user import get_current_user, UserProfile

router = APIRouter()

class Message(BaseModel):
    sender_id: UUID
    receiver_id: UUID
    content: str

@router.post("/send")
async def send_message(msg: Message, current_user: UserProfile = Depends(get_current_user)):
    if msg.sender_id != current_user.id:
        raise HTTPException(status_code=403, detail="Cannot send message as other user")
    msg_id = str(uuid4())
    await database.execute(
        messages.insert().values(
            message_id=msg_id,
            sender_id=str(msg.sender_id),
            receiver_id=str(msg.receiver_id),
            content=msg.content,
        )
    )
    return {"message_id": msg_id}

@router.get("/{user_id}", response_model=List[Message])
async def get_messages(user_id: UUID, current_user: UserProfile = Depends(get_current_user)):
    query = messages.select().where(
        ((messages.c.sender_id == str(current_user.id)) & (messages.c.receiver_id == str(user_id))) |
        ((messages.c.sender_id == str(user_id)) & (messages.c.receiver_id == str(current_user.id)))
    ).order_by(messages.c.timestamp)
    msgs = await database.fetch_all(query)
    return [Message(
        sender_id=UUID(msg["sender_id"]),
        receiver_id=UUID(msg["receiver_id"]),
        content=msg["content"]
    ) for msg in msgs]

# WebSocket connection
active_connections: Dict[UUID, WebSocket] = {}

@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: UUID):
    await websocket.accept()
    active_connections[user_id] = websocket
    try:
        while True:
            data = await websocket.receive_text()
            await websocket.send_text(f"Message received: {data}")
    except WebSocketDisconnect:
        del active_connections[user_id]