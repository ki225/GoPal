import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../axiosInstance';
import CheckInList from '../components/CheckInList';
import { CheckInData } from '../components/CheckInCard';
import CreateCheckInModal from '../components/CreateCheckInModal';
import './UserPage.css';

const UserPage: React.FC = () => {
  const [userData, setUserData] = useState<any>(null);
  const [checkins, setCheckins] = useState<CheckInData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [currentTab, setCurrentTab] = useState('posts');
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!userId) {
      navigate('/login');
      return;
    }

    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        
        // 獲取用戶個人資料
        const userResponse = await axiosInstance.get(`/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUserData(userResponse.data);
        
        // 獲取打卡記錄
        const checkinsResponse = await axiosInstance.get(`/users/${userId}/checkins`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCheckins(Array.isArray(checkinsResponse.data) ? checkinsResponse.data : []);
        
        setError(null);
      } catch (err: any) {
        console.error('獲取數據失敗:', err);
        setError(err.response?.data?.detail || '加載失敗，請稍後再試');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [userId, navigate, token]);

  const handleViewOnMap = (lat: number, lng: number) => {
    navigate(`/dashboard?lat=${lat}&lng=${lng}`);
  };
  
  const handleCreateSuccess = async () => {
    try {
      // 重新獲取打卡記錄來更新列表
      const checkinsResponse = await axiosInstance.get(`/users/${userId}/checkins`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCheckins(Array.isArray(checkinsResponse.data) ? checkinsResponse.data : []);
    } catch (err) {
      console.error('重新獲取打卡記錄失敗:', err);
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
      <div className="profile-header">
        {/* 裝飾性咖啡圖標 */}
        <span className="coffee-icon top-right">☕</span>
        
        <div className="profile-avatar">
          {userData?.avatar_url ? (
            <img src={userData.avatar_url} alt={userData.name} />
          ) : (
            <div className="avatar-placeholder">{userData?.name?.[0] || 'U'}</div>
          )}
        </div>
        
        <div className="profile-info">
          <h1>{userData?.name || '用戶'}</h1>
          <p className="profile-bio">{userData?.bio || '這位用戶還沒有添加個人簡介。喝杯咖啡，聊聊天吧！'}</p>
        </div>
        
        {/* 裝飾性咖啡圖標 */}
        <span className="coffee-icon bottom-left">☕</span>
      </div>
      
      <div className="profile-tabs">
        <div 
          className={`tab ${currentTab === 'posts' ? 'active' : ''}`}
          onClick={() => setCurrentTab('posts')}
        >
          打卡記錄
        </div>
        <div 
          className={`tab ${currentTab === 'favorites' ? 'active' : ''}`}
          onClick={() => setCurrentTab('favorites')}
        >
          珍藏咖啡廳
        </div>
      </div>
      
      <div className="checkins-container">
        <div className="checkins-header">
          <h2>我的打卡</h2>
          <button 
            className="create-post-button" 
            onClick={() => setShowCreateModal(true)}
          >
            + 新增打卡
          </button>
        </div>
        
        <CheckInList 
          checkins={checkins} 
          onViewOnMap={handleViewOnMap}
          isLoading={isLoading}
          error={error || undefined}
        />
      </div>
      
      {showCreateModal && userId && (
        <CreateCheckInModal 
          userId={userId}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
        />
      )}
    </div>
  );
};

export default UserPage;