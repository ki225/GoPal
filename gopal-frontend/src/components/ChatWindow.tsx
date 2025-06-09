import React, { useEffect, useRef, useState } from "react";
import axiosInstance from "../axiosInstance";
import "./ChatWindow.css";

interface ChatWindowProps {
  userId: string;
  receiverId: string;
  receiverName: string;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  timestamp: string;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ userId, receiverId, receiverName }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const socketRef = useRef<WebSocket | null>(null);

  const loadMessages = async () => {
    try {
      const res = await axiosInstance.get(`/messages/${receiverId}`);
      setMessages(res.data);
    } catch {
      alert("無法載入訊息");
    }
  };

  const sendMessage = () => {
    if (
      !newMessage.trim() ||
      !socketRef.current ||
      socketRef.current.readyState !== WebSocket.OPEN
    ) {
      console.warn("WebSocket 尚未建立連線，無法發送訊息");
      return;
    }

    const msg = {
      sender_id: userId,
      receiver_id: receiverId,
      content: newMessage,
    };

    socketRef.current.send(JSON.stringify(msg));
    setNewMessage("");
  };

  useEffect(() => {
    loadMessages();

    const ws = new WebSocket(`ws://localhost:8000/ws/${userId}`);
    socketRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket 已連線");
    };

    ws.onmessage = (event) => {
      console.log("原始資料", event.data);
      const data: Message = JSON.parse(event.data);

      // 僅渲染雙方訊息
      if (
        (data.sender_id === receiverId && data.receiver_id === userId) ||
        (data.sender_id === userId && data.receiver_id === receiverId)
      ) {
        setMessages((prev) => [...prev, data]);
      }
    };

    ws.onerror = (err) => {
      console.error("WebSocket error", err);
    };

    ws.onclose = () => {
      console.log("WebSocket connection closed");
    };

    return () => {
      ws.close();
    };
  }, [receiverId]);

  return (
    <div className="cw-container">
      <div className="cw-header">
        <h3>與 {receiverName} 的聊天</h3>
      </div>

      <div className="cw-messages">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`cw-message ${msg.sender_id === userId ? "cw-sent" : "cw-received"}`}
          >
            <div className="cw-bubble">{msg.content}</div>
            <div className="cw-time">
              {new Date(msg.timestamp).toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      <div className="cw-input">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="輸入訊息..."
        />
        <button onClick={sendMessage}>發送</button>
      </div>
    </div>
  );
};

export default ChatWindow;
