import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';

export const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' }
});

// Attach JWT to every request when present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('gaa_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/* ---------- Auth ---------- */
export const registerRequest = (username, email, password) =>
  api.post('/auth/register', { username, email, password });

export const loginRequest = (email, password) =>
  api.post('/auth/login', { email, password });

export const meRequest = () => api.get('/auth/me');

/* ---------- Tracks ---------- */
export const getTracks = ({ decade, genre, year, sort } = {}) => {
  const params = {};
  if (decade) params.decade = decade;
  if (genre) params.genre = genre;
  if (year) params.year = year;
  if (sort) params.sort = sort;
  return api.get('/tracks', { params });
};

export const getTrack = (id) => api.get(`/tracks/${id}`);

/* ---------- Artists ---------- */
export const getArtists = () => api.get('/artists');
export const getArtist = (id) => api.get(`/artists/${id}`);

/* ---------- Playlists ---------- */
export const getPlaylists = () => api.get('/playlists');
export const createPlaylist = (payload) => api.post('/playlists', payload);
export const addToPlaylist = (id, trackId) => api.put(`/playlists/${id}/add`, { trackId });

/* ---------- Users (likes / follows) ---------- */
export const toggleFavorite = (trackId) => api.post('/users/favorites', { trackId });
export const getUserProfile = () => api.get('/users/profile');
