'use client';

import type { User } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react';

export interface AuthContextType {
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      localStorage.removeItem('user');
    } finally {
        setIsLoading(false);
    }
  }, []);

  const login = useCallback((userData: User) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    if (userData.role === 'admin') {
      router.push('/admin');
    } else {
      router.push('/dashboard');
    }
  }, [router]);

  const logout = useCallback(() => {
    localStorage.removeItem('user');
    setUser(null);
    router.push('/');
  }, [router]);
  
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}
