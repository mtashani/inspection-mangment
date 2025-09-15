'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService, User, LoginCredentials } from '@/lib/auth';
import { shouldUseMockData } from '@/lib/utils/development';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  token: string | null;
  inspector: User | null; // Alias for user for compatibility
  login: (credentials: LoginCredentials) => Promise<User>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  isAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  const checkAuth = async () => {
    try {
      if (authService.isAuthenticated()) {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      } else {
        // No token, user is not authenticated
        setUser(null);
      }
    } catch (error) {
      // Don't spam console in development
      if (process.env.NODE_ENV !== 'development') {
        console.error('Auth check failed:', error);
      }
      authService.logout();
      setUser(null);
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  };

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const user = await authService.login(credentials);
      // Immediately update user state for faster UI response
      setUser(user);
      setIsLoading(false);
      return user;
    } catch (error) {
      setUser(null);
      setIsLoading(false);
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const isAdmin = (): boolean => {
    if (!user || !user.roles) {
      return false;
    }
    // Check if user has Global Admin role (exact match)
    return user.roles.includes('Global Admin');
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    token: authService.getToken(),
    inspector: user, // Alias for user for compatibility
    login,
    logout,
    checkAuth,
    isAdmin,
  };

  // Don't render children until auth is initialized
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span>Initializing...</span>
        </div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}