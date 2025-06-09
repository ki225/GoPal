// 用 Mapbox 顯示所有打卡地點
import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import CheckInModal from "./CheckInModal";
import axiosInstance from "../axiosInstance";
import ReviewModal from "./ReviewModal";

interface MapViewProps {
  token: string;
}

interface CheckinData {
  id: string;
  lat: number;
  lng: number;
  name: string;
  description: string;
}

interface CafeData {
  id: string;
  name: string;
  lat: number;
  lng: number;
  rating: string;
  reviews: number;
  img: string;
  map_link: string;
}

const MapView: React.FC<MapViewProps> = ({ token }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [checkins, setCheckins] = useState<CheckinData[]>([]);
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{ id: string, name: string } | null>(null);
  const [matchedLocation, setMatchedLocation] = useState<{ id: string; name: string } | null>(null);
  const [cafes, setCafes] = useState<CafeData[]>([]);
  
  const loadCheckins = async () => {
    const res = await axiosInstance.get("/checkins");
    setCheckins(res.data);
  };

  const loadCafes = async () => {
    const res = await axiosInstance.get("/cafes");
    const cafeList: CafeData[] = res.data;
    setCafes(cafeList);

    cafeList.forEach((cafe) => {
      new mapboxgl.Marker({ color: "brown" })
        .setLngLat([cafe.lng, cafe.lat])
        .setPopup(
          new mapboxgl.Popup().setHTML(`
            <strong>${cafe.name}</strong><br/>
            ⭐ ${cafe.rating}｜評論數：${cafe.reviews}<br/>
            <a href="${cafe.map_link}" target="_blank">查看地圖</a>
          `)
        )
    });
  };

  mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN;

useEffect(() => {
  if (!mapRef.current || !mapContainer.current) {
    mapRef.current = new mapboxgl.Map({
      container: mapContainer.current!,
      style: "mapbox://styles/mapbox/streets-v11",
      center: [121.5654, 25.0330],
      zoom: 12,
    });

    mapRef.current.on("load", () => {
      loadCafes(); 
      loadCheckins();
    });
  }
}, []);

// clicking map marker
useEffect(() => {
  if (!mapRef.current) return;

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
      setSelectedLocation({ id: cafe.id, name: cafe.name }); // will trigger review show
    });
  });
}, [cafes]);

  useEffect(() => {
    checkins.forEach((checkin) => {
      new mapboxgl.Marker()
        .setLngLat([checkin.lng, checkin.lat])
        .setPopup(new mapboxgl.Popup().setText(`${checkin.name}\n${checkin.description}`))
        .addTo(mapRef.current!);
    });
  }, [checkins]);

  useEffect(() => {
    loadCheckins();
    loadCafes(); 
  }, []);

  console.log(cafes);

  return (
    <div>
      <div ref={mapContainer} style={{ width: "100%", height: "500px" }} />
      {selectedLocation && (
        <ReviewModal
            location={selectedLocation}
            token={token}
            onClose={() => setSelectedLocation(null)}
        />
        )}
      {selectedCoords && (
        <CheckInModal
            lat={selectedCoords.lat}
            lng={selectedCoords.lng}
            token={token}
            locationId={matchedLocation?.id} 
            onClose={() => setSelectedCoords(null)}
            onSuccess={loadCheckins}
        />
      )}
    </div>
  );
};

export default MapView;
