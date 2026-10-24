import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../../services/api';

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  role_id: number;
  is_active: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });
  const [loading, setLoading] = useState(false);

  const refreshUser = useCallback(async () => {
    try {
      const res = await api.get('/auth/me');
      const u = res.data.data;
      setUser(u);
      localStorage.setItem('user', JSON.stringify(u));
    } catch {
      setUser(null);
      localStorage.removeItem('user');
    }
  }, []);

  async function login(email: string, password: string) {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      const { accessToken, user: u } = res.data.data;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('user', JSON.stringify(u));
      setUser(u);
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/login';
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated: !!user, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

