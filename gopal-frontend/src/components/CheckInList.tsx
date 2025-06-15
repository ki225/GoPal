import React from 'react';
import CheckInCard, { CheckInData } from './CheckInCard';
import './CheckInList.css';

interface CheckInListProps {
  checkins: CheckInData[];
  onViewOnMap?: (lat: number, lng: number) => void;
  isLoading?: boolean;
  error?: string;
}

const CheckInList: React.FC<CheckInListProps> = ({ 
  checkins, 
  onViewOnMap,
  isLoading = false,
  error
}) => {
  if (isLoading) {
    return <div className="checkin-loading">正在加載打卡記錄...</div>;
  }

  if (error) {
    return <div className="checkin-error">加載失敗: {error}</div>;
  }

  if (checkins.length === 0) {
    return (
      <div className="no-checkins">
        <div className="no-data-icon">📍</div>
        <p>暫無打卡記錄</p>
        <p className="hint">去探索一些有趣的地方並分享您的體驗吧！</p>
      </div>
    );
  }

  return (
    <div className="checkin-list">
      {checkins.map(checkin => (
        <CheckInCard 
          key={checkin.id} 
          checkin={checkin}
        />
      ))}
    </div>
  );
};

export default CheckInList;