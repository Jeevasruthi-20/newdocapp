import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch, apiJson, apiAuthPost, setTokens, clearTokens, getAccessToken, getImageUrl } from '../lib/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadUser = useCallback(async () => {
    if (!getAccessToken()) {
      setCurrentUser(null);
      setLoading(false);
      return;
    }
    try {
      const user = await apiJson('/api/auth/me');
      setCurrentUser(user);
    } catch {
      clearTokens();
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
    const onLogout = () => {
      setCurrentUser(null);
      navigate('/login');
    };
    window.addEventListener('auth:logout', onLogout);
    return () => window.removeEventListener('auth:logout', onLogout);
  }, [loadUser, navigate]);

  const login = async (email, password) => {
    const data = await apiAuthPost('/api/auth/login', { email, password });
    setTokens(data.accessToken, data.refreshToken);
    setCurrentUser(data.user);
    return data.user;
  };

  const signup = async (userData) => {
    const data = await apiAuthPost('/api/auth/signup', userData);
    setTokens(data.accessToken, data.refreshToken);
    setCurrentUser(data.user);
    return data.user;
  };

  const logout = async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch {
      /* ignore */
    }
    clearTokens();
    setCurrentUser(null);
    navigate('/login');
  };

  const updateUserProfile = async (updates, file = null) => {
    const formData = new FormData();
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && value !== null) formData.append(key, value);
    });
    if (file) formData.append('profileImage', file);

    const res = await apiFetch('/api/user/profile', {
      method: 'PUT',
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Update failed');
    setCurrentUser(data.user);
    return data.user;
  };

  const refreshUser = async () => {
    const user = await apiJson('/api/auth/me');
    setCurrentUser(user);
    return user;
  };

  const getDisplayName = () => currentUser?.name || 'User';
  const getEmail = () => currentUser?.email || '';
  const getPhotoURL = () => getImageUrl(currentUser?.profileImage);
  const isAuthenticated = () => !!currentUser;
  const isEmailVerified = () => currentUser?.isEmailVerified || false;

  const value = {
    currentUser,
    loading,
    login,
    signup,
    logout,
    updateUserProfile,
    refreshUser,
    setCurrentUser,
    getDisplayName,
    getEmail,
    getPhotoURL,
    isAuthenticated,
    isEmailVerified,
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <p>Loading MedConnect...</p>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
