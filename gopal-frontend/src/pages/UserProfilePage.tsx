import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../axiosInstance';
import CheckInList from '../components/CheckInList';
import { CheckInData } from '../components/CheckInCard';
import './UserPage.css';

const UserProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const [userData, setUserData] = useState<any>(null);
  const [checkins, setCheckins] = useState<CheckInData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFriend, setIsFriend] = useState(false);
  const navigate = useNavigate();
  const currentUserId = localStorage.getItem('userId');
  const token = localStorage.getItem('token');
  
  const isSelfProfile = userId === currentUserId;

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    
    // 如果是查看自己的頁面，轉到 UserPage
    if (isSelfProfile) {
      navigate('/profile');
      return;
    }

    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        
        const userResponse = await axiosInstance.get(`/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUserData(userResponse.data);
        
        // 獲取打卡記錄 (僅公開的)
        const checkinsResponse = await axiosInstance.get(`/users/${userId}/checkins?visibility=public`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCheckins(Array.isArray(checkinsResponse.data) ? checkinsResponse.data : []);
        
        const friendsResponse = await axiosInstance.get(`/users/${currentUserId}/friends`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const friends = friendsResponse.data || [];
        setIsFriend(friends.some((friend: any) => friend.id === userId));
        
        setError(null);
      } catch (err: any) {
        console.error('獲取用戶數據失敗:', err);
        setError(err.response?.data?.detail || '加載失敗，請稍後再試');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [userId, navigate, token, currentUserId, isSelfProfile]);

  const handleViewOnMap = (lat: number, lng: number) => {
    navigate(`/dashboard?lat=${lat}&lng=${lng}`);
  };
  
  const handleAddFriend = async () => {
    try {
      await axiosInstance.post(`/users/${currentUserId}/friend-requests`, {
        recipient_id: userId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert('已發送好友請求');
    } catch (error) {
      console.error('發送好友請求失敗:', error);
      alert('發送好友請求失敗，請稍後重試');
    }
  };

  if (isLoading && !userData) {
    return <div className="user-page loading">加載中...</div>;
  }

  if (error && !userData) {
    return <div className="user-page error">發生錯誤: {error}</div>;
  }

  return (
    <div className="user-page">
      <div className="profile-header user-profile-view">
        {/* 返回按鈕 */}
        <button 
          className="back-button"
          onClick={() => navigate(-1)}
        >
          ← 返回
        </button>
        
        <div className="profile-avatar">
          {userData?.avatar_url ? (
            <img src={userData.avatar_url} alt={userData.name} />
          ) : (
            <div className="avatar-placeholder">{userData?.name?.[0] || 'U'}</div>
          )}
        </div>
        
        <div className="profile-info">
          <div className="name-with-actions">
            <h1>{userData?.name || '用戶'}</h1>
            {!isFriend && !isSelfProfile && (
              <button 
                className="add-friend-btn"
                onClick={handleAddFriend}
              >
                + 加為好友
              </button>
            )}
            {isFriend && (
              <span className="friend-badge">好友</span>
            )}
          </div>
          <p className="profile-bio">{userData?.bio || '這位用戶還沒有添加個人簡介。'}</p>
        </div>
      </div>
      
      <div className="checkins-container">
        <div className="checkins-header">
          <h2>{userData?.name || '用戶'}的打卡</h2>
        </div>
        
        <CheckInList 
          checkins={checkins} 
          onViewOnMap={handleViewOnMap}
          isLoading={isLoading}
          error={error || undefined}
        />
      </div>
    </div>
  );
};

export default UserProfilePage;