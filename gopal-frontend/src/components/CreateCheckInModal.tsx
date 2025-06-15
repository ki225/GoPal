import React, { useState, useEffect, useRef } from 'react';
import axiosInstance from '../axiosInstance';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import ImageUploader from './ImageUploader';
import './CreateCheckInModal.css';
// import { useUser } from '../contexts/UserContext';

interface Friend {
  id: string;
  name: string;
  avatar_url?: string;
}

interface CafeLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

interface CreateCheckInModalProps {
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateCheckInModal: React.FC<CreateCheckInModalProps> = ({ userId, onClose, onSuccess }) => {
  // const { user, loading, error } = useUser();
  const [postText, setPostText] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [visibility, setVisibility] = useState<string>("public");
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [cafes, setCafes] = useState<CafeLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<CafeLocation | null>(null);
  const [isLoadingCafes, setIsLoadingCafes] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const token = localStorage.getItem('token') || '';
  
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const friendsLoadedRef = useRef(false); 
  const [mapInitialized, setMapInitialized] = useState(false); 
  const [mapLoading, setMapLoading] = useState(false);

  const fetchFriends = async () => {
        if (friendsLoadedRef.current || isLoadingFriends || friends.length > 0) return;
        
        try {
        setIsLoadingFriends(true);
        const response = await axiosInstance.get(`/users/${userId}/friends`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        setFriends(response.data || []);
        friendsLoadedRef.current = true;
        } catch (err) {
        console.error('獲取好友列表失敗:', err);
        } finally {
        setIsLoadingFriends(false);
        }
    };

  useEffect(() => {
    if (!mapboxgl.accessToken) {
      mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN || '';
    }
  }, []);

  useEffect(() => {
    if (!showLocationPicker) {
      return;
    }
    
    if (!mapContainerRef.current || cafes.length === 0) {
      return;
    }
    
    setMapLoading(true);
    
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
      setMapInitialized(false);
    }
    
    const initMap = () => {
      try {
        // 創建地圖
        const map = new mapboxgl.Map({
          container: mapContainerRef.current!,
          style: 'mapbox://styles/mapbox/streets-v11',
          center: [121.5654, 25.0330], // 台北市中心
          zoom: 12,
          fadeDuration: 0, 
          preserveDrawingBuffer: true,
          attributionControl: false,
        });
        
        mapRef.current = map;
        
        map.on('styledata', () => {
          if (map.isStyleLoaded()) {
            setMapInitialized(true);
            setMapLoading(false);
          }
        });
        
        map.on('load', () => {
          cafes.forEach(cafe => {
            const marker = new mapboxgl.Marker({ color: '#C19471' })
              .setLngLat([cafe.lng, cafe.lat])
              .addTo(map);
              
            marker.getElement().addEventListener('click', () => {
              setSelectedLocation(cafe);
              setShowLocationPicker(false);
            });
            
            new mapboxgl.Popup({ 
              offset: 25, 
              closeButton: false,
              closeOnClick: false, 
              className: 'cafe-popup' 
            })
              .setLngLat([cafe.lng, cafe.lat])
              .setHTML(`<strong>${cafe.name}</strong>`)
              .addTo(map);
          });
        });
        
        map.on('error', () => {
          setMapLoading(false);
        });
      } catch (error) {
        console.error('Map initialization error:', error);
        setMapLoading(false);
      }
    };
    
    const timer = setTimeout(() => {
      initMap();
    }, 50);
    
    return () => {
      clearTimeout(timer);
    };
  }, [showLocationPicker, cafes, mapContainerRef.current]);

  useEffect(() => {
    if (cafes.length === 0 && !isLoadingCafes) {
      fetchCafes();
    }
  }, []);

  // useEffect(() => {
    

  // }, [userId, token, isLoadingFriends]);

  useEffect(() => {
    if (!friendsLoadedRef.current) {
      fetchFriends();
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  const fetchCafes = async () => {
    if (isLoadingCafes || cafes.length > 0) return;
    
    try {
      setIsLoadingCafes(true);
      const response = await axiosInstance.get('/cafes', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const cafeLocations: CafeLocation[] = response.data.map((cafe: any) => ({
        id: cafe.id.toString(),
        name: cafe.name,
        lat: cafe.lat,
        lng: cafe.lng
      }));
      
      setCafes(cafeLocations);
    } catch (err) {
      console.error('獲取咖啡廳列表失敗:', err);
    } finally {
      setIsLoadingCafes(false);
    }
  };
  
  const initializeMap = (locations: CafeLocation[]) => {
    if (!mapboxgl.accessToken) {
      mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN || '';
    }
    
    if (!mapContainerRef.current) return;
    
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [121.5654, 25.0330], // 台北市中心
      zoom: 12
    });
    
    // 保存地圖引用
    mapRef.current = map;
    
    // 地圖載入完成後添加標記
    map.on('load', () => {
      locations.forEach(cafe => {
        // 創建標記
        const marker = new mapboxgl.Marker({ color: '#C19471' })
          .setLngLat([cafe.lng, cafe.lat])
          .addTo(map);
          
        // 添加點擊事件
        marker.getElement().addEventListener('click', () => {
          setSelectedLocation(cafe);
          setShowLocationPicker(false);
        });
        
        // 創建彈出視窗
        new mapboxgl.Popup({ offset: 25, closeButton: false })
          .setLngLat([cafe.lng, cafe.lat])
          .setHTML(`<strong>${cafe.name}</strong>`)
          .addTo(map);
      });
    });
  };

  const toggleLocationPicker = () => {
    setShowLocationPicker(prev => !prev);
  };
  
  const handleFriendSelect = (friendId: string) => {
    setSelectedFriends(prev => {
      if (prev.includes(friendId)) {
        return prev.filter(id => id !== friendId);
      } else {
        return [...prev, friendId];
      }
    });
  };
  
  // 處理圖片上傳
  const handleImageSelected = (file: File) => {
    if (file === null) {
        setSelectedImage(null);
    } else {
        setSelectedImage(file);
    }
  };
  
  // 發布打卡
  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedLocation) {
      alert('請選擇一個咖啡廳位置');
      return;
    }
    
    if (!postText && !selectedImage) {
      alert('請添加文字或圖片');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const formData = new FormData();
      formData.append("location_name", selectedLocation.name);
      formData.append("latitude", selectedLocation.lat.toString());
      formData.append("longitude", selectedLocation.lng.toString());
      formData.append("visibility", visibility);
      
      if (postText) {
        formData.append("comment", postText);
      }
      
      if (selectedImage) {
        formData.append("image", selectedImage);
      }
      
      // 如果有標記好友，也加入
      if (selectedFriends.length > 0) {
        formData.append("tagged_friends", JSON.stringify(selectedFriends));
      }
      
      await axiosInstance.post(`/checkins`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          "Authorization": `Bearer ${token}`
        }
      });
      
      onSuccess();
      onClose();

    } catch (err: any) {
      console.error("發布打卡失敗:", err);
      alert(err.response?.data?.detail || "發布失敗，請稍後再試");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="create-checkin-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>新增打卡</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>
        
        <div className="modal-body">
          <form onSubmit={handleSubmitPost} className="post-form">
            {/* 地點選擇區域 */}
            <div className="form-group location-section">
              <label>選擇咖啡廳:</label>
              <div className="location-picker">
                {selectedLocation ? (
                  <div className="selected-location">
                    <span>{selectedLocation.name}</span>
                    <button
                      type="button"
                      className="change-location-btn"
                      onClick={toggleLocationPicker}
                    >
                      更換
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="pick-location-btn"
                    onClick={toggleLocationPicker}
                  >
                    選擇咖啡廳位置
                  </button>
                )}
              </div>
              
              {/* 地圖選擇器 */}
              {showLocationPicker && (
                <div className="location-map-container">
                  <div className="map-header">
                    <h4>在地圖上選擇咖啡廳位置</h4>
                    <button
                      type="button"
                      className="close-map-btn"
                      onClick={toggleLocationPicker}
                    >
                      &times;
                    </button>
                  </div>
                  <div className="map-content-wrapper">
                    {/* 地圖加載指示器 */}
                    {mapLoading && (
                      <div className="map-loading-overlay">
                        <div className="map-loading-spinner"></div>
                        <span>載入地圖中...</span>
                      </div>
                    )}
                    
                    {/* 地圖容器 */}
                    <div 
                      ref={mapContainerRef} 
                      className={`location-map ${mapInitialized ? 'initialized' : ''}`} 
                    />
                    
                    {/* 咖啡廳列表 */}
                    <div className="cafe-list">
                      <h4>附近咖啡廳</h4>
                      {isLoadingCafes ? (
                        <div className="loading-cafes">加載中...</div>
                      ) : (
                        <ul>
                          {cafes.map(cafe => (
                            <li 
                              key={cafe.id}
                              className={selectedLocation?.id === cafe.id ? 'selected' : ''}
                              onClick={() => {
                                setSelectedLocation(cafe);
                                setShowLocationPicker(false);
                              }}
                            >
                              {cafe.name}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* 文字輸入區域 */}
            <div className="form-group">
              <label htmlFor="postText">分享您的體驗:</label>
              <textarea
                id="postText"
                value={postText}
                onChange={(e) => setPostText(e.target.value)}
                placeholder="這裡的咖啡怎麼樣？環境如何？有什麼特色？"
                rows={4}
              />
            </div>
            
            {/* 圖片上傳區域 */}
            <div className="form-group">
              <label>添加照片:</label>
              <ImageUploader onImageSelected={handleImageSelected} />
            </div>
            
            {/* 標記好友區域 */}
            <div className="form-group friends-section">
              <label>標記好友:</label>
              <div className="friends-list">
                {isLoadingFriends ? (
                  <div className="loading-friends">加載好友列表...</div>
                ) : friends.length > 0 ? (
                  <div className="friend-selection">
                    {friends.map(friend => (
                      <div
                        key={friend.id}
                        className={`friend-item ${selectedFriends.includes(friend.id) ? 'selected' : ''}`}
                        onClick={() => handleFriendSelect(friend.id)}
                      >
                        <div className="friend-avatar">
                          {friend.avatar_url ? (
                            <img src={friend.avatar_url} alt={friend.name} />
                          ) : (
                            friend.name[0]
                          )}
                        </div>
                        <span className="friend-name">{friend.name}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-friends">沒有好友可標記</div>
                )}
              </div>
            </div>
            
            {/* 可見性設置 */}
            <div className="form-group visibility-options">
              <label>打卡可見性:</label>
              <div className="radio-group">
                <label>
                  <input
                    type="radio"
                    name="visibility"
                    value="public"
                    checked={visibility === "public"}
                    onChange={() => setVisibility("public")}
                  />
                  <span>公開</span>
                </label>
                <label>
                  <input
                    type="radio"
                    name="visibility"
                    value="private"
                    checked={visibility === "private"}
                    onChange={() => setVisibility("private")}
                  />
                  <span>僅自己可見</span>
                </label>
              </div>
            </div>
            
            {/* 發布按鈕 */}
            <div className="form-actions">
              <button
                type="button"
                className="cancel-btn"
                onClick={onClose}
              >
                取消
              </button>
              <button
                type="submit"
                className="submit-btn"
                disabled={isSubmitting || !selectedLocation}
              >
                {isSubmitting ? "發布中..." : "發布打卡"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateCheckInModal;