import React, { createContext, useContext, useEffect, useState } from "react";
import { api, setTokens, clearTokens, getStoredUser, setStoredUser } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function login(email, password) {
    setLoading(true);
    setError(null);
    try {
      const data = await api.post("/auth/login", { email, password });
      setTokens(data);
      setStoredUser(data.user);
      setUser(data.user);
      return data.user;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function register(email, password, name, roles) {
    setLoading(true);
    setError(null);
    try {
      const data = await api.post("/auth/register", { email, password, name, roles });
      setTokens(data);
      setStoredUser(data.user);
      setUser(data.user);
      return data.user;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  function mockLogin(role = "BUYER") {
    const mockUser = {
      id: "demo-user-1",
      email: `${role.toLowerCase()}@polyhub.dev`,
      name: `Demo ${role.charAt(0) + role.slice(1).toLowerCase().replace('_', ' ')}`,
      roles: [role],
    };
    setTokens({ accessToken: "mock-token", refreshToken: "mock-refresh" });
    setStoredUser(mockUser);
    setUser(mockUser);
    return mockUser;
  }

  function logout() {
    clearTokens();
    localStorage.removeItem("polyhub_user");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout, mockLogin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}