import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/types';
import { apiClient } from '@/services/api/client';
import { signInWithGooglePopup } from '@/services/firebase';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<User>;
  register: (data: { name: string; email: string; password: string }) => Promise<User>;
  loginWithGoogle: () => Promise<User>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('padikam_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      const userData = (await apiClient.get('/auth/me')) as User;
      setUser(userData);
      localStorage.setItem('padikam_user', JSON.stringify(userData));
    } catch (error) {
      setUser(null);
      localStorage.removeItem('padikam_user');
      localStorage.removeItem('padikam_token');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('padikam_token');
    if (token) {
      refreshUser();
    } else {
      setIsLoading(false);
    }

    const handleUnauthorized = () => {
      setUser(null);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const login = async (credentials: { email: string; password: string }) => {
    const res = (await apiClient.post('/auth/login', credentials)) as {
      token: string;
      user: User;
    };
    localStorage.setItem('padikam_token', res.token);
    localStorage.setItem('padikam_user', JSON.stringify(res.user));
    setUser(res.user);
    return res.user;
  };

  const register = async (data: { name: string; email: string; password: string }) => {
    const res = (await apiClient.post('/auth/register', data)) as {
      token: string;
      user: User;
    };
    localStorage.setItem('padikam_token', res.token);
    localStorage.setItem('padikam_user', JSON.stringify(res.user));
    setUser(res.user);
    return res.user;
  };

  const loginWithGoogle = async () => {
    const idToken = await signInWithGooglePopup();
    const res = (await apiClient.post('/auth/google', { idToken })) as {
      token: string;
      user: User;
    };
    localStorage.setItem('padikam_token', res.token);
    localStorage.setItem('padikam_user', JSON.stringify(res.user));
    setUser(res.user);
    return res.user;
  };

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (e) {
      // Ignore logout network errors
    } finally {
      localStorage.removeItem('padikam_token');
      localStorage.removeItem('padikam_user');
      setUser(null);
    }
  };

  const updateUser = (updated: User) => {
    setUser(updated);
    localStorage.setItem('padikam_user', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        loginWithGoogle,
        logout,
        updateUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
