// src/App.tsx 總路由
import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Chat from "./pages/Chat";
import Dashboard from "./pages/Dashboard";
import DashboardSideBar from "./components/DashboardSideBar";
import UserPage  from "./pages/UserPage";
import UserProfilePage from './pages/UserProfilePage';
import Explore from './components/Explore';
import { ConfigProvider } from 'antd';

const App: React.FC = () => {
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [receiverId, setReceiverId] = useState<string | null>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedUserId = localStorage.getItem("userId");
    if (savedToken && savedUserId) {
      setToken(savedToken);
      setUserId(savedUserId);
    }
  }, []);

  if (!token || !userId) {
    return (
      <Router>
        <Routes>
          <Route
            path="/login"
            element={
              <Login
                onLogin={(tk, uid) => {
                  setToken(tk);
                  setUserId(uid);
                  localStorage.setItem("token", tk);
                  localStorage.setItem("userId", uid);
                }}
              />
            }
          />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    );
  }

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#8B6E4E',
          colorPrimaryHover: '#7B5E3E',
          colorPrimaryActive: '#6A4E2E',
        },
      }}
    >
    <Router>
        <Routes>
          <Route path="/login" element={<Navigate to="/dashboard" />} />
          <Route path="/" element={<DashboardSideBar />}>
            <Route
              path="dashboard"
              element={
                <Dashboard
                  token={token}
                  userId={userId}
                  setReceiverId={setReceiverId}
                />
              }
            />
            <Route path="explore" element={<Explore />} />
            <Route
              path="chat"
              element={
                <Chat
                  token={token}
                  userId={userId}
                  receiverId={receiverId}
                />
              }
            />
            <Route
              path="userPage"
              element={
                <UserPage />
              }
            />
            <Route 
              path="/users/:userId" 
              element={
                <UserProfilePage 
              />} 
            />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
    </Router>
    </ConfigProvider>
  );
};

export default App;
