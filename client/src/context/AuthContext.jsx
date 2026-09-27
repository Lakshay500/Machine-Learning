import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { loginRequest, registerRequest, meRequest, toggleFavorite } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session from stored JWT
  useEffect(() => {
    const token = localStorage.getItem('gaa_token');
    if (!token) {
      setLoading(false);
      return;
    }
    meRequest()
      .then((res) => setUser(res.data))
      .catch(() => localStorage.removeItem('gaa_token'))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await loginRequest(email, password);
    localStorage.setItem('gaa_token', res.data.token);
    setUser(res.data);
    return res.data;
  }, []);

  const register = useCallback(async (username, email, password) => {
    const res = await registerRequest(username, email, password);
    localStorage.setItem('gaa_token', res.data.token);
    setUser(res.data);
    return res.data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('gaa_token');
    setUser(null);
  }, []);

  const favoriteIds = user?.favoriteTracks
    ? user.favoriteTracks.map((t) => (typeof t === 'string' ? t : t._id))
    : [];

  const isFavorite = useCallback(
    (trackId) => favoriteIds.includes(trackId),
    [JSON.stringify(favoriteIds)]
  );

  const toggleFav = useCallback(
    async (trackId) => {
      const res = await toggleFavorite(trackId);
      setUser((prev) => ({ ...prev, favoriteTracks: res.data.favoriteTracks }));
      return res.data.favorited;
    },
    []
  );

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, isFavorite, toggleFav }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
