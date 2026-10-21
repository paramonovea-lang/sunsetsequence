// The persistent bottom player (docs/03, docs/06). Rendered once in Base.astro with
// transition:persist, so this component and its <audio> survive page navigation.
// It also handles every static [data-play] button on every page (one delegated listener)
// and keeps their state, the cycle counters and step strips in sync with playback.
import { useEffect, useRef } from 'preact/hooks';
import { useStore } from '@nanostores/preact';
import {
  $command, $current, $currentId, $duration, $isPlaying, $position, $queue,
  cycleAt, formatTime, playTrack, seekTo, step, stepAt, toggleTrack, type PlayerTrack,
} from '../stores/player';
import './DockedPlayer.css';

interface Props {
  tracks: PlayerTrack[];
  artist: string;
}

export default function DockedPlayer({ tracks, artist }: Props) {
  const audio = useRef<HTMLAudioElement>(null);
  // A seek that arrives before the audio's length is known; applied on loadedmetadata.
  const pendingSeek = useRef<{ frac: number } | { seconds: number } | null>(null);
  const current = useStore($current);
  const playing = useStore($isPlaying);
  const position = useStore($position);
  const duration = useStore($duration);
  const queue = useStore($queue);

  useEffect(() => $queue.set(tracks), [tracks]);

  // Commands from buttons anywhere → the one audio element.
  useEffect(
    () =>
      $command.listen((c) => {
        const a = audio.current;
        if (!a || !c) return;
        if (c.type === 'play') {
          const t = $queue.get().find((x) => x.id === c.id);
          if (!t) return;
          if ($currentId.get() !== t.id) {
            $currentId.set(t.id);
            $position.set(0);
            $duration.set(0);
            pendingSeek.current = c.at != null ? { frac: c.at } : null;
            a.src = t.audio;
            // Counted once per track start (components/Analytics.astro; gtag exists only on the live site).
            window.gtag?.('event', 'track_play', { track_id: t.id, track_title: t.title });
          } else if (c.at != null) {
            // Same track: seek now, or once the length is known (the first click can come before it).
            if (Number.isFinite(a.duration)) a.currentTime = c.at * a.duration;
            else pendingSeek.current = { frac: c.at };
          }
          a.play().catch(() => $isPlaying.set(false));
        } else if (c.type === 'pause') a.pause();
        else if (c.type === 'resume') a.play().catch(() => $isPlaying.set(false));
        else if (c.type === 'seek') {
          if (Number.isFinite(a.duration)) {
            a.currentTime = Math.max(0, Math.min(a.duration, c.seconds));
            $position.set(a.currentTime);
          } else pendingSeek.current = { seconds: Math.max(0, c.seconds) };
        }
      }),
    [],
  );

  // Smooth position while playing (timeupdate alone is ~4 per second, too slow for step strips).
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    const tick = () => {
      if (audio.current) $position.set(audio.current.currentTime);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  // Static buttons and live counters on the page.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const btn = (e.target as Element | null)?.closest?.<HTMLElement>('[data-play]');
      if (!btn?.dataset.play) return;
      e.preventDefault();
      toggleTrack(btn.dataset.play);
    };
    let raf = 0;
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(() => ((raf = 0), syncDom()));
    };
    document.addEventListener('click', onClick);
    document.addEventListener('astro:page-load', schedule);
    // A click that came before this island was ready (inline script in Base.astro).
    const w = window as unknown as { __sqPlayerReady?: boolean; __sqPendingPlay?: string };
    w.__sqPlayerReady = true;
    if (w.__sqPendingPlay) {
      toggleTrack(w.__sqPendingPlay);
      w.__sqPendingPlay = undefined;
    }
    const unsubs = [$currentId, $isPlaying, $position].map((s) => s.listen(schedule));
    schedule();
    return () => {
      document.removeEventListener('click', onClick);
      document.removeEventListener('astro:page-load', schedule);
      unsubs.forEach((u) => u());
    };
  }, []);

  // Media Session: lock screen / headphone controls.
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    const ms = navigator.mediaSession;
    const set = (action: MediaSessionAction, fn: MediaSessionActionHandler) => {
      try { ms.setActionHandler(action, fn); } catch { /* unsupported action */ }
    };
    set('play', () => $currentId.get() && toggleTrack($currentId.get()!));
    set('pause', () => audio.current?.pause());
    set('previoustrack', () => step(-1));
    set('nexttrack', () => step(1));
    set('seekto', (d) => d.seekTime != null && seekTo(d.seekTime));
  }, []);

  useEffect(() => {
    if (!current || !('mediaSession' in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: current.title,
      artist,
      album: current.id,
      artwork: [{ src: current.png, sizes: '1000x1000', type: 'image/png' }],
    });
  }, [current?.id]);

  useEffect(() => {
    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = playing ? 'playing' : current ? 'paused' : 'none';
  }, [playing, current?.id]);

  const index = queue.findIndex((t) => t.id === current?.id);
  const pct = duration ? (position / duration) * 100 : 0;

  return (
    <div class="sq-player" role="region" aria-label="Player" hidden={!current}>
      <audio
        ref={audio}
        preload="none"
        onPlay={() => $isPlaying.set(true)}
        onPause={() => $isPlaying.set(false)}
        onEnded={() => {
          $isPlaying.set(false);
          const next = $queue.get()[$queue.get().findIndex((t) => t.id === $currentId.get()) + 1];
          if (next) playTrack(next.id);
        }}
        onTimeUpdate={(e) => {
          const a = e.currentTarget;
          $position.set(a.currentTime);
          if (Number.isFinite(a.duration) && 'mediaSession' in navigator) {
            try { navigator.mediaSession.setPositionState({ duration: a.duration, position: a.currentTime, playbackRate: a.playbackRate }); } catch { /* ignore */ }
          }
        }}
        onLoadedMetadata={(e) => {
          const a = e.currentTarget;
          $duration.set(Number.isFinite(a.duration) ? a.duration : 0);
          const p = pendingSeek.current;
          if (p && Number.isFinite(a.duration)) a.currentTime = 'frac' in p ? p.frac * a.duration : Math.min(a.duration, p.seconds);
          pendingSeek.current = null;
        }}
        onDurationChange={(e) => $duration.set(Number.isFinite(e.currentTarget.duration) ? e.currentTarget.duration : 0)}
      />
      {current && (
        <div class="sq-player__inner">
          <span class="sq-player__cover" aria-hidden="true" dangerouslySetInnerHTML={{ __html: current.svg }} />
          <span class="sq-player__title">
            <span class="sq-player__name">{current.title}</span>
            <span class="sq-player__state">{current.id} · {playing ? 'playing' : 'paused'}</span>
          </span>
          <span class="sq-player__ctrl">
            <button type="button" class="sq-player__skip" aria-label="Previous" onClick={() => step(-1)}>
              <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 2v12M14 2L5 8l9 6z" fill="currentColor" stroke="currentColor" stroke-width="1.5" /></svg>
            </button>
            <button type="button" class="sq-player__pp" aria-label={playing ? 'Pause' : 'Play'} onClick={() => toggleTrack(current.id)}>
              {playing ? (
                <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><rect x="1" y="1" width="3.5" height="10" fill="currentColor" /><rect x="7.5" y="1" width="3.5" height="10" fill="currentColor" /></svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 14 14" aria-hidden="true"><path d="M3 1l10 6-10 6z" fill="currentColor" /></svg>
              )}
            </button>
            <button type="button" class="sq-player__skip" aria-label="Next" onClick={() => step(1)} disabled={index === -1 || index >= queue.length - 1}>
              <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M13 2v12M2 2l9 6-9 6z" fill="currentColor" stroke="currentColor" stroke-width="1.5" /></svg>
            </button>
          </span>
          <span class="sq-player__seek">
            <span>{formatTime(position)}</span>
            <input
              type="range"
              min={0}
              max={duration || 0}
              step="any"
              value={position}
              aria-label="Seek"
              aria-valuetext={`${formatTime(position)} of ${formatTime(duration)}`}
              style={{ '--p': `${pct}%` }}
              onInput={(e) => seekTo(Number(e.currentTarget.value))}
              onKeyDown={(e) => {
                if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
                e.preventDefault();
                seekTo($position.get() + (e.key === 'ArrowRight' ? 5 : -5));
              }}
            />
            <span>{formatTime(duration)}</span>
          </span>
          <a class="sq-player__link" href={`/tracks/${current.slug}/`}>Sheet</a>
          <a class="sq-player__link" href={`/tracks/${current.slug}/#code`}>Code ↗</a>
        </div>
      )}
    </div>
  );
}

