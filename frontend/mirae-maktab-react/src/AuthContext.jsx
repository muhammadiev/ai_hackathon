import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { login as loginRequest, logout as logoutRequest, fetchMyProfile } from './api/auth.js';
import { getAccessToken } from './api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    if (!getAccessToken()) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const profile = await fetchMyProfile();
      setUser(profile);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    const onExpired = () => setUser(null);
    window.addEventListener('miraedu:session-expired', onExpired);
    return () => window.removeEventListener('miraedu:session-expired', onExpired);
  }, []);

  const login = useCallback(async (username, password) => {
    await loginRequest(username, password);
    const profile = await fetchMyProfile();
    setUser(profile);
    return profile;
  }, []);

  const logout = useCallback(() => {
    logoutRequest();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshProfile: loadProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}