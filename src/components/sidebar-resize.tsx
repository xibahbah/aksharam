"use client";
import { useEffect, useRef } from "react";

const storageKey = "aksharam.sidebar-width";
const initialWidth = 208;
const clamp = (width: number) => Math.max(208, Math.min(320, window.innerWidth * .32, width));

export function SidebarResize() {
  const handle = useRef<HTMLDivElement>(null);
  const width = useRef(initialWidth);
  const drag = useRef<{ x: number; width: number } | null>(null);
  const update = (next: number, save = false) => {
    width.current = clamp(next);
    handle.current?.closest<HTMLElement>(".app-shell")?.style.setProperty("--sidebar-width", `${width.current}px`);
    handle.current?.setAttribute("aria-valuenow", String(Math.round(width.current)));
    if (save) { try { localStorage.setItem(storageKey, String(width.current)); } catch {} }
  };
  useEffect(() => {
    try {
      const saved = Number(localStorage.getItem(storageKey));
      if (saved > 0 && Number.isFinite(saved)) update(saved);
    } catch {}
    const resize = () => update(width.current);
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);
  return <div ref={handle} className="sidebar-resize" role="separator" tabIndex={0}
    aria-label="Resize sidebar" aria-orientation="vertical" aria-valuemin={208}
    aria-valuemax={320} aria-valuenow={initialWidth} aria-controls="workspace-sidebar"
    title="Drag to resize · double-click to reset"
    onPointerDown={event => {
      if (event.button !== 0) return;
      event.preventDefault();
      event.currentTarget.focus();
      event.currentTarget.setPointerCapture(event.pointerId);
      drag.current = { x: event.clientX, width: width.current };
      event.currentTarget.dataset.dragging = "true";
    }}
    onPointerMove={event => {
      if (drag.current) update(drag.current.width + event.clientX - drag.current.x);
    }}
    onPointerUp={event => {
      if (!drag.current) return;
      drag.current = null;
      delete event.currentTarget.dataset.dragging;
      update(width.current, true);
      event.currentTarget.releasePointerCapture(event.pointerId);
    }}
    onLostPointerCapture={event => { drag.current = null; delete event.currentTarget.dataset.dragging; }}
    onDoubleClick={() => update(initialWidth, true)}
    onKeyDown={event => {
      const next = event.key === "ArrowLeft" ? width.current - 12
        : event.key === "ArrowRight" ? width.current + 12
        : event.key === "Home" ? initialWidth : event.key === "End" ? 320 : null;
      if (next !== null) { event.preventDefault(); update(next, true); }
    }}>
    <svg viewBox="0 0 24 800" preserveAspectRatio="none" aria-hidden="true">
      <path d="M13 3 C3 53 20 97 10 158 S20 249 12 308 S3 389 14 453 S20 532 10 602 S18 711 11 797" />
      <path className="sidebar-pencil" d="M15 23 C7 66 18 108 12 140 M13 328 Q5 380 15 425 M12 622 Q18 671 13 708" />
    </svg>
  </div>;
}
