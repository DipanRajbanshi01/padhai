"use client";

import { useEffect, useId, useRef, useState } from "react";

/* Minimal typings for just the YouTube IFrame API surface we use. */
interface YTPlayer {
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  getCurrentTime(): number;
  getDuration(): number;
  setPlaybackRate(rate: number): void;
  getAvailablePlaybackRates(): number[];
  destroy(): void;
}
interface YTNamespace {
  Player: new (el: HTMLElement | string, opts: unknown) => YTPlayer;
  PlayerState: { ENDED: number; PLAYING: number; PAUSED: number };
}
declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

/** Lazily load the IFrame API and resolve once `window.YT` is ready. */
function loadYouTubeApi(): Promise<YTNamespace> {
  if (typeof window === "undefined") return new Promise(() => {});
  if (window.YT?.Player) return Promise.resolve(window.YT);

  return new Promise((resolve) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      if (window.YT) resolve(window.YT);
    };
    if (!document.getElementById("yt-iframe-api")) {
      const script = document.createElement("script");
      script.id = "yt-iframe-api";
      script.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(script);
    }
  });
}

export interface YouTubePlayerProps {
  videoId: string;
  /** Resume position (seconds). Ignored if the lesson is already completed. */
  startSeconds?: number;
  resume?: boolean;
  /** Throttled progress callback (seconds watched, whether ~finished). */
  onProgress?: (seconds: number, finished: boolean) => void;
  onComplete?: () => void;
}

const SAVE_INTERVAL_MS = 10_000;

export function YouTubePlayer({
  videoId,
  startSeconds = 0,
  resume = true,
  onProgress,
  onComplete,
}: YouTubePlayerProps) {
  const mountId = useId().replace(/:/g, "");
  const playerRef = useRef<YTPlayer | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Keep the latest callbacks/props without re-creating the player.
  const cbRef = useRef({ onProgress, onComplete, startSeconds, resume });
  useEffect(() => {
    cbRef.current = { onProgress, onComplete, startSeconds, resume };
  });

  const [rates, setRates] = useState<number[]>([0.5, 1, 1.5, 2]);
  const [rate, setRate] = useState(1);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let destroyed = false;

    function report(finished: boolean) {
      const p = playerRef.current;
      if (!p) return;
      const current = Math.floor(p.getCurrentTime() || 0);
      const duration = p.getDuration() || 0;
      const done = finished || (duration > 0 && current >= duration * 0.95);
      cbRef.current.onProgress?.(current, done);
      if (done) cbRef.current.onComplete?.();
    }

    function stopInterval() {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    loadYouTubeApi().then((YT) => {
      if (destroyed) return;
      playerRef.current = new YT.Player(`yt-${mountId}`, {
        videoId,
        playerVars: { rel: 0, modestbranding: 1, playsinline: 1 },
        events: {
          onReady: (e: { target: YTPlayer }) => {
            const player = e.target;
            if (cbRef.current.resume && cbRef.current.startSeconds > 1) {
              player.seekTo(cbRef.current.startSeconds, true);
            }
            try {
              const available = player.getAvailablePlaybackRates();
              if (available?.length) setRates(available);
            } catch {
              /* not always available immediately */
            }
            setReady(true);
          },
          onStateChange: (e: { data: number }) => {
            const state = window.YT?.PlayerState;
            if (!state) return;
            if (e.data === state.PLAYING) {
              stopInterval();
              intervalRef.current = setInterval(() => report(false), SAVE_INTERVAL_MS);
            } else if (e.data === state.PAUSED) {
              stopInterval();
              report(false);
            } else if (e.data === state.ENDED) {
              stopInterval();
              report(true);
            }
          },
        },
      });
    });

    return () => {
      destroyed = true;
      stopInterval();
      // Persist a final position on unmount (lesson switch / navigation).
      report(false);
      playerRef.current?.destroy?.();
      playerRef.current = null;
    };
  }, [videoId, mountId]);

  function changeRate(value: number) {
    setRate(value);
    playerRef.current?.setPlaybackRate(value);
  }

  return (
    <div>
      <div className="relative aspect-video w-full overflow-hidden rounded-card bg-deep shadow-soft">
        <div id={`yt-${mountId}`} className="absolute inset-0 h-full w-full" />
      </div>

      <div className="mt-3 flex items-center justify-end gap-2">
        <label htmlFor={`rate-${mountId}`} className="text-xs font-medium text-ink-soft">
          Speed
        </label>
        <select
          id={`rate-${mountId}`}
          value={rate}
          disabled={!ready}
          onChange={(e) => changeRate(Number(e.target.value))}
          className="h-8 rounded-pill border border-line bg-paper px-3 text-xs text-ink shadow-soft focus-visible:border-crimson focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-crimson/30 disabled:opacity-50"
        >
          {rates.map((r) => (
            <option key={r} value={r}>
              {r}×
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
