import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getTracks } from '../api/client';
import TrackCard from '../components/TrackCard';
import TimeMachine from '../components/TimeMachine';

const GENRES = [
  'Big Band', 'Swing', 'Bebop', 'Early Rock & Roll', 'Doo-Wop',
  'Blues', 'Country & Western', 'Jazz', 'Classical', 'Folk', 'Gospel'
];

/* Historical Context Card modal */
function InfoPanel({ track, onClose }) {
  if (!track) return null;
  const artistName = typeof track.artist === 'object' ? track.artist?.name : '';
  return (
    <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-parchment max-w-lg w-full rounded-md shadow-2xl border-2 border-ink/30 p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-3 right-4 font-mono text-sepia hover:text-oxblood">✕</button>
        <p className="typeline mb-1">HISTORICAL CONTEXT FILE · No. {track._id.slice(-6).toUpperCase()}</p>
        <h3 className="font-display font-black text-2xl">{track.title}</h3>
        <p className="italic text-sepia mb-4">{artistName} — {track.releaseYear} · {track.genre}</p>
        <div className="border-t border-dashed border-sepia/50 pt-4 font-body text-sm leading-relaxed whitespace-pre-line">
          {track.historicalTrivia || 'No archival notes on file for this record yet. Our historians are still digging through the crates.'}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 typeline">
          {track.recordLabel && <span>LABEL: {track.recordLabel}</span>}
          {track.album && <span>ALBUM: {track.album}</span>}
          {track.composers?.length > 0 && <span>WRITTEN BY: {track.composers.join(', ')}</span>}
          <span>PLAYS: {track.playCount ?? 0}</span>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [searchParams] = useSearchParams();
  const search = searchParams.get('search') || '';

  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [decade, setDecade] = useState('');
  const [year, setYear] = useState('');
  const [genre, setGenre] = useState('');
  const [sort, setSort] = useState('popular');
  const [infoTrack, setInfoTrack] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getTracks({ decade, genre, year, sort })
      .then((res) => {
        if (cancelled) return;
        const data = res.data.tracks || res.data.data || res.data || [];
        setTracks(Array.isArray(data) ? data : []);
        setError(null);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e.response?.data?.message || 'The archive could not be reached. Is the backend running on :5000?');
        setTracks([]);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [decade, genre, year, sort]);

  // Client-side narrowing when a text search is present
  const visible = search
    ? tracks.filter((t) => {
        const name = typeof t.artist === 'object' ? t.artist.name : '';
        return (
          t.title?.toLowerCase().includes(search.toLowerCase()) ||
          name?.toLowerCase().includes(search.toLowerCase())
        );
      })
    : tracks;

  return (
    <main className="max-w-6xl mx-auto px-4 py-8 pb-40">
      {/* Masthead */}
      <section className="text-center mb-10">
        <p className="typeline mb-2">VOL. XXIX · SATURDAY EDITION · PRICE TEN CENTS</p>
        <h1 className="font-display font-black text-4xl md:text-6xl tracking-tight">
          The Golden Age Archive
        </h1>
        <p className="font-body italic text-sepia mt-3 max-w-xl mx-auto">
          Preserving the wax cylinders, shellac discs and vinyl long-players of the
          thirties, forties and fifties — one groove at a time.
        </p>
        {search && (
          <p className="typeline mt-3">SEARCHING THE STACKS FOR “{search.toUpperCase()}”</p>
        )}
      </section>

      <TimeMachine
        decade={decade}
        year={year}
        onDecadeChange={setDecade}
        onYearChange={setYear}
      />

      {/* Genre + sort controls */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <span className="typeline mr-1">GENRE:</span>
        <button
          onClick={() => setGenre('')}
          className={`font-mono text-xs px-3 py-1 rounded-full border ${!genre ? 'bg-ink text-parchment' : 'border-sepia/40 text-sepia hover:bg-linen'}`}
        >ALL</button>
        {GENRES.map((g) => (
          <button
            key={g}
            onClick={() => setGenre(g === genre ? '' : g)}
            className={`font-mono text-xs px-3 py-1 rounded-full border ${genre === g ? 'bg-ink text-parchment' : 'border-sepia/40 text-sepia hover:bg-linen'}`}
          >
            {g.toUpperCase()}
          </button>
        ))}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="ml-auto font-mono text-xs bg-parchment border border-sepia/40 rounded-full px-3 py-1.5"
          aria-label="Sort tracks"
        >
          <option value="popular">MOST PLAYED</option>
          <option value="newest">NEWEST FIRST</option>
          <option value="oldest">OLDEST FIRST</option>
          <option value="title">A → Z</option>
        </select>
      </div>

      {error && (
        <div className="record-sleeve rounded-md p-6 text-center mb-8">
          <p className="font-display text-xl text-oxblood">⚠ Static on the line</p>
          <p className="typeline mt-2">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-20">
          <div className="inline-block w-16 h-16 rounded-full bg-[radial-gradient(circle,#111_25%,#333_26%,#111_45%,#333_46%,#111_70%)] border-4 border-black vinyl-spin" />
          <p className="typeline mt-4">CRANKING THE TURNTABLE…</p>
        </div>
      ) : visible.length === 0 && !error ? (
        <p className="text-center font-display italic text-2xl text-sepia py-20">
          No records in this corner of the archive. Try another stop on the Time Machine.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {visible.map((t) => (
            <TrackCard key={t._id} track={t} onShowInfo={setInfoTrack} />
          ))}
        </div>
      )}

      <InfoPanel track={infoTrack} onClose={() => setInfoTrack(null)} />
    </main>
  );
}
