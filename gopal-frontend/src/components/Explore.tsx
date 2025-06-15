import React, { useState, useEffect } from 'react';
import { Card, Avatar, Spin, Empty, Button, message, BackTop } from 'antd';
import { 
  UserOutlined, 
  EnvironmentOutlined, 
  ClockCircleOutlined, 
  LikeOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined
} from '@ant-design/icons';
import axiosInstance from '../axiosInstance';
import './Explore.css';

interface CheckIn {
  id: string;
  user_id: string;
  location_name: string;
  lat: number;
  lng: number;
  timestamp: string;
  comment?: string;
  has_image: boolean;
  is_owner: boolean;
  visibility: string;
  username?: string;
  image_url?: string; 
}

const Explore: React.FC = () => {
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const token = localStorage.getItem('token');
  
  const pageSize = 10;
  
  const loadCheckIns = async (reset: boolean = false) => {
    if (loading && !reset) return;
    
    const currentPage = reset ? 0 : page;
    setLoading(true);
    
    try {
      const response = await axiosInstance.get('/checkins', {
        params: {
          limit: pageSize,
          offset: currentPage * pageSize
        }
      });
      
      const newCheckIns = response.data.map((checkIn: CheckIn) => ({
        ...checkIn,
        image_url: checkIn.has_image 
          ? `${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/checkins/${checkIn.id}/image`
          : undefined
      }));
      
      if (reset) {
        setCheckIns(newCheckIns);
      } else {
        setCheckIns(prev => [...prev, ...newCheckIns]);
      }
      
      setHasMore(newCheckIns.length === pageSize);
      setPage(currentPage + 1);
      setError(null);
    } catch (err) {
      console.error('Failed to load check-ins:', err);
      setError('無法加載打卡記錄，請稍後再試。');
      message.error('加載打卡記錄失敗');
    } finally {
      setLoading(false);
    }
  };
  
  // 首次加載
  useEffect(() => {
    loadCheckIns(true);
  }, []);
  
  const formatDate = (isoDate: string) => {
    const date = new Date(isoDate);
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // 優化的滾動處理函數
  useEffect(() => {
    const handleScroll = () => {
      // 檢測是否滾動到底部
      const isNearBottom = window.innerHeight + window.scrollY >= 
        document.documentElement.scrollHeight - 300;
      
      if (isNearBottom) {
        if (hasMore && !loading) {
          console.log('觸發加載更多');
          loadCheckIns(false);
        }
      }
    };
    
    // 使用防抖函數減少滾動事件頻繁觸發
    let scrollTimer: ReturnType<typeof setTimeout>;
    const debouncedScroll = () => {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(handleScroll, 100);
    };
    
    window.addEventListener('scroll', debouncedScroll);
    
    return () => {
      window.removeEventListener('scroll', debouncedScroll);
      clearTimeout(scrollTimer);
    };
  }, [hasMore, loading]);
  
  return (
    <div className="explore-container">
      <div className="explore-content">
        <div className="explore-header">
          <h1>探索咖啡廳打卡</h1>
          <p>查看其他人分享的咖啡廳體驗</p>
        </div>
        
        {error && (
          <div className="error-message">
            {error}
            <Button type="primary" onClick={() => loadCheckIns(true)}>
              重試
            </Button>
          </div>
        )}
        
        <div className="checkins-grid">
          {checkIns.map(checkIn => (
            <Card 
              key={checkIn.id}
              className="checkin-card"
              cover={
                checkIn.has_image ? (
                  <div className="card-image-container">
                    <img
                      alt={`${checkIn.location_name} 照片`}
                      src={checkIn.image_url} // 使用預處理的圖片URL
                      className="checkin-image"
                      onError={(e) => {
                        // 圖片加載失敗時顯示備用內容
                        const target = e.target as HTMLImageElement;
                        target.onerror = null; // 防止無限重試
                        target.src = 'https://via.placeholder.com/300x200?text=無法加載圖片';
                      }}
                    />
                  </div>
                ) : (
                  <div className="card-image-placeholder">
                    <EnvironmentOutlined /> 無圖片
                  </div>
                )
              }
            >
              <div className="checkin-card-content">
                <div className="checkin-location">
                  <EnvironmentOutlined className="location-icon" />
                  <span className="location-name">{checkIn.location_name}</span>
                </div>
                
                {checkIn.comment && (
                  <div className="checkin-comment">
                    {checkIn.comment}
                  </div>
                )}
                
                <div className="checkin-meta">
                  <span className="checkin-time">
                    <ClockCircleOutlined /> {formatDate(checkIn.timestamp)}
                  </span>
                  
                  <div className="checkin-user">
                    <Avatar size="small" icon={<UserOutlined />} />
                    <span className="user-id">{checkIn.username || checkIn.user_id.substring(0, 8)}</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
        
        {checkIns.length === 0 && !loading && (
          <Empty 
            description="還沒有打卡記錄" 
            className="no-data"
          />
        )}
        
        {loading && (
          <div className="loading-container">
            <Spin size="large" />
            <p>正在加載更多打卡內容...</p>
          </div>
        )}
        
        {!loading && hasMore && (
          <div className="load-more">
            <Button 
              type="primary"
              onClick={() => loadCheckIns(false)}
              icon={<ArrowDownOutlined />}
              size="large"
            >
              點擊加載更多
            </Button>
            <div className="scroll-tip">或繼續下滑自動加載</div>
          </div>
        )}
        
        {!hasMore && checkIns.length > 0 && (
          <div className="no-more-data">
            <div className="divider" />
            已經到底了
            <div className="divider" />
          </div>
        )}
        
        <BackTop style={{ right: 50, bottom: 50 }}>
          <div className="back-top-button">
            <ArrowUpOutlined />
          </div>
        </BackTop>
      </div>
    </div>
  );
};

export default Explore;