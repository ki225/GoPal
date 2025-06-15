import React, { useState } from "react";
import axiosInstance from "../axiosInstance";
import ImageUploader from "./ImageUploader";
import "./CheckInModal.css";

interface CheckInModalProps {
  lat: number;
  lng: number;
  locationName: string;
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
}

const CheckInModal: React.FC<CheckInModalProps> = ({ 
  lat, 
  lng, 
  locationName, 
  onClose, 
  onSuccess,
  userId 
}) => {
  const [comment, setComment] = useState("");
  const [visibility, setVisibility] = useState<string>("public");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleImageSelected = (file: File) => {
    setSelectedImage(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    try {
      const formData = new FormData();
      formData.append("location_name", locationName);
      formData.append("latitude", lat.toString());
      formData.append("longitude", lng.toString());
      formData.append("visibility", visibility);
      
      if (comment) {
        formData.append("comment", comment);
      }
      
      if (selectedImage) {
        formData.append("image", selectedImage);
      }
      
      await axiosInstance.post(`/users/${userId}/checkins`, formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });
      
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("打卡失敗:", err);
      setError(err.response?.data?.detail || "發生錯誤，請稍後再試");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="checkin-modal-overlay">
      <div className="checkin-modal">
        <div className="checkin-modal-header">
          <h2>在 {locationName} 打卡</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>
        
        <form onSubmit={handleSubmit} className="checkin-form">
          <div className="form-group">
            <label htmlFor="comment">分享您的體驗：</label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="這裡的咖啡怎麼樣？環境如何？"
              rows={4}
            />
          </div>
          
          <div className="form-group">
            <label>上傳照片：</label>
            <ImageUploader onImageSelected={handleImageSelected} />
          </div>
          
          <div className="form-group visibility-options">
            <label>打卡可見性：</label>
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
          
          {error && <p className="error-message">{error}</p>}
          
          <div className="form-actions">
            <button type="button" onClick={onClose} className="cancel-btn">
              取消
            </button>
            <button 
              type="submit" 
              className="submit-btn"
              disabled={isLoading}
            >
              {isLoading ? "處理中..." : "發布打卡"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CheckInModal;