import React from "react";
import { useNavigate, Outlet } from "react-router-dom";

const DashboardSideBar: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");

    window.location.href = "/login"; 
    };


  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* 側邊選單 */}
      <div style={{ width: "220px", background: "#f0f0f0", padding: "1rem" }}>
        <h3>功能選單</h3>
        <ul style={{ listStyle: "none", padding: 0 }}>
          <li style={{ marginBottom: "1rem" }}>
            <button onClick={() => navigate("/dashboard")}>首頁</button>
          </li>
          <li style={{ marginBottom: "1rem" }}>
            <button onClick={() => navigate("/chat")}>聊天</button>
          </li>
          <li style={{ marginBottom: "1rem" }}>
            <button onClick={handleLogout}>登出</button>
          </li>
          <li style={{ marginBottom: "1rem" }}>
            <button onClick={() => navigate("/userPage")}>個人頁面</button>
          </li>
        </ul>
      </div>

      {/* 主內容區域 */}
      <div style={{ flex: 1, padding: "1rem", overflowY: "auto" }}>
        <Outlet />
      </div>
    </div>
  );
};

export default DashboardSideBar;
