import { usePlayer } from '../context/PlayerContext';
import { useAuth } from '../context/AuthContext';

export function fmtTime(s) {
  if (!Number.isFinite(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

export default function TrackCard({ track, onShowInfo }) {
  const { playList, currentTrack, isPlaying, enqueue } = usePlayer();
  const { user, isFavorite, toggleFav } = useAuth();

  const artistName = typeof track.artist === 'object' ? track.artist?.name : '';
  const active = currentTrack?._id === track._id;

  const onPlay = () => playList([track], 0);

  const onLike = async (e) => {
    e.stopPropagation();
    if (!user) return onShowInfo && null;
    try { await toggleFav(track._id); } catch (_) { /* offline */ }
  };

  return (
    <article
      className="record-sleeve rounded-md cursor-pointer group"
      onClick={onPlay}
      title={`Play ${track.title}`}
    >
      {/* Cover art / vinyl */}
      <div className="vignette aspect-square bg-radio overflow-hidden relative">
        {track.coverArtUrl ? (
          <img
            src={track.coverArtUrl}
            alt={`${track.title} cover`}
            className="w-full h-full object-cover vintage-img"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div
              className={`w-3/4 h-3/4 rounded-full bg-[radial-gradient(circle,#111_20%,#2b2b2b_21%,#111_40%,#2b2b2b_41%,#111_60%)] border-4 border-black relative ${
                active && isPlaying ? 'vinyl-spin' : ''
              }`}
            >
              <div className="absolute inset-[35%] rounded-full bg-gold flex items-center justify-center">
                <span className="text-[8px] font-mono text-radio">GAA</span>
              </div>
            </div>
          </div>
        )}

        {/* Play overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="text-parchment text-4xl">{active && isPlaying ? '❚❚' : '▶'}</span>
        </div>

        {/* Decade stamp */}
        <span className="absolute top-2 right-2 font-mono text-[10px] bg-gold text-radio px-2 py-0.5 rounded-full shadow rotate-3">
          {track.releaseYear}
        </span>
      </div>

      {/* Sleeve label */}
      <div className="p-3">
        <h3 className="font-display font-bold text-base leading-snug truncate">{track.title}</h3>
        <p className="text-sm text-sepia truncate italic">{artistName || 'Unknown Artist'}</p>
        <div className="flex items-center justify-between mt-2">
          <span className="typeline">{track.genre?.toUpperCase()} · {fmtTime(track.duration)}</span>
          <span className="flex gap-2">
            {onShowInfo && (
              <button
                onClick={(e) => { e.stopPropagation(); onShowInfo(track); }}
                className="font-mono text-xs text-sepia hover:text-oxblood"
                title="Historical context"
              >ⓘ</button>
            )}
            {user && (
              <button
                onClick={onLike}
                className="text-sm hover:scale-110 transition-transform"
                title="Favorite"
              >
                {isFavorite(track._id) ? '❤️' : '🤍'}
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); enqueue(track); }}
              className="font-mono text-xs text-sepia hover:text-oxblood"
              title="Add to queue"
            >＋Q</button>
          </span>
        </div>
      </div>
    </article>
  );
}
