'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import api from '../lib/api';

const AuthContext = createContext({});

// Protected route prefixes (similar to middleware)
const PROTECTED_PREFIXES = [
  '/userprofile',
  '/dashboard',
  '/settings',
  '/my-account',
  '/orders',
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const isProtectedRoute = PROTECTED_PREFIXES.some(prefix => pathname.startsWith(prefix));

  useEffect(() => {
    const checkAuth = async () => {
      // If route is NOT protected, skip auth check
      if (!isProtectedRoute) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get('v1/user/');
        setUser(response.data);
        // No need to redirect, user is authenticated
      } catch (error) {
        console.error('Authentication check failed:', error);
        setUser(null);
        router.push('/login'); // 👈 If not authenticated, redirect to login
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [pathname]);

  const login = async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      const { id, name, email } = response.data;
      setUser({ id, name, email });
      console.log('Login successful:', response.data);
      return response;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      router.push('/login');
      return response.data;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
      setUser(null);
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
