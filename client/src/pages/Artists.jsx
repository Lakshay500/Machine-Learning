import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getArtists } from '../api/client';

export default function Artists() {
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getArtists()
      .then((res) => {
        const data = res.data.data || res.data.artists || res.data || [];
        setArtists(Array.isArray(data) ? data : []);
      })
      .catch((e) => setError(e.response?.data?.message || 'Could not reach the artist registry.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="max-w-6xl mx-auto px-4 py-8 pb-40">
      <p className="typeline mb-1">SECTION II · THE PLAYERS</p>
      <h1 className="font-display font-black text-4xl mb-8">Artist Registry</h1>

      {error && <p className="text-oxblood font-mono text-sm mb-6">{error}</p>}
      {loading ? (
        <p className="typeline">FLIPPING THROUGH THE ROSTER…</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {artists.map((a) => (
            <Link key={a._id} to={`/artists/${a._id}`} className="record-sleeve rounded-md block">
              <div className="vignette aspect-square overflow-hidden bg-linen">
                {a.imageUrl ? (
                  <img src={a.imageUrl} alt={a.name} className="w-full h-full object-cover vintage-img" loading="lazy" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-5xl opacity-40">🎺</div>
                )}
              </div>
              <div className="p-3">
                <h3 className="font-display font-bold truncate">{a.name}</h3>
                <p className="typeline">{(a.activeDecades || []).join(' · ') || 'DECADES UNKNOWN'}</p>
              </div>
            </Link>
          ))}
          {artists.length === 0 && (
            <p className="col-span-full text-center font-display italic text-sepia py-16">
              The roster page is blank — no artists have been inducted yet.
            </p>
          )}
        </div>
      )}
    </main>
  );
}
