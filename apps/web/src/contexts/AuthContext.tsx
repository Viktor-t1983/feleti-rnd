import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { api } from '../lib/api';

export interface User {
  id: string;
  email: string;
  username: string;
  fullName?: string;
  role?: string | { name: string };
  createdAt?: string;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
  fullName: string;
}

interface LoginResponse {
  accessToken: string;
  user: User;
}

interface RegisterResponse {
  accessToken: string;
  user: User;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  updateUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUser = useCallback(async (): Promise<void> => {
    try {
      const response = await api.get<User>('/api/auth/me');
      setUser(response.data);
    } catch (error: unknown) {
      console.error('[AuthContext] Failed to load user:', error);
      setUser(null);
    }
  }, []);

  // Auto-load user on mount
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void loadUser().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [loadUser]);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      const response = await api.post<LoginResponse>('/api/auth/login', { email, password });
      const { accessToken, user: userData }: LoginResponse = response.data;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('accessToken', accessToken);
      setUser(userData);
    } catch (error) {
      console.error('[AuthContext] Login error:', error);
      throw error;
    }
  };

  const register = async (data: RegisterData): Promise<void> => {
    const response = await api.post<RegisterResponse>('/api/auth/register', data);
    const { accessToken, user: userData }: RegisterResponse = response.data;

    localStorage.setItem('accessToken', accessToken);
    setUser(userData);
  };

  const logout = (): void => {
    localStorage.removeItem('accessToken');
    setUser(null);
  };

  const updateUser = (newUser: User | null): void => {
    setUser(newUser);
  };

  const value = {
    user,
    isLoading,
    updateUser,
    login,
    register,
    logout,
    loadUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
