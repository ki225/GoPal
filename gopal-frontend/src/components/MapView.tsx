import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import axiosInstance from "../axiosInstance";
import ReviewModal from "./ReviewModal";
import CheckInModal from '../components/CheckInModal';

interface SelectedLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

interface MapViewProps {
  token: string;
  userId: string;
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
}

const MapView: React.FC<MapViewProps> = ({ token, userId, checkins }) => {
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
    const res = await axiosInstance.get("/cafes");
    setCafes(res.data);
  };

  useEffect(() => {
    if (!mapRef.current && mapContainer.current) {
      mapRef.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/streets-v11",
        center: [121.5654, 25.0330],
        zoom: 12,
      });
    }
  }, []);

  useEffect(() => {
    if (!checkins) {
      loadCafes();
    }
  }, [checkins]);

  useEffect(() => {
    if (!mapRef.current) return;

    cafeMarkersRef.current.forEach((marker) => marker.remove());
    cafeMarkersRef.current = [];

    if (checkins) {
      checkins.forEach((checkin) => {
        new mapboxgl.Marker()
          .setLngLat([checkin.lng, checkin.lat])
          .setPopup(
            new mapboxgl.Popup().setHTML(
              `<strong>${checkin.location_name}</strong><br/>${checkin.comment || ""}`
            )
          )
          .addTo(mapRef.current!);
      });
    } else {
      cafes.forEach((cafe) => {
        const marker = new mapboxgl.Marker({ color: "brown" })
          .setLngLat([cafe.lng, cafe.lat])
          .setPopup(
            new mapboxgl.Popup().setHTML(`
              <strong>${cafe.name}</strong><br/>
              ⭐ ${cafe.rating}｜評論數：${cafe.reviews}<br/>
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
    }
  }, [checkins, cafes]);

  return (
    <div>
      <div ref={mapContainer} style={{ width: "100%", height: "500px" }} />
      {showCheckInModal && selectedLocation && (
        <CheckInModal
          lat={selectedLocation.lat}
          lng={selectedLocation.lng}
          locationName={selectedLocation.name}
          userId={userId} // 使用傳入的 userId
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