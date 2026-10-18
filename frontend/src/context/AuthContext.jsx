import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi, getStoredToken, setStoredToken } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const verifySession = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      setUser(null);
      setAuthLoading(false);
      return;
    }

    try {
      const res = await authApi.me();
      setUser(res.data);
    } catch {
      setStoredToken(null);
      setUser(null);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    verifySession();
  }, [verifySession]);

  const login = async (credentials) => {
    const res = await authApi.login(credentials);
    setStoredToken(res.data.token);
    setUser(res.data.user);
    return res;
  };

  const register = async (userData) => {
    const res = await authApi.register(userData);
    setStoredToken(res.data.token);
    setUser(res.data.user);
    return res;
  };

  const logout = () => {
    setStoredToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        authLoading,
        isAuthenticated: Boolean(user),
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth harus digunakan di dalam AuthProvider');
  }
  return context;
}

