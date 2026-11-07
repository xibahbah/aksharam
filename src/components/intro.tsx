"use client";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { gsap } from "gsap";
import { CREAM, COLORS, star } from "./intro-art";
import { createIntroTimeline, INTRO_DURATION } from "./intro-motion";
import styles from "./intro.module.css";

export function Intro({ onDone }: { onDone: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  const start = useRef<HTMLButtonElement>(null);
  const timeline = useRef<gsap.core.Timeline | null>(null);
  const exitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [leaving, setLeaving] = useState(false);
  const titleId = useId();
  const orbitId = useId();

  const finish = useCallback(() => {
    if (exitTimer.current !== null) return;
    setLeaving(true);
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    exitTimer.current = setTimeout(onDone, reduce ? 0 : 500);
  }, [onDone]);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // The landing overlays the app shell; keep its hidden navigation out of Tab order.
    const siblings: { node: HTMLElement; inert: boolean }[] = [];
    let ancestor: HTMLElement = el;
    while (ancestor.parentElement) {
      for (const node of ancestor.parentElement.children) {
        if (node !== ancestor && node instanceof HTMLElement) {
          siblings.push({ node, inert: node.inert });
          node.inert = true;
        }
      }
      ancestor = ancestor.parentElement;
      if (ancestor === document.body) break;
    }
    el.focus({ preventScroll: true });
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") finish();
      if (event.key !== "Tab") return;
      const buttons = Array.from(el.querySelectorAll<HTMLButtonElement>("button"));
      const first = buttons[0], last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault(); last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first?.focus();
      }
    };
    el.addEventListener("keydown", key);
    return () => {
      if (exitTimer.current !== null) clearTimeout(exitTimer.current);
      document.body.style.overflow = oldOverflow;
      siblings.forEach(({ node, inert }) => { node.inert = inert; });
      el.removeEventListener("keydown", key);
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, [finish]);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const media = gsap.matchMedia();
    media.add({ reduce: "(prefers-reduced-motion: reduce)", motion: "(prefers-reduced-motion: no-preference)" }, (context) => {
      const tl = createIntroTimeline(el);
      timeline.current = tl;
      if (context.conditions?.reduce) tl.progress(1).pause();
      let active = true;
      if (!context.conditions?.reduce) void (document.fonts?.ready ?? Promise.resolve()).then(() => {
        if (!active) return;
        context.add(() => {
          const track = el.querySelector<SVGPathElement>("[data-track]");
          const text = el.querySelector<SVGTextElement>("[data-orbit] text");
          const copies = el.querySelectorAll<SVGTextPathElement>("[data-orbit-copy]");
          if (!track?.getTotalLength || !text?.getComputedTextLength) return;
          const length = track.getTotalLength();
          const fits = Math.max(1, Math.floor(length / (text.getComputedTextLength() + 14)));
          const spacing = length / fits;
          const state = { offset: 0 };
          const place = () => copies.forEach((copy, i) => copy.setAttribute("startOffset", String(state.offset + (i - 1) * spacing)));
          place();
          gsap.to(state, { offset: spacing, duration: 24 / fits, ease: "none", repeat: -1, onUpdate: place });
        });
      });
      return () => { active = false; timeline.current = null; };
    });
    return () => media.revert();
  }, []);

  return (
    <div ref={root} className={`${styles.stage} ${leaving ? styles.leaving : ""}`} role="dialog" tabIndex={-1} aria-modal="true" aria-labelledby={titleId}>
      <header className={styles.header}>
        <span className={styles.brand}>aksharam<span lang="ml">അക്ഷരം</span></span>
        <div className={styles.actions}>
          <button className={styles.textButton} onClick={() => {
            if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
            timeline.current?.restart(false, false);
          }}>Replay ↻</button>
          <button className={styles.textButton} onClick={() => timeline.current?.progress(1).pause()}>Skip animation ↗</button>
        </div>
      </header>
      <div className={styles.words} data-words aria-hidden="true">
        {["Letters", "Sounds", "Words", "അക്ഷരം"].map(word => <span key={word} data-word lang={word === "അക്ഷരം" ? "ml" : "en"}>{word}</span>)}
      </div>
      {["a", "b"].map((cross, i) => <svg key={cross} data-cross={cross} className={`${styles.cross} ${i ? styles.crossB : styles.crossA}`} viewBox="-40 -40 80 80" aria-hidden="true"><path d={star(36)} /></svg>)}
      <div className={styles.scene} data-scene>
        <svg className={styles.art} viewBox="0 0 1200 820" aria-hidden="true" focusable="false">
          <defs><path id={orbitId} data-track d="M 215 25 H 985 A 150 150 0 0 1 1135 175 V 650 A 150 150 0 0 1 985 800 H 215 A 150 150 0 0 1 65 650 V 175 A 150 150 0 0 1 215 25 Z" /></defs>
          <g data-orbit className={styles.orbit} opacity="0">
            {Array.from({ length: 12 }, (_, i) => <text key={i}><textPath href={`#${orbitId}`} data-orbit-copy startOffset={i * 470} lang="ml">അക്ഷരം • LEARN TO READ MALAYALAM •</textPath></text>)}
          </g>
          <g fill={CREAM}>
            {[0, 1, 2].map(i => <path key={i} data-body d={star(86, 600, 410)} />)}
          </g>
          <g transform="translate(600 410)">
            <g data-flower-position>
              {COLORS.map((color) => <path key={color} data-petal fill={color} d={star(.01)} />)}
            </g>
          </g>
        </svg>
      </div>
      <div className={styles.caption}>
        <div data-caption><h1 id={titleId}>A new world, one letter at a time.</h1><p className={styles.description}>Learn to read Malayalam.</p></div>
        <button ref={start} className={styles.start} onClick={finish}>Start <span aria-hidden="true">↗</span></button>
      </div>
      {process.env.NODE_ENV === "development" && <label className={styles.scrubber}>
        Motion study
        <input aria-label="Animation progress" type="range" min="0" max={INTRO_DURATION} step="0.01" defaultValue="0" onChange={(event) => timeline.current?.pause().time(Number(event.target.value))} />
      </label>}
    </div>
  );
}
