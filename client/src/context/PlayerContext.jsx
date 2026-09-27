import {
  createContext,
  useContext,
  useRef,
  useState,
  useCallback,
  useEffect
} from 'react';

const PlayerContext = createContext(null);

/**
 * Build a looping vinyl-crackle bed with the Web Audio API:
 * filtered noise bursts (surface hiss) + occasional pops/clicks.
 */
function createCrackleEngine(ctx, destination) {
  const master = ctx.createGain();
  master.gain.value = 0;
  master.connect(destination);

  // Surface hiss: looping filtered white noise buffer
  const hissBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const data = hissBuf.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.06;
  }
  const hiss = ctx.createBufferSource();
  hiss.buffer = hissBuf;
  hiss.loop = true;
  const hissFilter = ctx.createBiquadFilter();
  hissFilter.type = 'bandpass';
  hissFilter.frequency.value = 3000;
  hissFilter.Q.value = 0.5;
  hiss.connect(hissFilter).connect(master);
  hiss.start();

  // Random pops / clicks scheduled on a jittered interval
  let popTimer = null;
  const schedulePop = () => {
    popTimer = setTimeout(() => {
      const t = ctx.currentTime;
      const dur = 0.015 + Math.random() * 0.02;
      const popBuf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate);
      const d = popBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (d.length * 0.2));
      }
      const pop = ctx.createBufferSource();
      pop.buffer = popBuf;
      const popGain = ctx.createGain();
      popGain.gain.value = 0.4 + Math.random() * 0.5;
      const clickFilter = ctx.createBiquadFilter();
      clickFilter.type = 'highpass';
      clickFilter.frequency.value = 1200;
      pop.connect(clickFilter).connect(popGain).connect(master);
      pop.start(t);
      schedulePop();
    }, 150 + Math.random() * 1800);
  };
  schedulePop();

  return {
    setLevel(v) {
      master.gain.setTargetAtTime(v, ctx.currentTime, 0.1);
    },
    destroy() {
      clearTimeout(popTimer);
      try { hiss.stop(); } catch (_) { /* already stopped */ }
      master.disconnect();
    }
  };
}

