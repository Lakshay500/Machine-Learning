import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getArtist } from '../api/client';
import { usePlayer } from '../context/PlayerContext';
import TrackCard from '../components/TrackCard';

export default function ArtistDetail() {
  const { id } = useParams();
  const [artist, setArtist] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [error, setError] = useState(null);
  const { playList } = usePlayer();

  useEffect(() => {
    getArtist(id)
      .then((res) => {
        const data = res.data.data || res.data.artist || res.data;
        setArtist(data);
        setTracks(data.tracks || data.discography || []);
      })
      .catch((e) => setError(e.response?.data?.message || 'Artist not found in the registry.'));
  }, [id]);

  if (error) return <main className="max-w-4xl mx-auto p-8"><p className="text-oxblood font-mono">{error}</p></main>;
  if (!artist) return <main className="max-w-4xl mx-auto p-8"><p className="typeline">LOOKING UP THE FILE…</p></main>;

  return (
    <main className="max-w-6xl mx-auto px-4 py-8 pb-40">
      <section className="record-sleeve rounded-lg p-6 flex flex-col md:flex-row gap-6 mb-10">
        <div className="vignette w-48 h-48 shrink-0 rounded-md overflow-hidden bg-linen self-center">
          {artist.imageUrl ? (
            <img src={artist.imageUrl} alt={artist.name} className="w-full h-full object-cover vintage-img" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl opacity-40">🎷</div>
          )}
        </div>
        <div>
          <p className="typeline mb-1">BIOGRAPHY FILE · {(artist.activeDecades || []).join(', ').toUpperCase()}</p>
          <h1 className="font-display font-black text-4xl">{artist.name}</h1>
          <p className="font-body mt-3 leading-relaxed whitespace-pre-line">{artist.bio || 'No biography on file.'}</p>
          {tracks.length > 0 && (
            <button onClick={() => playList(tracks, 0)} className="btn-primary mt-4">
              ▶ Play all records
            </button>
          )}
        </div>
      </section>

      <h2 className="font-display font-bold text-2xl mb-4">Discography</h2>
      {tracks.length === 0 ? (
        <p className="typeline">NO RECORDS CATALOGUED FOR THIS ARTIST YET.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {tracks.map((t) => <TrackCard key={t._id} track={t} />)}
        </div>
      )}
    </main>
  );
}
