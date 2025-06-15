import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import axiosInstance from "../axiosInstance";
import CheckInModal from '../components/CheckInModal';
import './MapView.css';
import "mapbox-gl/dist/mapbox-gl.css";

interface SelectedLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

interface MapViewProps {
  token: string;
  userId: string;
  cafes?: any[];
  loading?: boolean;
  checkins?: {
    id: string;
    lat: number;
    lng: number;
    location_name: string;
    comment?: string;
  }[];
}

interface CafeData {
  id: string;
  name: string;
  lat: number;
  lng: number;
  rating: string;
  reviews: number;
  map_link: string;
  open_time?: string;
  close_time?: string;
  wifi_strength?: string;
  no_time_limit?: boolean;
  has_toilet?: boolean;
}

const MapView: React.FC<MapViewProps> = ({ token, userId, cafes: propsCafes, loading, checkins }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const cafeMarkersRef = useRef<mapboxgl.Marker[]>([]); 
  const [cafes, setCafes] = useState<CafeData[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(null);
  const [showCheckInModal, setShowCheckInModal] = useState(false);

  mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN;

  const handleMarkerClick = (marker: any) => {
    setSelectedLocation({
      id: marker.id,
      lat: marker.lat,
      lng: marker.lng,
      name: marker.name
    });
    setShowCheckInModal(true);
  };

  const loadCafes = async () => {
    try {
      const res = await axiosInstance.get("/cafes", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setCafes(res.data);
    } catch (error) {
      console.error("Failed to load cafes:", error);
    }
  };

  useEffect(() => {
    if (!mapRef.current && mapContainer.current) {
      mapRef.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/streets-v11",
        center: [121.5654, 25.049], // 台北市中心經緯度
        zoom: 12,
      });
    }
  }, []);

  useEffect(() => {
    if (propsCafes && propsCafes.length > 0) {
      setCafes(propsCafes);
    } else if (!checkins) {
      loadCafes();
    }
  }, [propsCafes, checkins, token]);

  // 初始加載咖啡廳
  useEffect(() => {
    if (!checkins && !propsCafes) {
      loadCafes();
    }
  }, [checkins, propsCafes]);

  // 獲取 WiFi 強度的顯示文本
  const getWifiStrengthText = (strength: string | undefined): string => {
    switch (strength) {
      case 'none': return '無';
      case 'weak': return '弱';
      case 'strong': return '強';
      default: return '未知';
    }
  };

  // 渲染地圖標記
  useEffect(() => {
    if (!mapRef.current) return;

    // 清除現有標記
    cafeMarkersRef.current.forEach((marker) => marker.remove());
    cafeMarkersRef.current = [];

    if (checkins) {
      // 渲染打卡點
      checkins.forEach((checkin) => {
        const marker = new mapboxgl.Marker()
          .setLngLat([checkin.lng, checkin.lat])
          .setPopup(
            new mapboxgl.Popup().setHTML(
              `<strong>${checkin.location_name}</strong><br/>${checkin.comment || ""}`
            )
          )
          .addTo(mapRef.current!);
        
        cafeMarkersRef.current.push(marker);
      });
    } else if (cafes && cafes.length > 0) {
      cafes.forEach((cafe) => {
        const marker = new mapboxgl.Marker({ color: "brown" })
          .setLngLat([cafe.lng, cafe.lat])
          .setPopup(
            new mapboxgl.Popup().setHTML(`
              <strong>${cafe.name}</strong><br/>
              ${cafe.rating ? `⭐ ${cafe.rating}｜評論數：${cafe.reviews}<br/>` : ''}
              ${cafe.open_time ? `營業時間: ${cafe.open_time} - ${cafe.close_time}<br/>` : ''}
              ${cafe.wifi_strength ? `WiFi: ${getWifiStrengthText(cafe.wifi_strength)}<br/>` : ''}
              ${cafe.no_time_limit ? '<p>不限時</p>' : ''}
              ${cafe.has_toilet ? '<p>有廁所</p>' : ''}
              <a href="${cafe.map_link}" target="_blank">查看地圖</a>
            `)
          )
          .addTo(mapRef.current!);

        marker.getElement().addEventListener("click", () => {
          handleMarkerClick({ 
            id: cafe.id.toString(), 
            name: cafe.name, 
            lat: cafe.lat, 
            lng: cafe.lng 
          });
        });

        cafeMarkersRef.current.push(marker);
      });

      // 自動調整地圖視圖範圍
      if (cafes.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();
        cafes.forEach(cafe => {
          bounds.extend([cafe.lng, cafe.lat]);
        });
        
        mapRef.current.fitBounds(bounds, {
          padding: 50,
          maxZoom: 15
        });
      }
    }
  }, [checkins, cafes]);

  return (
    <div className="mapview-container">
      <div ref={mapContainer} className="full-height-map" />
      {showCheckInModal && selectedLocation && (
        <CheckInModal
          lat={selectedLocation.lat}
          lng={selectedLocation.lng}
          locationName={selectedLocation.name}
          userId={userId} 
          onClose={() => setShowCheckInModal(false)}
          onSuccess={() => {
            setShowCheckInModal(false);
            if (!checkins) {
              loadCafes(); 
            }
          }}
        />
      )}
    </div>
  );
};

export default MapView;