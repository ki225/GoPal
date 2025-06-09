import React, { useEffect, useState } from "react";
import axiosInstance from "../axiosInstance";
import "./UserSidebar.css";

interface UserSidebarProps {
  userId: string;
  currentUserId: string;
  onClose: () => void;
}

interface UserProfile {
  name: string;
  bio?: string;
  joined_at?: string;
}

const UserSidebar: React.FC<UserSidebarProps> = ({ userId, currentUserId, onClose }) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axiosInstance.get(`/users/${userId}`);
        // console.log(res)
        setUserProfile(res.data);
        // console.log(userProfile)
      } catch {
        setUserProfile(null);
      }
    };
    fetchUser();
  }, [userId]);

  const handleAddFriend = async () => {
    try {
      await axiosInstance.post("/users/friends/add", { target_user_id: userId });
      alert("已發送好友邀請！");
    } catch {
      alert("發送好友邀請失敗");
    }
  };

  return (
    <>
      <div className="usb-sidebar-overlay" onClick={onClose} />
      <div className={`usb-sidebar active`}>
        <button onClick={onClose}>×</button>
        <h3>用戶資訊</h3>
        {userProfile ? (
          <div>
            <p><strong>名稱：</strong>{userProfile.name}</p>
            <p><strong>簡介：</strong>{userProfile.bio || "（未提供）"}</p>
            <p><strong>加入時間：</strong>{userProfile.joined_at}</p>
            {userId !== currentUserId && (
              <button onClick={handleAddFriend}>加入好友</button>
            )}
          </div>
        ) : (
          <p>載入中...</p>
        )}
      </div>
    </>
  );
};

export default UserSidebar;
