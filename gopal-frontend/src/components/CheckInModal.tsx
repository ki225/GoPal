import React, { useState } from "react";
import axiosInstance from "../axiosInstance";

interface CheckInModalProps {
  lat: number;
  lng: number;
  token: string;
  onClose: () => void;
  onSuccess: () => void;
  locationId?: string; 
//   name: string;
//   description: string;
}

const CheckInModal: React.FC<CheckInModalProps> = ({ lat, lng, token, onClose, onSuccess, locationId }) => {
  const [locationName, setLocationName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);

  const handleSubmit = async () => {
    try {
      await axiosInstance.post("/checkins", {
        location_name: locationName,
        coordinates: { lat, lng },
        description,
        is_public: isPublic,
    });
      onSuccess();
      onClose();
    } catch (err) {
      alert("打卡失敗");
    }
  };

  return (
    <div className="modal">
      <h3>打卡這個地點</h3>
      {/* <input value={locationName} onChange={(e) => setLocationName(e.target.value)} placeholder="地點名稱" required /> */}
      <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="心得或備註" />
      <label>
        <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} /> 公開這則打卡
      </label>
      <button onClick={handleSubmit}>送出</button>
      <button onClick={onClose}>取消</button>
    </div>
  );
};

export default CheckInModal;