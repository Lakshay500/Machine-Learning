import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PlayerProvider } from './context/PlayerContext';
import Navbar from './components/Navbar';
import AudioPlayer from './components/AudioPlayer';
import Home from './pages/Home';
import Artists from './pages/Artists';
import ArtistDetail from './pages/ArtistDetail';
import Playlists from './pages/Playlists';
import Login from './pages/Login';
import Profile from './pages/Profile';

export default function App() {
  return (
    <AuthProvider>
      <PlayerProvider>
        <div className="grain-overlay" aria-hidden />
        <BrowserRouter>
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/artists" element={<Artists />} />
            <Route path="/artists/:id" element={<ArtistDetail />} />
            <Route path="/playlists" element={<Playlists />} />
            <Route path="/login" element={<Login />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
          <AudioPlayer />
        </BrowserRouter>
      </PlayerProvider>
    </AuthProvider>
  );
}
