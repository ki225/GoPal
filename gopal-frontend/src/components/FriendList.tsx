import React, { useState, useEffect } from 'react';
import axiosInstance from '../axiosInstance';
import { useNavigate } from 'react-router-dom';
import './FriendList.css';

export interface Friend {
  id: string;
  name: string;
  avatar_url?: string;
}

interface FriendListProps {
  userId: string;
  isVisible: boolean;
}

const FriendList: React.FC<FriendListProps> = ({ userId, isVisible }) => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  
  useEffect(() => {
    if (!isVisible) return;
    
    const fetchFriends = async () => {
      try {
        setIsLoading(true);
        const response = await axiosInstance.get(`/users/${userId}/friends`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setFriends(response.data || []);
        setError(null);
      } catch (err: any) {
        console.error('獲取好友列表失敗:', err);
        setError(err.response?.data?.detail || '無法載入好友列表');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchFriends();
  }, [userId, token, isVisible]);
  
  // 搜尋好友功能
  const filteredFriends = searchTerm 
    ? friends.filter(friend => 
        friend.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : friends;
  
  // 訪問好友頁面
  const handleFriendClick = (friendId: string) => {
    navigate(`/users/${friendId}`);
  };
  
  // 刪除好友
  const handleRemoveFriend = async (friendId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (!window.confirm('確定要刪除這個好友嗎？')) return;
    
    try {
      await axiosInstance.delete(`/users/${userId}/friends/${friendId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // 更新本地好友列表
      setFriends(prev => prev.filter(friend => friend.id !== friendId));
    } catch (error) {
      console.error('刪除好友失敗:', error);
      alert('刪除好友失敗，請稍後重試');
    }
  };
  
  if (!isVisible) return null;
  
  return (
    <div className="friend-list-container">
      <div className="friend-list-header">
        <h3>我的好友</h3>
        <div className="search-bar">
          <input
            type="text"
            placeholder="搜尋好友..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button 
              className="clear-search" 
              onClick={() => setSearchTerm('')}
            >
              ✕
            </button>
          )}
        </div>
      </div>
      
      {isLoading ? (
        <div className="friend-list-loading">
          <div className="loading-spinner"></div>
          <p>載入好友列表中...</p>
        </div>
      ) : error ? (
        <div className="friend-list-error">
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>重試</button>
        </div>
      ) : filteredFriends.length === 0 ? (
        <div className="no-friends">
          {searchTerm ? '沒有符合搜尋條件的好友' : '您還沒有好友'}
          {!searchTerm && (
            <button 
              className="find-friends-btn"
              onClick={() => navigate('/find-friends')}
            >
              尋找新朋友
            </button>
          )}
        </div>
      ) : (
        <ul className="friend-list">
          {filteredFriends.map(friend => (
            <li 
              key={friend.id} 
              className="friend-item"
              onClick={() => handleFriendClick(friend.id)}
            >
              <div 
                className="friend-avatar"
                onClick={(e) => {
                  e.stopPropagation(); // 防止觸發兩次導航
                  handleFriendClick(friend.id);
                }}
                role="button"
                aria-label={`查看${friend.name}的個人資料`}
              >
                {friend.avatar_url ? (
                  <img 
                    src={friend.avatar_url} 
                    alt={friend.name} 
                    className="clickable-avatar"
                  />
                ) : (
                  <div className="avatar-placeholder clickable-avatar">
                    {friend.name[0] || '?'}
                  </div>
                )}
              </div>
              <div className="friend-info">
                <span className="friend-name">{friend.name}</span>
              </div>
              <button 
                className="remove-friend-btn"
                onClick={(e) => handleRemoveFriend(friend.id, e)}
                title="刪除好友"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default FriendList;