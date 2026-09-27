import { useState, useRef, useCallback } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { fmtTime } from './TrackCard';

/* Rotary volume knob: drag vertically to turn */
function VolumeKnob() {
  const { volume, setVolume } = usePlayer();
  const dragging = useRef(false);
  const startY = useRef(0);
  const startVol = useRef(0);

  const onPointerDown = (e) => {
    dragging.current = true;
    startY.current = e.clientY;
    startVol.current = volume;
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e) => {
    if (!dragging.current) return;
    const delta = (startY.current - e.clientY) / 150; // px per full sweep ≈ 150
    setVolume(startVol.current + delta);
  };
  const onPointerUp = () => { dragging.current = false; };

  const angle = -135 + volume * 270; // knob travel −135° … +135°

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="knob"
        style={{ '--angle': `${angle}deg` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        title={`Volume ${Math.round(volume * 100)}% — drag up/down`}
        role="slider"
        aria-label="Volume"
        aria-valuenow={Math.round(volume * 100)}
      />
      <span className="font-mono text-[9px] text-gold/80 tracking-widest">VOL</span>
    </div>
  );
}

/* Queue popover */
function QueuePanel({ onClose }) {
  const { queue, currentTrack, playList } = usePlayer();
  return (
    <div className="absolute bottom-full mb-2 right-4 w-80 max-h-72 overflow-y-auto bg-parchment text-ink rounded-md shadow-2xl border border-sepia/40 p-3 z-50">
      <div className="flex justify-between items-center mb-2">
        <h4 className="font-display font-bold">Now Queued</h4>
        <button onClick={onClose} className="font-mono text-xs hover:text-oxblood">✕ close</button>
      </div>
      {queue.length === 0 && <p className="typeline">The record crate is empty.</p>}
      <ol className="space-y-1">
        {queue.map((t, i) => (
          <li key={`${t._id}-${i}`} className="flex items-center gap-2 text-sm">
            <span className="font-mono text-xs text-sepia w-6">{String(i + 1).padStart(2, '0')}</span>
            <button
              className={`truncate hover:text-oxblood text-left ${currentTrack?._id === t._id ? 'font-bold text-oxblood' : ''}`}
              onClick={() => playList(queue, i)}
            >
              {t.title}
            </button>
            <span className="ml-auto typeline">{t.releaseYear}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function AudioPlayer() {
  const {
    currentTrack, isPlaying, currentTime, duration, vinylCrackle, error,
    togglePlay, playNext, playPrev, seek, rewind, fastForward, toggleCrackle, stop
  } = usePlayer();
  const [showQueue, setShowQueue] = useState(false);

  const fillPct = duration > 0 ? (currentTime / duration) * 100 : 0;
  const artistName = typeof currentTrack?.artist === 'object' ? currentTrack.artist.name : '';

  const onSeek = useCallback((e) => seek(parseFloat(e.target.value)), [seek]);

  return (
    <footer className="fixed bottom-0 inset-x-0 z-50 bg-radio text-parchment border-t-4 border-gold shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
      {error && (
        <div className="bg-oxblood text-parchment font-mono text-xs text-center py-1">{error}</div>
      )}
      <div className="relative max-w-6xl mx-auto px-4 py-3 grid grid-cols-[auto_1fr_auto] md:grid-cols-[220px_1fr_220px] items-center gap-4">
        {/* Left: spinning record + metadata */}
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`hidden sm:block w-12 h-12 shrink-0 rounded-full bg-[radial-gradient(circle,#111_25%,#333_26%,#111_45%,#333_46%,#111_70%)] border border-gold/40 relative ${
              isPlaying ? 'vinyl-spin' : ''
            }`}
          >
            <div className="absolute inset-[38%] rounded-full bg-gold" />
          </div>
          <div className="min-w-0">
            <p className="font-display font-bold truncate leading-tight">
              {currentTrack ? currentTrack.title : '— tuned to nothing —'}
            </p>
            <p className="font-mono text-[10px] text-gold/80 truncate uppercase">
              {currentTrack ? `${artistName} · ${currentTrack.releaseYear} · ${currentTrack.genre}` : 'select a record to begin'}
            </p>
          </div>
        </div>

        {/* Center: dial + transport */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-center gap-4 text-xl">
            <button onClick={toggleCrackle} title="Vinyl crackle overlay"
              className={`text-base transition-colors ${vinylCrackle ? 'text-gold' : 'text-parchment/40 hover:text-parchment'}`}>
              ⋯ CRACKLE {vinylCrackle ? 'ON' : 'OFF'}
            </button>
            <button onClick={playPrev} title="Previous / restart" className="hover:text-gold">⏮</button>
            <button onClick={rewind} title="Rewind 10s" className="hover:text-gold text-base">↺10</button>
            <button
              onClick={togglePlay}
              disabled={!currentTrack}
              title={isPlaying ? 'Pause' : 'Play'}
              className="w-11 h-11 rounded-full bg-gold text-radio text-lg font-bold shadow-inner disabled:opacity-40 hover:brightness-110 active:scale-95 transition"
            >
              {isPlaying ? '❚❚' : '▶'}
            </button>
            <button onClick={fastForward} title="Forward 10s" className="hover:text-gold text-base">↻10</button>
            <button onClick={playNext} title="Next" className="hover:text-gold">⏭</button>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-gold/80 w-10 text-right">{fmtTime(currentTime)}</span>
            <input
              type="range"
              className="radio-dial"
              min="0"
              max={duration || 0}
              step="0.1"
              value={currentTime}
              onChange={onSeek}
              style={{ '--fill': `${fillPct}%` }}
              disabled={!currentTrack}
              aria-label="Seek"
            />
            <span className="font-mono text-[10px] text-gold/80 w-10">{fmtTime(duration)}</span>
          </div>
        </div>

        {/* Right: knob + queue + power */}
        <div className="flex items-center justify-end gap-4">
          <VolumeKnob />
          <button
            onClick={() => setShowQueue((s) => !s)}
            className="font-mono text-[10px] tracking-widest text-parchment/80 hover:text-gold border border-parchment/30 rounded-full px-3 py-1"
          >
            QUEUE ▴
          </button>
          <button onClick={stop} title="Stop" className="font-mono text-[10px] text-oxblood hover:text-red-400 border border-oxblood/60 rounded-full px-3 py-1">
            STOP
          </button>
        </div>

        {showQueue && <QueuePanel onClose={() => setShowQueue(false)} />}
      </div>
    </footer>
  );
}