export function PlayerProvider({ children }) {
  const audioRef = useRef(null);
  const crackleRef = useRef(null);
  const queueIndexRef = useRef(0);

  const [currentTrack, setCurrentTrack] = useState(null);
  const [queue, setQueue] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.8);
  const [vinylCrackle, setVinylCrackle] = useState(false);
  const [error, setError] = useState(null);

  // Lazy-init audio element
  useEffect(() => {
    const el = new Audio();
    el.preload = 'metadata';
    audioRef.current = el;

    const onTime = () => setCurrentTime(el.currentTime);
    const onMeta = () => setDuration(el.duration || 0);
    const onEnd = () => playNext();
    const onErr = () => {
      setError('Unable to stream this record. Check the archive URL.');
      setIsPlaying(false);
    };

    el.addEventListener('timeupdate', onTime);
    el.addEventListener('loadedmetadata', onMeta);
    el.addEventListener('ended', onEnd);
    el.addEventListener('error', onErr);
    return () => {
      el.removeEventListener('timeupdate', onTime);
      el.removeEventListener('loadedmetadata', onMeta);
      el.removeEventListener('ended', onEnd);
      el.removeEventListener('error', onErr);
      el.pause();
      if (crackleRef.current) crackleRef.current.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep volume in sync
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
    if (crackleRef.current) crackleRef.current.setLevel(vinylCrackle && isPlaying ? 0.5 * volume : 0);
  }, [volume, vinylCrackle, isPlaying]);

  const ensureCrackle = useCallback(() => {
    if (crackleRef.current) return crackleRef.current;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      const ctx = new Ctx();
      const el = audioRef.current;
      const src = ctx.createMediaElementSource(el);
      const crackle = createCrackleEngine(ctx, ctx.destination);
      src.connect(ctx.destination); // track audio plays through untouched
      crackleRef.current = crackle;
      return crackle;
    } catch (e) {
      console.warn('Web Audio unavailable for crackle:', e);
      return null;
    }
  }, []);

  const loadAndPlay = useCallback((track) => {
    const el = audioRef.current;
    if (!el || !track) return;
    setError(null);
    el.src = track.audioUrl;
    el.volume = volume;
    el.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    setCurrentTrack(track);
    setCurrentTime(0);
    setDuration(track.duration || 0);
  }, [volume]);

  const playFromQueue = useCallback((index) => {
    queueIndexRef.current = index;
    setQueue((q) => {
      if (q[index]) loadAndPlay(q[index]);
      return q;
    });
  }, [loadAndPlay]);

  /** Replace the queue and start at the given track */
  const playList = useCallback((tracks, startIndex = 0) => {
    if (!tracks || tracks.length === 0) return;
    queueIndexRef.current = startIndex;
    setQueue(tracks);
    loadAndPlay(tracks[startIndex]);
  }, [loadAndPlay]);

  /** Append a track to the queue (start it if nothing is playing) */
  const enqueue = useCallback((track) => {
    setQueue((q) => {
      const next = [...q, track];
      if (!audioRef.current?.src) {
        queueIndexRef.current = next.length - 1;
        loadAndPlay(track);
      }
      return next;
    });
  }, [loadAndPlay]);

  const playNext = useCallback(() => {
    setQueue((q) => {
      const nextIdx = queueIndexRef.current + 1;
      if (nextIdx < q.length) {
        queueIndexRef.current = nextIdx;
        loadAndPlay(q[nextIdx]);
      } else {
        setIsPlaying(false);
      }
      return q;
    });
  }, [loadAndPlay]);

  const playPrev = useCallback(() => {
    const el = audioRef.current;
    if (el && el.currentTime > 3) {
      el.currentTime = 0;
      return;
    }
    setQueue((q) => {
      const prevIdx = queueIndexRef.current - 1;
      if (prevIdx >= 0) {
        queueIndexRef.current = prevIdx;
        loadAndPlay(q[prevIdx]);
      }
      return q;
    });
  }, [loadAndPlay]);

  const togglePlay = useCallback(() => {
    const el = audioRef.current;
    if (!el || !currentTrack) return;
    if (el.paused) {
      el.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      el.pause();
      setIsPlaying(false);
    }
  }, [currentTrack]);

  const seek = useCallback((t) => {
    const el = audioRef.current;
    if (!el) return;
    el.currentTime = t;
    setCurrentTime(t);
  }, []);

  const rewind = useCallback((secs = 10) => {
    const el = audioRef.current;
    if (!el) return;
    el.currentTime = Math.max(0, el.currentTime - secs);
  }, []);

  const fastForward = useCallback((secs = 10) => {
    const el = audioRef.current;
    if (!el) return;
    el.currentTime = Math.min(duration, el.currentTime + secs);
  }, [duration]);

  const setVolume = useCallback((v) => {
    setVolumeState(Math.min(1, Math.max(0, v)));
  }, []);

  const toggleCrackle = useCallback(() => {
    setVinylCrackle((on) => {
      const next = !on;
      if (next) ensureCrackle();
      if (crackleRef.current) {
        crackleRef.current.setLevel(next && isPlaying ? 0.5 * volume : 0);
      }
      return next;
    });
  }, [ensureCrackle, isPlaying, volume]);

  const stop = useCallback(() => {
    const el = audioRef.current;
    if (el) el.pause();
    setIsPlaying(false);
    setCurrentTrack(null);
    setQueue([]);
    queueIndexRef.current = -1;
  }, []);

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        queue,
        isPlaying,
        currentTime,
        duration,
        volume,
        vinylCrackle,
        error,
        playList,
        enqueue,
        playNext,
        playPrev,
        togglePlay,
        seek,
        rewind,
        fastForward,
        setVolume,
        toggleCrackle,
        stop
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export const usePlayer = () => useContext(PlayerContext);
