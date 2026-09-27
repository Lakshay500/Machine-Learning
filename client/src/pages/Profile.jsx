import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import TrackCard from '../components/TrackCard';

export default function Profile() {
  const { user, loading } = useAuth();

  if (loading) return <main className="max-w-4xl mx-auto p-8"><p className="typeline">CHECKING YOUR MEMBERSHIP CARD…</p></main>;
  if (!user) return <Navigate to="/login" replace />;

  const favorites = (user.favoriteTracks || []).map((t) =>
    typeof t === 'string' ? { _id: t, title: 'Record', releaseYear: '', duration: 0 } : t
  );
  const realFavorites = favorites.filter((t) => t.title && t._id);

  return (
    <main className="max-w-5xl mx-auto px-4 py-8 pb-40">
      <p className="typeline mb-1">PRIVATE RECORDS · MEMBERSHIP FILE</p>
      <h1 className="font-display font-black text-4xl mb-2">{user.username}'s Crate</h1>
      <p className="typeline mb-8">MEMBER SINCE {new Date(user.createdAt || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase()} · {user.email.toUpperCase()}</p>

      <section className="mb-10">
        <h2 className="font-display font-bold text-2xl mb-4">❤️ Favorite Records ({realFavorites.length})</h2>
        {realFavorites.length === 0 ? (
          <p className="italic text-sepia">No favorites yet. Go give a heart to something with good horns.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {realFavorites.map((t) => <TrackCard key={t._id} track={t} />)}
          </div>
        )}
      </section>

      <section className="mb-10">
        <h2 className="font-display font-bold text-2xl mb-4">📼 Your Mixtapes ({(user.savedPlaylists || []).length})</h2>
        {(user.savedPlaylists || []).length === 0 ? (
          <p className="italic text-sepia">No mixtapes pressed. Visit the Mixtapes page to start one.</p>
        ) : (
          <ul className="space-y-2">
            {user.savedPlaylists.map((pl) => (
              <li key={pl._id} className="record-sleeve rounded px-4 py-2 font-display">
                {pl.title} <span className="typeline ml-2">{(pl.tracks || []).length} TRACKS</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-display font-bold text-2xl mb-4">🎺 Followed Artists ({(user.followedArtists || []).length})</h2>
        {(user.followedArtists || []).length === 0 ? (
          <p className="italic text-sepia">You are not following any artists yet.</p>
        ) : (
          <ul className="space-y-1">
            {user.followedArtists.map((a) => (
              <li key={a._id || a} className="font-body">{typeof a === 'object' ? a.name : a}</li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
