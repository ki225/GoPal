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

const staticLocations: {
    id: string;
    name: string;
    lat: number;
    lng: number;
}[] = [
    { id: "test-1", name: "星巴克 101", lat: 25.033964, lng: 121.564472 },
    { id: "test-2", name: "咖啡 Roaster", lat: 25.04181, lng: 121.54853 }
];

const MapView: React.FC<MapViewProps> = ({ token }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [checkins, setCheckins] = useState<CheckinData[]>([]);
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{ id: string, name: string } | null>(null);
  const [matchedLocation, setMatchedLocation] = useState<{ id: string; name: string } | null>(null);

  const loadCheckins = async () => {
    const res = await axiosInstance.get("/checkins");
    setCheckins(res.data);
  };

  mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN;

  useEffect(() => {
    if (mapContainer.current && !mapRef.current) {
        mapRef.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/streets-v11",
        center: [121.5, 25.05],
        zoom: 12,
        });

        mapRef.current.on("click", (e: mapboxgl.MapMouseEvent) => {
            const clickedLat = e.lngLat.lat;
            const clickedLng = e.lngLat.lng;

            const found = staticLocations.find(
                loc =>
                Math.abs(loc.lat - clickedLat) < 0.0001 &&
                Math.abs(loc.lng - clickedLng) < 0.0001
            );

            if (found) {
                setSelectedLocation({ id: found.id, name: found.name });
            } else {
                setSelectedCoords({ lat: clickedLat, lng: clickedLng });
                setMatchedLocation(null);
            }
            });

        staticLocations.forEach(loc => {
            const marker = new mapboxgl.Marker({ color: "blue" })
                .setLngLat([loc.lng, loc.lat])
                .addTo(mapRef.current!);

            marker.getElement().addEventListener("click", () => {
                setSelectedLocation({ id: loc.id, name: loc.name }); 
            });
        });
    }
  }, []);

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
  }, []);

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
