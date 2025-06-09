import React, { useEffect, useState } from "react";
import axiosInstance from "../axiosInstance";
import ChatWindow from "../components/ChatWindow";
import "./Chat.css";

interface ChatProps {
  token: string;
  userId: string;
  receiverId?: string | null; // optional
}

interface Friend {
  id: string;
  name: string;
}

const Chat: React.FC<ChatProps> = ({ userId }) => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const res = await axiosInstance.get("/users/all");
        setFriends(res.data);
      } catch {
        alert("無法取得好友列表");
      }
    };
    fetchFriends();
  }, []);

  return (
    <div className="chat-container">
      <div className="friend-list">
        <h3>好友列表</h3>
        {friends.map((f) => (
          <div
            key={f.id}
            className={`friend-item ${f.id === activeChatId ? "active" : ""}`}
            onClick={() => setActiveChatId(f.id)}
          >
            {f.name}
          </div>
        ))}
      </div>

      <div className="chat-window">
        {activeChatId ? (
          <>
            <ChatWindow userId={userId} receiverId={activeChatId} receiverName={friends.find(f => f.id === activeChatId)?.name || "未知用戶"} />
          </>
        ) : (
          <p>請從左側選擇一位好友開始聊天</p>
        )}
      </div>
    </div>
  );
};

export default Chat;
