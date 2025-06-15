// src/pages/Dashboard.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../axiosInstance";
import MapView from "../components/MapView";

interface DashboardProps {
  token: string;
  userId: string;
  setReceiverId: (id: string) => void;
}

interface UserInfo {
  id: string;
  name: string;
  email: string;
}

const Dashboard: React.FC<DashboardProps> = ({ token, userId, setReceiverId }) => {
  const [users, setUsers] = useState<UserInfo[]>([]);
  const navigate = useNavigate();

  const handleChat = (targetId: string) => {
    setReceiverId(targetId);
    navigate("/chat");
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2>GoPal Dashboard</h2>
      <MapView token={token} userId={userId} />
    </div>
  );
};

export default Dashboard;
