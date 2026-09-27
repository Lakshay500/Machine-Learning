import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navLinkClass = ({ isActive }) =>
  `font-mono text-sm tracking-widest uppercase px-3 py-1 rounded-full transition-colors ${
    isActive ? 'bg-oxblood text-parchment' : 'text-sepia hover:bg-linen'
  }`;

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const onSearch = (e) => {
    e.preventDefault();
    if (search.trim()) navigate(`/?search=${encodeURIComponent(search.trim())}`);
  };

  return (
    <header className="border-b-2 border-ink/20 bg-linen/70 backdrop-blur sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center gap-3">
        <Link to="/" className="flex items-center gap-2 mr-4">
          <span className="text-3xl leading-none" aria-hidden>📻</span>
          <span>
            <span className="block font-display font-black text-xl leading-tight text-ink">
              The Golden Age Archive
            </span>
            <span className="typeline">EST. 1930 — 1959 · ALL TRANSACTIONS IN RHYTHM</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          <NavLink to="/" end className={navLinkClass}>Browse</NavLink>
          <NavLink to="/artists" className={navLinkClass}>Artists</NavLink>
          <NavLink to="/playlists" className={navLinkClass}>Mixtapes</NavLink>
          {user && <NavLink to="/profile" className={navLinkClass}>My Crate</NavLink>}
        </nav>

        <form onSubmit={onSearch} className="ml-auto flex items-center gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search the archive…"
            className="font-mono text-sm bg-parchment border border-sepia/40 rounded-full px-4 py-1.5 focus:outline-none focus:border-gold w-44 sm:w-56"
          />
          {user ? (
            <>
              <span className="typeline hidden sm:inline">HELLO, {user.username.toUpperCase()}</span>
              <button type="button" onClick={logout} className="btn-outline !px-4 !py-1">
                Sign Off
              </button>
            </>
          ) : (
            <Link to="/login" className="btn-primary !px-4 !py-1">Sign In</Link>
          )}
        </form>
      </div>
    </header>
  );
}
