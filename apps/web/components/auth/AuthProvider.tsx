'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (name: string, email: string, password: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const MOCK_USER: User = {
  id: 'mock-user-id',
  name: 'Usuário Demo',
  email: 'demo@zenith.app',
  avatar: undefined,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Verificar se há sessão salva
    const savedUser = localStorage.getItem('zenith_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      setIsAuthenticated(true);
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Mock: aceitar qualquer credencial
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const loggedInUser = { ...MOCK_USER, email };
    setUser(loggedInUser);
    setIsAuthenticated(true);
    localStorage.setItem('zenith_user', JSON.stringify(loggedInUser));
    return true;
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('zenith_user');
  };

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    // Mock: criar usuário
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const newUser = { ...MOCK_USER, name, email };
    setUser(newUser);
    setIsAuthenticated(true);
    localStorage.setItem('zenith_user', JSON.stringify(newUser));
    return true;
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}