/** Reflect player state in server-rendered markup: [data-play] buttons, cycle counters, step strips. */
function syncDom() {
  const id = $currentId.get();
  const playing = $isPlaying.get();
  const pos = $position.get();
  const cur = $current.get();
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.querySelectorAll<HTMLElement>('[data-play]').forEach((b) => {
    const state = b.dataset.play === id ? (playing ? 'playing' : 'paused') : 'idle';
    if (b.dataset.state === state) return;
    b.dataset.state = state;
    if (b.dataset.labelPlay) b.setAttribute('aria-label', state === 'playing' ? 'Pause' : b.dataset.labelPlay);
    const label = b.querySelector('.label');
    if (label && b.dataset.textPlay) label.textContent = state === 'playing' ? 'Pause' : b.dataset.textPlay;
  });

  const active = (el: HTMLElement, key: string) => !!cur && el.dataset[key] === cur.id && (playing || pos > 0);
  document.querySelectorAll<HTMLElement>('[data-cycle-for]').forEach((el) => {
    el.textContent = active(el, 'cycleFor') ? String(cycleAt(pos, cur!.bpm)) : (el.dataset.idle ?? '');
  });
  document.querySelectorAll<HTMLElement>('[data-steps-for]').forEach((el) => {
    const s = active(el, 'stepsFor') && !reduce ? stepAt(pos, cur!.bpm) : -1;
    [...el.children].forEach((c, i) => c.classList.toggle('on', i <= s));
  });
  document.querySelectorAll<HTMLElement>('[data-seq-for]').forEach((el) => {
    const s = active(el, 'seqFor') && !reduce ? stepAt(pos, cur!.bpm) : -1;
    el.querySelectorAll<HTMLElement>('[data-col]').forEach((c) => c.classList.toggle('now', Number(c.dataset.col) === s));
  });
}
