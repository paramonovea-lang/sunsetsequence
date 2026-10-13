// Track-page waveform from precomputed peaks (docs/06). A view of the player store:
// it shows the played part in accent when this track is the current one, and seeks on click/keys.
import { useStore } from '@nanostores/preact';
import './Waveform.css';
import { $currentId, $duration, $isPlaying, $position, cycleAt, formatTime, playTrack, seekTo } from '../stores/player';

interface Props {
  id: string;
  title: string;
  bars: number[] | null; // 0–1, null = no peaks yet
  bpm: number;
  totalCycles: string; // "64" or "[total]"
  lengthText: string; // shown until the audio's real duration is known
}

const FLAT = Array.from({ length: 64 }, () => 0.08);

export default function Waveform({ id, title, bars, bpm, totalCycles, lengthText }: Props) {
  const currentId = useStore($currentId);
  const position = useStore($position);
  const duration = useStore($duration);
  const playing = useStore($isPlaying);
  const isCurrent = currentId === id;
  const data = bars && bars.length ? bars : FLAT;
  const frac = isCurrent && duration ? position / duration : 0;
  const started = isCurrent && (playing || position > 0);

  const seekFrac = (f: number) => {
    f = Math.max(0, Math.min(1, f));
    if (isCurrent && duration) seekTo(f * duration);
    else playTrack(id, f);
  };

  return (
    <div class="sq-wave">
      <div
        class="sq-wave__bars"
        role="slider"
        tabIndex={0}
        aria-label={`Seek in ${title}`}
        aria-valuemin={0}
        aria-valuemax={Math.round(duration) || 0}
        aria-valuenow={isCurrent ? Math.round(position) : 0}
        aria-valuetext={isCurrent ? `${formatTime(position)} of ${formatTime(duration)}` : 'Not playing'}
        onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          seekFrac((e.clientX - r.left) / r.width);
        }}
        onKeyDown={(e) => {
          if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
          e.preventDefault();
          if (isCurrent && duration) seekTo(position + (e.key === 'ArrowRight' ? 5 : -5));
        }}
      >
        <svg viewBox={`0 0 ${data.length} 100`} preserveAspectRatio="none" aria-hidden="true">
          {data.map((h, i) => {
            const height = Math.max(4, h * 100);
            return (
              <rect
                x={i + 0.15}
                y={(100 - height) / 2}
                width={0.7}
                height={height}
                class={(i + 0.5) / data.length <= frac ? 'played' : bars ? 'ahead' : 'empty'}
              />
            );
          })}
        </svg>
      </div>
      <div class="sq-wave__times">
        <span>{formatTime(isCurrent ? position : 0)}</span>
        <span>cycle {started ? cycleAt(position, bpm) : '[n]'} / {totalCycles}</span>
        <span>{isCurrent && duration ? formatTime(duration) : lengthText}</span>
      </div>
    </div>
  );
}
