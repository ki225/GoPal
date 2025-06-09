from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict
from uuid import uuid4
from datetime import datetime

router = APIRouter()

# 線上用戶連線池：user_id -> WebSocket
active_connections: Dict[str, WebSocket] = {}

@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await websocket.accept()
    active_connections[user_id] = websocket
    print(f"用戶 {user_id} 已連線")

    try:
        while True:
            data = await websocket.receive_json()
            receiver_id = data.get("receiver_id")
            content = data.get("content")

            print(f"{user_id} 傳給 {receiver_id}：{content}")

            message = {
                "id": str(uuid4()),
                "sender_id": user_id,
                "receiver_id": receiver_id,
                "content": content,
                "timestamp": datetime.utcnow().isoformat()
            }

            if receiver_id in active_connections:
                await active_connections[receiver_id].send_json(message)
            else:
                print(f"用戶 {receiver_id} 未連線")
                # 可以考慮儲存這筆訊息以供稍後傳送

            # 同步發送給 sender 讓對話畫面立即更新（自己也收到一次）
            await websocket.send_json(message)

    except WebSocketDisconnect:
        print(f"用戶 {user_id} 離線")
        active_connections.pop(user_id, None)
