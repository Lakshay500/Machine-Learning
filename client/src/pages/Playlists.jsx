import { useEffect, useState } from 'react';
import { getPlaylists, createPlaylist, addToPlaylist } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';

export default function Playlists() {
  const { user } = useAuth();
  const { playList, currentTrack } = usePlayer();
  const [playlists, setPlaylists] = useState([]);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', isPublic: true });
  const [open, setOpen] = useState(null); // expanded playlist (with populated tracks)

  const load = () =>
    getPlaylists()
      .then((res) => {
        const data = res.data.playlists || res.data.data || res.data || [];
        setPlaylists(Array.isArray(data) ? data : []);
        setError(null);
      })
      .catch((e) => setError(e.response?.data?.message || 'Could not fetch the mixtape shelf.'));

  useEffect(() => { load(); }, []);

  const onCreate = async (e) => {
    e.preventDefault();
    try {
      await createPlaylist(form);
      setForm({ title: '', description: '', isPublic: true });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to press a new mixtape.');
    }
  };

  const onAddCurrent = async (pl) => {
    if (!currentTrack) return alert('Play a record first, then add it to this mixtape.');
    try {
      await addToPlaylist(pl._id, currentTrack._id);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not splice that track into the tape.');
    }
  };

  return (
    <main className="max-w-5xl mx-auto px-4 py-8 pb-40">
      <p className="typeline mb-1">SECTION III · CUSTOM RECORD CRATES</p>
      <h1 className="font-display font-black text-4xl mb-8">Mixtapes &amp; Record Crates</h1>

      {error && <p className="text-oxblood font-mono text-sm mb-4">{error}</p>}

      {user ? (
        <form onSubmit={onCreate} className="record-sleeve rounded-lg p-5 mb-8 grid md:grid-cols-[1fr_2fr_auto] gap-3 items-end">
          <label className="block">
            <span className="typeline">MIXTAPE TITLE</span>
            <input
              required value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full mt-1 bg-parchment border border-sepia/40 rounded px-3 py-2"
              placeholder="Sunday Serenade, 1943"
            />
          </label>
          <label className="block">
            <span className="typeline">LINER NOTES</span>
            <input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full mt-1 bg-parchment border border-sepia/40 rounded px-3 py-2"
              placeholder="For slow dances and ration-book Sundays…"
            />
          </label>
          <button type="submit" className="btn-gold">✚ Press Mixtape</button>
        </form>
      ) : (
        <p className="typeline mb-8">SIGN IN AT THE COUNTER TO PRESS YOUR OWN MIXTAPES.</p>
      )}

      <div className="grid sm:grid-cols-2 gap-6">
        {playlists.map((pl) => (
          <div key={pl._id} className="record-sleeve rounded-lg p-5">
            <div className="flex justify-between items-start gap-2">
              <div>
                <h3 className="font-display font-bold text-xl">{pl.title}</h3>
                <p className="typeline">
                  {(pl.creator?.username || 'ANONYMOUS').toUpperCase()} · {pl.tracks?.length ?? pl.trackCount ?? 0} TRACKS · {pl.isPublic === false ? 'PRIVATE' : 'PUBLIC'}
                </p>
              </div>
              {user && (
                <button onClick={() => onAddCurrent(pl)} className="font-mono text-xs btn-outline !px-3 !py-1" title="Add currently playing track">
                  + current
                </button>
              )}
            </div>
            {pl.description && <p className="italic text-sm text-sepia mt-2">{pl.description}</p>}
            <div className="mt-3 flex gap-2">
              <button onClick={() => setOpen(open?._id === pl._id ? null : pl)} className="font-mono text-xs underline hover:text-oxblood">
                {open?._id === pl._id ? 'hide tracklist' : 'view tracklist'}
              </button>
              {pl.tracks?.length > 0 && (
                <button onClick={() => playList(pl.tracks, 0)} className="font-mono text-xs underline hover:text-oxblood">▶ play all</button>
              )}
            </div>
            {open?._id === pl._id && (
              <ol className="mt-2 space-y-1 list-decimal list-inside text-sm">
                {(open.tracks || []).map((t) => (
                  <li key={t._id || t}>
                    {typeof t === 'object' ? `${t.title} (${t.releaseYear})` : t}
                  </li>
                ))}
                {(open.tracks || []).length === 0 && <li className="list-none text-sepia italic">Empty crate.</li>}
              </ol>
            )}
          </div>
        ))}
        {playlists.length === 0 && (
          <p className="col-span-full text-center font-display italic text-sepia py-16">
            No mixtapes pressed yet. Be the first!
          </p>
        )}
      </div>
    </main>
  );
}
