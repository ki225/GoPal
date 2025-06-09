import React, { useState } from "react";
import axios from "axios";
import axiosInstance from "../axiosInstance";
import "./Login.css"; 

const API_BASE = "http://localhost";

interface LoginProps {
  onLogin: (token: string, userId: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      let res;
      if (isRegister) {
        res = await axiosInstance.post("/users/register", {
          email,
          name,
          password,
          travel_preferences: [],
        });
        alert("註冊成功，請登入");
        setIsRegister(false);
        return;
      } else {
        res = await axiosInstance.post("/users/login", { email, password });
        const { token, userId } = res.data;
        console.log("登入成功，token:", token);
        axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        localStorage.setItem("token", token);
        localStorage.setItem("userId", userId);
        onLogin(token, userId);
      }
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else {
        setError("登入或註冊失敗，請確認資訊是否正確");
      }
    }
  };

  return (
    <div className="login-container">
      <h2>{isRegister ? "註冊新帳號" : "登入"}</h2>
      <form onSubmit={handleSubmit} className="login-form">
        <input type="email" placeholder="電子信箱" value={email} onChange={(e) => setEmail(e.target.value)} required />
        {isRegister && (
          <input type="text" placeholder="使用者名稱" value={name} onChange={(e) => setName(e.target.value)} required />
        )}
        <input type="password" placeholder="密碼" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <div className="error">{error}</div>}
        <button type="submit">{isRegister ? "註冊" : "登入"}</button>
      </form>
      <p>
        {isRegister ? "已有帳號？" : "尚未註冊？"}
        <button onClick={() => setIsRegister(!isRegister)}>
          {isRegister ? "切換到登入" : "切換到註冊"}
        </button>
      </p>
    </div>
  );
};

export default Login;
