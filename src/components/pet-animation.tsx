"use client";
import { useEffect, useLayoutEffect, useRef } from "react";
import { publicAssetPath } from "@/lib/paths";
import manifest from "@/lib/companion-frames.json";
export type AnimationMood = keyof typeof manifest;
const cache = new Map<string, Promise<HTMLImageElement>>();
function load(src: string) {
  let pending = cache.get(src);
  if (!pending) {
    pending = new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => { cache.delete(src); reject(new Error(`Could not load ${src}`)); };
      image.src = src;
    });
    cache.set(src, pending);
  }
  return pending;
}

// One persistent canvas retains its last drawing during every asset handoff.
// PNG playback also restarts reliably when a browser has cached a finished GIF.
export function PetAnimation({ mood, serial, onReady }: {
  mood: AnimationMood; serial: number; onReady?: (mood: AnimationMood) => void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const ready = useRef(onReady);
  useLayoutEffect(() => { ready.current = onReady; }, [onReady]);
  useEffect(() => {
    let cancelled = false;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    let generation = 0;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const entry = manifest[mood];
    const still = publicAssetPath(`/companion/${mood === "settling" || mood === "sleeping" ? "sleep-v1" : "v3"}/still.png`);
    const ctx = canvas.current?.getContext("2d");
    if (!ctx) return;
    const paint = (image: HTMLImageElement) => {
      // Clear and draw in the same JS task: no empty frame reaches the screen.
      ctx.clearRect(0, 0, 256, 256);
      ctx.drawImage(image, 0, 0, 256, 256);
    };
    const start = async () => {
      const token = ++generation;
      if (timeout) clearTimeout(timeout);
      const active = () => !cancelled && token === generation;
      try {
        const paths = media.matches ? [still] : entry.durations.map((_, i) =>
          publicAssetPath(`/companion/${entry.group}/${mood}-${String(i + 1).padStart(2, "0")}.png`));
        const frames = await Promise.all(paths.map(load));
        if (!active()) return;
        let index = 0;
        const next = () => {
          if (!active()) return;
          paint(frames[index]);
          const delay = entry.durations[index];
          index++;
          if (index === frames.length) {
            if (!entry.loop || media.matches) return; // Hold final pose.
            index = 0;
          }
          timeout = setTimeout(next, delay);
        };
        next();
        ready.current?.(mood);
      } catch {
        if (!active()) return;
        // Preserve the last drawing if a file fails, but do not trap nap controls.
        try { const fallback = await load(still); if (active()) paint(fallback); } catch {}
        if (active()) ready.current?.(mood);
      }
    };
    void start();
    media.addEventListener("change", start);
    return () => { cancelled = true; if (timeout) clearTimeout(timeout); media.removeEventListener("change", start); };
  }, [mood, serial]);
  return <canvas ref={canvas} className="pet-animation" width={256} height={256} aria-hidden="true" />;
}
