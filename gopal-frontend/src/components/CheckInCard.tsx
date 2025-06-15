import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './CheckInCard.css';

export interface CheckInData {
  id: string;
  location_name: string;
  timestamp: string;
  comment?: string;
  lat: number;
  lng: number;
  visibility: string;
  has_image: boolean;
}

interface CheckInCardProps {
  checkin: CheckInData;
}

const CheckInCard: React.FC<CheckInCardProps> = ({ checkin }) => {
  const [imageData, setImageData] = useState<string | null>(null);
  const [isLoadingImage, setIsLoadingImage] = useState<boolean>(false);
  const [imageError, setImageError] = useState<boolean>(false);
  
  const formattedDate = new Date(checkin.timestamp).toLocaleString('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  useEffect(() => {
    if (!checkin.has_image) return;
    
    const fetchImage = async () => {
      setIsLoadingImage(true);
      setImageError(false);
      
      try {
        const response = await axios.get(`/checkins/${checkin.id}/image`, {
          baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
          responseType: 'blob',
        });
        
        // Blob URL
        const imageUrl = URL.createObjectURL(response.data);
        setImageData(imageUrl);
      } catch (error) {
        console.error("加載圖片失敗:", error);
        setImageError(true);
      } finally {
        setIsLoadingImage(false);
      }
    };
    
    fetchImage();
    
    return () => {
      if (imageData && imageData.startsWith('blob:')) {
        URL.revokeObjectURL(imageData);
      }
    };
  }, [checkin.id, checkin.has_image]);
  
  return (
    <div className="checkin-card">
      <div className="checkin-header">
        <h3>{checkin.location_name}</h3>
        <div className="checkin-meta">
          <span className="checkin-date">{formattedDate}</span>
          <span className={`visibility-badge ${checkin.visibility}`}>
            {checkin.visibility === 'public' ? '公開' : '僅自己可見'}
          </span>
        </div>
      </div>
      
      {/* 評論區域 */}
      {checkin.comment && (
        <div className="checkin-comment">
          <p>{checkin.comment}</p>
        </div>
      )}
      
      {/* 圖片區域 */}
      {checkin.has_image && (
        <div className="checkin-image">
          {isLoadingImage ? (
            <div className="image-loading">
              <div className="loading-spinner"></div>
              <span>載入圖片中...</span>
            </div>
          ) : imageError ? (
            <div className="image-error">
              <span>圖片載入失敗</span>
            </div>
          ) : imageData && (
            <img 
              src={imageData}
              alt={`${checkin.location_name} 的照片`}
              onClick={() => {
                window.open(imageData, '_blank');
              }}
              onError={() => setImageError(true)}
            />
          )}
        </div>
      )}
      
      <div className="checkin-actions">
        <button className="map-button">
          在地圖上查看
        </button>
      </div>
    </div>
  );
};

export default CheckInCard;