import React, { useState } from "react";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import "./DashboardSideBar.css";

const DashboardSideBar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    window.location.href = "/login"; 
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Helper function to check if current route is active
  const isActiveRoute = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="dashboard-container">
      {/* 側邊選單 */}
      <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <h3 className="sidebar-title">
            <span className="title-text">GoPal</span>
          </h3>
          
          {/* 裝飾性彩色點 */}
          <div className="color-dots">
            <span className="dot dot-red"></span>
            <span className="dot dot-yellow"></span>
            <span className="dot dot-green"></span>
          </div>
        </div>
        
        <ul className="sidebar-nav">
          {/* 首頁 */}
          <li 
            className={`nav-item ${isCollapsed ? 'collapsed-tooltip' : ''}`}
            data-tooltip="首頁"
          >
            <button 
              className={`nav-button home ${isActiveRoute("/dashboard") ? 'active' : ''}`}
              onClick={() => navigate("/dashboard")}
            >
              <span className="nav-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
              </span>
              <span className="nav-label">首頁</span>
            </button>
          </li>
          
          {/* 訊息 */}
          <li 
            className={`nav-item ${isCollapsed ? 'collapsed-tooltip' : ''}`}
            data-tooltip="私訊"
          >
            <button 
              className={`nav-button chat ${isActiveRoute("/menu") ? 'active' : ''}`}
              onClick={() => navigate("/chat")}
            >
              <span className="nav-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"></path>
                  <path d="M3 6h18"></path>
                  <path d="M10 10a2 2 0 004 0"></path>
                </svg>
              </span>
              <span className="nav-label">菜單</span>
            </button>
          </li>
          
          {/* 個人頁面 */}
          <li 
            className={`nav-item ${isCollapsed ? 'collapsed-tooltip' : ''}`}
            data-tooltip="個人頁面"
          >
            <button 
              className={`nav-button profile ${isActiveRoute("/userPage") ? 'active' : ''}`}
              onClick={() => navigate("/userPage")}
            >
              <span className="nav-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </span>
              <span className="nav-label">個人頁面</span>
            </button>
          </li>
          
          {/* 底部填充空間 */}
          <div className="nav-spacer"></div>
          
          {/* 登出按鈕 */}
          <li 
            className={`nav-item ${isCollapsed ? 'collapsed-tooltip' : ''}`}
            data-tooltip="登出"
          >
            <button 
              className="nav-button logout"
              onClick={handleLogout}
            >
              <span className="nav-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
              </span>
              <span className="nav-label">登出</span>
            </button>
          </li>
        </ul>
        
        {/* 側邊欄收起按鈕 */}
        <button 
          className="sidebar-toggle"
          onClick={toggleSidebar}
          title={isCollapsed ? "展開側邊欄" : "收起側邊欄"}
          aria-label={isCollapsed ? "展開側邊欄" : "收起側邊欄"}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d={isCollapsed ? "M9 18l6-6-6-6" : "M15 18l-6-6 6-6"}></path>
          </svg>
        </button>
      </div>

      {/* 主內容區域 */}
      <div className="main-content">
        <Outlet />
      </div>
    </div>
  );
};

export default DashboardSideBar;